const {loadUnified}=require('../services/unifiedData');
const db=require('../config/db');
async function dashboardAnalytics(req,res,next){try{
 const campus=await loadUnified(req.user);
 const where=req.user.role==='FACULTY'?'WHERE s.department=?':'',params=req.user.role==='FACULTY'?[req.user.department||'']:[];
 const [[tasks]]=await db.query(`SELECT COUNT(*) AS total,SUM(i.status='COMPLETED') AS completed FROM interventions i JOIN students s ON s.id=i.student_id ${where}`,params);
 res.json({success:true,analytics:{...campus.summary,highRisk:campus.students.filter(s=>s.risk.academic.level==='HIGH'||s.risk.placement.level==='HIGH').length,interventionCompletion:tasks.total?Math.round(Number(tasks.completed)/tasks.total*100):null},note:'Task completion is not evidence of intervention effectiveness.'});
}catch(e){next(e);}}
async function riskDistribution(req,res,next){try{const campus=await loadUnified(req.user);res.json({success:true,data:['academic','placement'].flatMap(domain=>['LOW','MEDIUM','HIGH',null].map(level=>({domain,risk_level:level||'UNKNOWN',count:campus.students.filter(s=>s.risk[domain].level===level).length})))});}catch(e){next(e);}}
async function segments(req,res,next){try{const campus=await loadUnified(req.user),counts=new Map();for(const s of campus.students)for(const segment of s.segments){if(!counts.has(segment.key))counts.set(segment.key,{segment_name:segment.label,key:segment.key,count:0,definition:segment.definition});counts.get(segment.key).count++;}res.json({success:true,data:[...counts.values()],note:'Segments overlap; each count represents distinct students.'});}catch(e){next(e);}}
module.exports={dashboardAnalytics,riskDistribution,segments};
