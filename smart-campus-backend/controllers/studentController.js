const db=require('../config/db');
const {loadUnified}=require('../services/unifiedData');
const {categoryScore}=require('../services/successEngine');
async function getStudents(req,res,next){try{
 const campus=await loadUnified(req.user);
 const students=campus.students.map(s=>({id:s.id,student_id:s.campusId,name:s.name,email:s.email,department:s.department,year_level:s.year,cgpa:s.data.academic?.cgpa??null,success_score:s.successScore,risk_score:s.successScore==null?null:Math.round((100-s.successScore)*100)/100,academic_risk:s.risk.academic.level,placement_risk:s.risk.placement.level,coverage:s.coverage,attendance:s.data.attendance?.overall??null,lms:categoryScore('lms',s.data.lms).score,engagement:categoryScore('engagement',s.data.engagement).score,coding:s.data.placement?.coding??null,aptitude:s.data.placement?.aptitude??null,interview:s.data.placement?.interview??null,skills:categoryScore('skills',s.data.skills).score,feedback:categoryScore('feedback',s.data.feedback).score,segment:s.segments.map(g=>g.label).join('; ')||'No current segment match'}));
 res.json({success:true,count:students.length,students});
}catch(e){next(e);}}
async function getStudentProfile(req,res,next){try{const campus=await loadUnified(req.user,{studentId:req.params.id});if(!campus.students.length)return res.status(404).json({success:false,message:'Student not found within your account scope.'});res.json({success:true,student:campus.students[0]});}catch(e){next(e);}}
async function analyzeStudent(req,res,next){
 let c;try{
  const campus=await loadUnified(req.user,{studentId:req.params.id}),s=campus.students[0];
  if(!s)return res.status(404).json({success:false,message:'Student not found within your account scope.'});
  if(s.successScore==null)return res.status(422).json({success:false,message:'Verified indicators are needed before scoring.'});
  c=await db.getConnection();await c.beginTransaction();
  const values=s.drivers.map(d=>d.score);
  await c.query('INSERT INTO success_scores (student_id,academic_score,attendance_score,lms_score,engagement_score,placement_score,skills_score,feedback_score,success_score) VALUES (?,?,?,?,?,?,?,?,?)',[s.id,...values,s.successScore]);
  const level=s.risk.academic.level==='HIGH'||s.risk.placement.level==='HIGH'?'HIGH':s.risk.academic.level==='MEDIUM'||s.risk.placement.level==='MEDIUM'?'MEDIUM':'LOW';
  await c.query('INSERT INTO risk_assessments (student_id,risk_score,risk_level,explanation) VALUES (?,?,?,?)',[s.id,100-s.successScore,level,JSON.stringify(s.risk)]);
  for(const segment of s.segments)await c.query('INSERT INTO segments (student_id,segment_name,description) VALUES (?,?,?)',[s.id,segment.label,segment.definition]);
  await c.commit();res.json({success:true,student:s,note:'Snapshot saved. Risk intensity is a score complement, not a failure probability.'});
 }catch(e){if(c)await c.rollback();next(e);}finally{if(c)c.release();}
}
module.exports={getStudents,getStudentProfile,analyzeStudent};
