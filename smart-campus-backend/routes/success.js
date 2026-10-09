const express=require('express'),db=require('../config/db');
const {authenticate,authorize}=require('../middleware/auth');
const {loadUnified,previewStudent}=require('../services/unifiedData');
const {normalizeImport,hash}=require('../services/sourceImport');
const {DEFINITIONS}=require('../services/successEngine');
const router=express.Router();
router.get('/demo',(req,res)=>res.json(require('../services/demoCampus')()));
router.post('/demo/import-preview',(req,res)=>{try{const result=normalizeImport(req.body),campus=require('../services/demoCampus')(),byId=new Map(campus.students.map(s=>[s.campusId,s]));for(const r of result.records)if(!byId.has(r.studentId))result.errors.push({row:r.row,message:'Use a synthetic DEMO student ID in demo mode.'});res.json({success:true,...result,canCommit:false,notice:'Validation preview only. No database records are read or saved.',preview:result.records.filter(r=>byId.has(r.studentId)).map(r=>({studentId:r.studentId,name:byId.get(r.studentId).name,before:byId.get(r.studentId).successScore,after:previewStudent(byId.get(r.studentId),[r],campus.configuration).successScore}))});}catch(e){res.status(400).json({success:false,message:e.message});}});
router.use(authenticate);
router.get('/overview',async(req,res,next)=>{try{res.json({success:true,mode:'LIVE',role:req.user.role,...await loadUnified(req.user)});}catch(e){next(e);}});
router.get('/settings',async(req,res,next)=>{try{res.json({success:true,configuration:await require('../services/successConfiguration').readConfiguration(db)});}catch(e){next(e);}});
router.put('/settings',authorize('ADMIN'),async(req,res,next)=>{
 let c;try{
  let settings;try{settings=require('../services/successConfiguration').configuration(req.body.configuration);}catch(e){return res.status(400).json({success:false,message:e.message});}
  if(typeof req.body.reason!=='string'||!req.body.reason.trim()||req.body.reason.length>1000)return res.status(400).json({success:false,message:'Provide a reason for the configuration change.'});
  c=await db.getConnection();await c.beginTransaction();
  const [previous]=await c.query('SELECT configuration FROM student_success_settings WHERE id=1 FOR UPDATE');
  await c.query('INSERT INTO student_success_settings (id,configuration,updated_by) VALUES (1,?,?) ON DUPLICATE KEY UPDATE configuration=?,updated_by=?',[JSON.stringify(settings),req.user.id,JSON.stringify(settings),req.user.id]);
  await c.query('INSERT INTO review_audit (actor_id,action,target_id,details) VALUES (?,?,?,?)',[req.user.id,'SUCCESS_CONFIGURATION_UPDATED',1,JSON.stringify({previous:previous[0]?.configuration??null,configuration:settings,reason:req.body.reason.trim()})]);
  await c.commit();res.json({success:true,configuration:settings,message:'Weights and rules saved. Historical observations are recalculated using the current configuration.'});
 }catch(e){if(c)await c.rollback();next(e);}finally{if(c)c.release();}
});
router.get('/import-template',authorize('FACULTY','ADMIN'),(req,res)=>res.json({success:true,categories:DEFINITIONS,format:'Each record contains studentId, category, measuredAt, source and values. Percentages must use a 0–100 scale.'}));
router.post('/imports',authorize('FACULTY','ADMIN'),async(req,res,next)=>{
 let c;
 try{
  let result;try{result=normalizeImport(req.body);}catch(e){return res.status(400).json({success:false,message:e.message});}
  const campus=await loadUnified(req.user),byId=new Map(campus.students.map(s=>[s.campusId,s]));
  for(const r of result.records)if(!byId.has(r.studentId))result.errors.push({row:r.row,message:`Student ${r.studentId} is unregistered or outside your account scope.`});
  result.canCommit=!result.errors.length;
  const groups=new Map();for(const r of result.records.filter(r=>byId.has(r.studentId))){if(!groups.has(r.studentId))groups.set(r.studentId,[]);groups.get(r.studentId).push(r);}
  result.preview=[...groups].map(([id,records])=>{const before=byId.get(id),after=previewStudent(before,records,campus.configuration);return {studentId:id,name:before.name,before:before.successScore,after:after.successScore,coverage:after.coverage,academicRisk:after.risk.academic.level,placementRisk:after.risk.placement.level};});
  if(req.body.commit!==true)return res.json({success:true,...result});
  if(!result.canCommit)return res.status(400).json({success:false,message:'Fix all import errors before committing.',...result});
  if(!campus.integrationReady)return res.status(503).json({success:false,message:'Run npm run migrate:sources to prepare source import tables.'});
  if(req.body.verified!==true||typeof req.body.verificationNote!=='string'||!req.body.verificationNote.trim()||req.body.verificationNote.length>1000)return res.status(400).json({success:false,message:'Confirm verification and provide a verification note.'});
  const sorted=[...result.records].sort((a,b)=>a.recordHash.localeCompare(b.recordHash));
  c=await db.getConnection();await c.beginTransaction();
  // Recheck department membership inside the transaction to avoid stale scope decisions.
  for(const id of [...new Set(sorted.map(r=>byId.get(r.studentId).id))].sort((a,b)=>a-b)){
   const [rows]=await c.query('SELECT department FROM students WHERE id=? FOR UPDATE',[id]);
   if(!rows.length||(req.user.role==='FACULTY'&&rows[0].department!==req.user.department)){await c.rollback();return res.status(403).json({success:false,message:'Student scope changed. Preview the import again.'});}
  }
  const [batch]=await c.query('INSERT INTO source_import_batches (actor_id,batch_hash,record_count,verification_note) VALUES (?,?,?,?)',[req.user.id,hash(sorted.map(r=>r.recordHash)),sorted.length,req.body.verificationNote.trim()]);
  for(const r of sorted)await c.query('INSERT INTO student_source_records (batch_id,student_id,category,indicator_values,source_reference,measured_at,verified_by,record_hash) VALUES (?,?,?,?,?,?,?,?)',[batch.insertId,byId.get(r.studentId).id,r.category,JSON.stringify(r.values),r.source,new Date(r.measuredAt),req.user.id,r.recordHash]);
  await c.query('INSERT INTO review_audit (actor_id,action,target_id,details) VALUES (?,?,?,?)',[req.user.id,'VERIFIED_SOURCE_IMPORT',batch.insertId,JSON.stringify({recordCount:sorted.length,categories:[...new Set(sorted.map(r=>r.category))],verificationNote:req.body.verificationNote.trim()})]);
  await c.commit();res.status(201).json({success:true,batchId:batch.insertId,imported:sorted.length,message:'Verified source records imported.'});
 }catch(e){if(c)await c.rollback();if(e.code==='ER_DUP_ENTRY')return res.status(409).json({success:false,message:'This batch or a source record has already been imported. Nothing was saved.'});next(e);}finally{if(c)c.release();}
});
router.post('/students/:id/recommendations/:key',authorize('FACULTY','ADMIN'),async(req,res,next)=>{
 let c;
 try{
  if(!/^\d+$/.test(req.params.id))return res.status(400).json({success:false,message:'Invalid student ID.'});
  c=await db.getConnection();await c.beginTransaction();
  const [locked]=await c.query('SELECT department FROM students WHERE id=? FOR UPDATE',[req.params.id]);
  if(!locked.length||(req.user.role==='FACULTY'&&locked[0].department!==req.user.department)){await c.rollback();return res.status(403).json({success:false,message:'Student outside your account scope.'});}
  const campus=await loadUnified(req.user,{connection:c,studentId:req.params.id}),student=campus.students[0],action=student?.recommendations.find(a=>a.key===req.params.key);
  if(!action){await c.rollback();return res.status(404).json({success:false,message:'No current recommendation for this indicator.'});}
  const [existing]=await c.query("SELECT id FROM interventions WHERE student_id=? AND title=? AND status IN ('ASSIGNED','IN_PROGRESS')",[student.id,action.title]);
  if(existing.length){await c.rollback();return res.status(409).json({success:false,message:'An active task already exists for this recommendation.'});}
  const [result]=await c.query("INSERT INTO interventions (student_id,assigned_by,title,description,status,before_success_score,before_risk_score) VALUES (?,?,?,?,'ASSIGNED',?,?)",[student.id,req.user.id,action.title,action.task+'\nWhy: '+action.why+'\nResponsible: '+action.responsibleRole+'\nSuggested review date: '+action.reviewDate,student.successScore,student.successScore==null?null:100-student.successScore]);
  await c.query("INSERT INTO agent_intervention_events (intervention_id,actor_id,status,evidence) VALUES (?,?,'ASSIGNED',?)",[result.insertId,req.user.id,'Faculty-approved proposal based on unified source records.']);
  await c.commit();res.status(201).json({success:true,interventionId:result.insertId,message:'Assigned to the student task inbox.'});
 }catch(e){if(c)await c.rollback();next(e);}finally{if(c)c.release();}
});
module.exports=router;
