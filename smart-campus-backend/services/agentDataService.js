const db=require('../config/db');
async function loadStudent(id){
 const [students]=await db.query('SELECT id,user_id,department,student_id FROM students WHERE id=?',[id]);
 if(!students.length)return null;
 const [performance]=await db.query('SELECT * FROM student_performance WHERE student_id=?',[id]);
 const [observations]=await db.query('SELECT indicators,measured_at,source_reference FROM agent_observations WHERE student_id=? ORDER BY measured_at ASC,id ASC',[id]);
 const indicators={}, provenance={};
 const parse=value=>typeof value==='string'?JSON.parse(value):value;
 if(performance[0])for(const key of ['attendance','lms','engagement','coding','aptitude','interview','skills','feedback']){
  indicators[key]=Number(performance[0][key]);provenance[key]={source:'Faculty-approved performance submission',at:performance[0].updated_at};
 }
 const marksHistory=[];
 for(const observation of observations){
  const values=parse(observation.indicators);
  for(const [key,value]of Object.entries(values)){
   if(key==='marksHistory')continue;
   // Use the freshest verified measurement for each field.
   if(!provenance[key]||new Date(observation.measured_at)>=new Date(provenance[key].at)){indicators[key]=value;provenance[key]={source:observation.source_reference,at:observation.measured_at};}
  }
  if(values.marks!=null)marksHistory.push({date:new Date(observation.measured_at).toISOString(),value:values.marks});
 }
 indicators.marksHistory=marksHistory;
 return {...students[0],indicators,provenance};
}
async function loadRoster(user){
 const [rows]=await db.query(`SELECT id FROM students ${user.role==='FACULTY'?'WHERE department=?':''}`,user.role==='FACULTY'?[user.department||'']:[]);
 const students=[];for(const row of rows)students.push(await loadStudent(row.id));return students;
}
module.exports={loadStudent,loadRoster};
