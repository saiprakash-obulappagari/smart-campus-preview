const express=require('express');
const db=require('../config/db');
const {authenticate,authorize}=require('../middleware/auth');
const scope=require('../middleware/studentScope');
const {loadStudent,loadRoster}=require('../services/agentDataService');
const {scoreAgent,validate,percentages}=require('../agents/scoreAgent');
const riskAgent=require('../agents/riskAgent');
const interventionAgent=require('../agents/interventionAgent');
const segmentationAgent=require('../agents/segmentationAgent');
const {configure}=require('../agents/config');
const router=express.Router();router.use(authenticate);
const config=configure(process.env.AGENT_RULES_JSON?JSON.parse(process.env.AGENT_RULES_JSON):{});
router.param('id',(req,res,next,id)=>{if(!/^\d+$/.test(id)||!Number.isSafeInteger(Number(id))||Number(id)<1)return res.status(400).json({success:false,message:'Invalid student ID'});next();});
router.get('/segments',authorize('FACULTY','ADMIN'),async(req,res,next)=>{
 try{res.json({success:true,...segmentationAgent(await loadRoster(req.user),config)});}catch(error){next(error);}
});
for(const [endpoint,agent] of [['scores',scoreAgent],['risk',riskAgent],['recommendations',interventionAgent]])router.get(`/students/:id/${endpoint}`,scope,async(req,res,next)=>{
 try{const student=await loadStudent(req.params.id);if(!student)return res.status(404).json({success:false,message:'Student not found'});res.json({success:true,studentId:student.id,provenance:student.provenance,...agent(student.indicators,config)});}catch(error){next(error);}
});
router.post('/students/:id/observations',authorize('FACULTY','ADMIN'),scope,async(req,res,next)=>{
 try{
  const {indicators,sourceReference,measuredAt}=req.body;
  try{validate(indicators);}catch(error){return res.status(400).json({success:false,message:error.message});}
  const allowed=[...percentages,'backlogs'];
  if(!Object.keys(indicators).length||Object.keys(indicators).some(key=>!allowed.includes(key)||indicators[key]==null)||typeof sourceReference!=='string'||!sourceReference.trim()||sourceReference.length>1000||typeof measuredAt!=='string'||!Number.isFinite(Date.parse(measuredAt))||Date.parse(measuredAt)>Date.now())return res.status(400).json({success:false,message:'Provide valid indicators, a verified source reference and a non-future measurement date.'});
  const student=await loadStudent(req.params.id);if(!student)return res.status(404).json({success:false,message:'Student not found'});
  const [result]=await db.query('INSERT INTO agent_observations (student_id,indicators,source_reference,verified_by,measured_at) VALUES (?,?,?,?,?)',[student.id,JSON.stringify(indicators),sourceReference.trim(),req.user.id,new Date(measuredAt)]);
  res.status(201).json({success:true,observationId:result.insertId,message:'Verified observation recorded.'});
 }catch(error){next(error);}
});
router.post('/students/:id/recommendations/:key/approve',authorize('FACULTY','ADMIN'),scope,async(req,res,next)=>{
 let c;
 try{
  c=await db.getConnection();await c.beginTransaction();
  const [studentLock]=await c.query('SELECT id FROM students WHERE id=? FOR UPDATE',[req.params.id]);
  if(!studentLock.length){await c.rollback();return res.status(404).json({success:false,message:'Student not found'});}
  const student=await loadStudent(req.params.id),recommendation=interventionAgent(student.indicators,config).recommendations.find(item=>item.key===req.params.key);
  if(!recommendation){await c.rollback();return res.status(404).json({success:false,message:'No current recommendation for this indicator.'});}
  const [existing]=await c.query("SELECT id FROM interventions WHERE student_id=? AND title=? AND status IN ('ASSIGNED','IN_PROGRESS')",[student.id,recommendation.title]);
  if(existing.length){await c.rollback();return res.status(409).json({success:false,message:'An active intervention already exists.'});}
  const [result]=await c.query("INSERT INTO interventions (student_id,assigned_by,title,description,status) VALUES (?,?,?,?,'ASSIGNED')",[student.id,req.user.id,recommendation.title,recommendation.task+'\nReason: '+recommendation.why]);
  await c.query("INSERT INTO agent_intervention_events (intervention_id,actor_id,status,evidence) VALUES (?,?,'ASSIGNED',?)",[result.insertId,req.user.id,'Faculty approved recommendation based on verified indicators.']);
  await c.commit();res.status(201).json({success:true,interventionId:result.insertId,status:'ASSIGNED',outcome:'NOT_EVALUATED'});
 }catch(error){if(c)await c.rollback();next(error);}finally{if(c)c.release();}
});
router.post('/interventions/:interventionId/outcomes',authorize('FACULTY','ADMIN'),async(req,res,next)=>{
 let c;
 try{
  const {status,evidence,notes}=req.body;
  if(!/^\d+$/.test(req.params.interventionId)||!['IN_PROGRESS','COMPLETED'].includes(status)||typeof evidence!=='string'||!evidence.trim()||evidence.length>4000||typeof notes!=='string'||!notes.trim()||notes.length>4000)return res.status(400).json({success:false,message:'Valid status, outcome notes and supporting evidence are required.'});
  c=await db.getConnection();await c.beginTransaction();
  const [rows]=await c.query('SELECT i.status,s.department FROM interventions i JOIN students s ON s.id=i.student_id WHERE i.id=? FOR UPDATE',[req.params.interventionId]);
  if(!rows.length||(req.user.role==='FACULTY'&&rows[0].department!==req.user.department)){await c.rollback();return res.status(403).json({success:false,message:'Intervention outside your scope.'});}
  if(rows[0].status==='COMPLETED'){await c.rollback();return res.status(409).json({success:false,message:'Intervention already completed.'});}
  await c.query('UPDATE interventions SET status=?,faculty_feedback=? WHERE id=?',[status,notes,req.params.interventionId]);
  await c.query('INSERT INTO agent_intervention_events (intervention_id,actor_id,status,evidence,outcome_notes) VALUES (?,?,?,?,?)',[req.params.interventionId,req.user.id,status,evidence,notes]);
  await c.commit();res.json({success:true,status,outcome:'EVIDENCE_RECORDED',message:'Completion is recorded; effectiveness has not been inferred.'});
 }catch(error){if(c)await c.rollback();next(error);}finally{if(c)c.release();}
});
router.get('/interventions/:interventionId/events',async(req,res,next)=>{
 try{
  const [rows]=await db.query('SELECT s.user_id,s.department FROM interventions i JOIN students s ON s.id=i.student_id WHERE i.id=?',[req.params.interventionId]);
  if(!rows.length||(req.user.role==='STUDENT'&&rows[0].user_id!==req.user.id)||(req.user.role==='FACULTY'&&rows[0].department!==req.user.department))return res.status(403).json({success:false,message:'Access denied'});
  const [events]=await db.query('SELECT status,evidence,outcome_notes,created_at FROM agent_intervention_events WHERE intervention_id=? ORDER BY id',[req.params.interventionId]);res.json({success:true,events});
 }catch(error){next(error);}
});
module.exports=router;
