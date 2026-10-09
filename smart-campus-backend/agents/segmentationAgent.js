const {scoreAgent}=require('./scoreAgent');
const definitions=[
 {key:'ACADEMIC_STRONG_PLACEMENT_WEAK',definition:'Complete academic score >= 75 and complete placement score < 60',actions:['Coding practice','Aptitude training','Mock interviews']},
 {key:'LOW_ATTENDANCE_DECLINING_MARKS',definition:'Attendance < 60 and decline of at least 5 percentage points between the latest two dated marks',actions:['Attendance follow-up','Faculty mentoring']},
 {key:'GOOD_ATTENDANCE_WEAK_MARKS',definition:'Attendance >= 75 and marks < 60',actions:['Remedial classes','Assignment support']},
 {key:'LOW_LMS_PARTICIPATION',definition:'LMS participation < 60',actions:['LMS support']},
 {key:'STRONG_ACADEMIC_AND_PLACEMENT',definition:'Complete academic and placement scores both >= 75',actions:['Advanced practice','Maintain study routine']}
];
function segmentationAgent(students,config){
 if(!Array.isArray(students))throw new Error('Students must be an array');
 const segments=definitions.map(d=>({...d,count:0,students:[]})), unclassified=[],departments={};
 for(const student of students){
  const data=student.indicators,score=scoreAgent(data,config),history=[...(data.marksHistory||[])].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  const decline=history.length>=2&&Date.parse(history.at(-1).date)>Date.parse(history.at(-2).date)?history.at(-2).value-history.at(-1).value:null;
  const matches=[score.academic.status==='COMPLETE'&&score.placement.status==='COMPLETE'&&score.academic.score>=75&&score.placement.score<60,data.attendance!=null&&data.attendance<60&&decline!=null&&decline>=5,data.attendance!=null&&data.marks!=null&&data.attendance>=75&&data.marks<60,data.lms!=null&&data.lms<60,score.academic.status==='COMPLETE'&&score.placement.status==='COMPLETE'&&score.academic.score>=75&&score.placement.score>=75];
  const department=student.department||'Unspecified';departments[department]??={studentCount:0,segmentCounts:{}};departments[department].studentCount++;
  matches.forEach((match,i)=>{if(match){segments[i].count++;segments[i].students.push({id:student.id,indicators:{academic:score.academic,placement:score.placement,attendance:data.attendance??null,marks:data.marks??null,lms:data.lms??null,decline}});departments[department].segmentCounts[segments[i].key]=(departments[department].segmentCounts[segments[i].key]||0)+1;}});
  if(!matches.some(Boolean))unclassified.push({id:student.id,reason:score.academic.status!=='COMPLETE'||score.placement.status!=='COMPLETE'?'Missing data or no matching definition':'No matching definition'});
 }
 return {agent:'segmentation',version:1,studentCount:students.length,segments,unclassified,departments,note:'Segments may overlap. Counts are not mutually exclusive. Missing data never implies poor performance.'};
}
module.exports=segmentationAgent;
