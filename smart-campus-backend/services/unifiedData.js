const {assess,cleanCategory,summarize}=require('./successEngine');
const parse=v=>typeof v==='string'?JSON.parse(v):v;
const timestamp=v=>v instanceof Date?v.getTime():Date.parse(v);
const TABLES={
 academic_data:['academic',{average_marks:'marks',backlogs:'backlogs',subject_performance:'subjectPerformance'}],
 attendance:['attendance',{overall_percentage:'overall',subject_wise:'subjects'}],
 lms_activity:['lms',{login_frequency:'loginFrequency',assignment_completion:'assignmentCompletion',learning_activity:'learningActivity'}],
 engagement:['engagement',{events_score:'events',clubs_score:'clubs',hackathon_score:'hackathons',certification_score:'certifications'}],
 placement:['placement',{coding_score:'coding',aptitude_score:'aptitude',mock_interview_score:'interview',readiness_score:'readiness'}],
 skills:['skills',{technical_score:'technical',soft_skill_score:'soft',assessment_score:'assessment'}],
 feedback:['feedback',{student_satisfaction:'satisfaction',faculty_feedback:'faculty'}]
};
function performanceToData(p){return {attendance:{overall:p.attendance},lms:{assignmentCompletion:p.lms},engagement:{events:p.engagement},placement:{coding:p.coding,aptitude:p.aptitude,interview:p.interview},skills:{technical:p.skills},feedback:{faculty:p.feedback}};}
function observationToData(p){
 const data={};
 for(const [from,category,key]of [['attendance','attendance','overall'],['marks','academic','marks'],['backlogs','academic','backlogs'],['assignments','lms','assignmentCompletion'],['lms','lms','learningActivity'],['engagement','engagement','events'],['coding','placement','coding'],['aptitude','placement','aptitude'],['interview','placement','interview'],['skills','skills','technical'],['feedback','feedback','faculty']])if(p[from]!=null)(data[category]??={})[key]=p[from];
 return data;
}
function buildStudent(profile,base=[],events=[],overrides={}){
 const data={},provenance={},quality=[],dated={},history=[],marks=new Map();let observedCategories=new Set();
 const checked=source=>{
  const out={};
  for(const [category,values]of Object.entries(source||{}))for(const [key,value]of Object.entries(values||{})){
   if(value==null||value==='')continue;
   try{const clean=cleanCategory(category,{[key]:key==='subjects'?parse(value):value});(out[category]??={})[key]=clean[key];}
   catch{quality.push(`Excluded invalid ${category}.${key}`);}
  }
  return out;
 };
 const merge=(target,clean)=>{for(const [category,values]of Object.entries(clean))Object.assign(target[category]??={},values);};
 for(const record of base){const clean=checked({[record.category]:record.values});merge(data,clean);for(const [category,values]of Object.entries(clean))for(const key of Object.keys(values))provenance[`${category}.${key}`]={source:record.source,measuredAt:null,verifiedBy:null};}
 const ordered=events.filter(e=>Number.isFinite(timestamp(e.measuredAt))).sort((a,b)=>timestamp(a.measuredAt)-timestamp(b.measuredAt)||(a.order||0)-(b.order||0));
 ordered.forEach((event,index)=>{
  if(!index||timestamp(ordered[index-1].measuredAt)!==timestamp(event.measuredAt))observedCategories=new Set();
  const at=new Date(event.measuredAt).toISOString(),clean=checked(event.data);
  for(const category of Object.keys(clean))observedCategories.add(category);
  merge(data,clean);merge(dated,clean);
  for(const [category,values]of Object.entries(clean))for(const key of Object.keys(values))provenance[`${category}.${key}`]={source:event.source,measuredAt:at,verifiedBy:event.verifiedBy??null};
  if(clean.academic?.marks!=null)marks.set(at,clean.academic.marks);
  if(index===ordered.length-1||timestamp(ordered[index+1].measuredAt)!==timestamp(event.measuredAt)){
   const snapshot=assess({data:JSON.parse(JSON.stringify(dated))},overrides);
   history.push({date:at,semester:dated.academic?.semester??null,observedCategories:[...observedCategories],score:snapshot.successScore,coverage:snapshot.coverage,source:event.source,categoryScores:Object.fromEntries(snapshot.drivers.map(d=>[d.category,d.score]))});
  }
 });
 return assess({...profile,data,provenance,quality:[...new Set(quality)],history:history.slice(-60),marksHistory:[...marks].map(([date,value])=>({date,value}))},overrides);
}
function previewStudent(student,records,overrides={}){
 const copy=JSON.parse(JSON.stringify(student));
 for(const record of [...records].sort((a,b)=>Date.parse(a.measuredAt)-Date.parse(b.measuredAt))){
  for(const [key,value]of Object.entries(record.values)){
   const path=record.category+'.'+key,previous=copy.provenance[path]?.measuredAt;
   if(previous&&Date.parse(record.measuredAt)<Date.parse(previous))continue;
   (copy.data[record.category]??={})[key]=value;copy.provenance[path]={source:record.source,measuredAt:record.measuredAt};
  }
  if(record.category==='academic'&&record.values.marks!=null){copy.marksHistory=copy.marksHistory.filter(m=>Date.parse(m.date)!==Date.parse(record.measuredAt));copy.marksHistory.push({date:record.measuredAt,value:record.values.marks});}
 }
 return assess(copy,overrides);
}
async function loadUnified(user,{connection,studentId=null,overrides}={}){
 connection ??= require('../config/db');
 overrides ??= await require('./successConfiguration').readConfiguration(connection);
 const scope=user.role==='STUDENT'?'s.user_id=?':user.role==='FACULTY'?'s.department=?':'1=1';
 const params=user.role==='STUDENT'?[user.id]:user.role==='FACULTY'?[user.department||'']:[];
 const query=scope+(studentId==null?'':' AND s.id=?');if(studentId!=null)params.push(studentId);
 const [profiles]=await connection.query(`SELECT s.id,s.user_id,s.student_id AS campusId,s.department,s.year_level AS year,s.cgpa,u.name,u.email FROM students s JOIN users u ON u.id=s.user_id WHERE ${query} ORDER BY s.id`,params);
 if(!profiles.length)return {students:[],summary:summarize([]),integrationReady:true,configuration:overrides};
 const ids=profiles.map(p=>p.id),slots=ids.map(()=>'?').join(',');
 // Queries are batched by source rather than issuing a query per student.
 const sources=await Promise.all(Object.keys(TABLES).map(async table=>{const [rows]=await connection.query(`SELECT * FROM ${table} WHERE student_id IN (${slots}) ORDER BY id`,ids);return [table,rows];}));
 const [performances]=await connection.query(`SELECT * FROM student_performance WHERE student_id IN (${slots})`,ids);
 const [submissions]=await connection.query(`SELECT * FROM performance_submissions WHERE student_id IN (${slots}) AND status='APPROVED' ORDER BY reviewed_at,id`,ids);
 const [observations]=await connection.query(`SELECT * FROM agent_observations WHERE student_id IN (${slots}) ORDER BY measured_at,id`,ids);
 let imported=[],integrationReady=true;
 try{[imported]=await connection.query(`SELECT * FROM student_source_records WHERE student_id IN (${slots}) ORDER BY measured_at,id`,ids);}catch(e){if(e.code!=='ER_NO_SUCH_TABLE')throw e;integrationReady=false;}
 const index=rows=>{const map=new Map();for(const row of rows){if(!map.has(row.student_id))map.set(row.student_id,[]);map.get(row.student_id).push(row);}return map;};
 const indexedSources=sources.map(([table,rows])=>[table,index(rows)]),pIndex=index(performances),sIndex=index(submissions),oIndex=index(observations),iIndex=index(imported);
 const students=profiles.map(profile=>{
  const base=[],events=[];
  // Legacy profile CGPA defaults to zero; without academic records it is unknown.
  if(Number(profile.cgpa)>0)base.push({category:'academic',values:{cgpa:profile.cgpa},source:'Student academic profile (undated legacy record)'});
  for(const [table,map]of indexedSources){const row=map.get(profile.id)?.at(-1);if(row){const [category,fields]=TABLES[table];base.push({category,values:Object.fromEntries(Object.entries(fields).map(([column,key])=>[key,row[column]])),source:`${table}: record ${row.id} (undated legacy record)`});}}
  for(const row of pIndex.get(profile.id)||[])events.push({data:performanceToData(row),measuredAt:row.updated_at,source:'Faculty-approved performance record',order:0});
  for(const row of sIndex.get(profile.id)||[])events.push({data:performanceToData(parse(row.approved_values)),measuredAt:row.reviewed_at,source:`Faculty-approved submission ${row.id}`,verifiedBy:row.reviewed_by,order:row.id});
  for(const row of oIndex.get(profile.id)||[])events.push({data:observationToData(parse(row.indicators)),measuredAt:row.measured_at,source:row.source_reference,verifiedBy:row.verified_by,order:1000000000+row.id});
  for(const row of iIndex.get(profile.id)||[])events.push({data:{[row.category]:parse(row.indicator_values)},measuredAt:row.measured_at,source:row.source_reference,verifiedBy:row.verified_by,order:2000000000+row.id});
  const {user_id,email,cgpa,...permitted}=profile;
  return buildStudent(permitted,base,events,overrides);
 });
 return {students,summary:summarize(students),integrationReady,configuration:overrides};
}
module.exports={loadUnified,buildStudent,previewStudent,performanceToData};
