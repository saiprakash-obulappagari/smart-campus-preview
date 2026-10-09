const {buildStudent}=require('./unifiedData');
const {summarize}=require('./successEngine');
function demoCampus(){
 const profiles=[['DEMO101','Rahul Kumar','CSE',[8.2,82,80,80,72,25,68,48,65,70]],['DEMO102','Priya Sharma','ECE',[9.1,91,91,88,84,86,90,82,89,91]],['DEMO103','Arjun Reddy','CSE',[7.4,52,55,61,45,57,52,49,55,62]],['DEMO104','Sneha Rao','IT',[8.7,84,76,79,92,74,78,70,82,86]],['DEMO105','Vikram Singh','EEE',[6.8,48,61,48,38,35,44,41,49,55]],['DEMO106','Ananya Das','CSE',null]];
 const students=profiles.map(([campusId,name,department,v],i)=>{
  const profile={id:i+1,campusId,name,department,year:'3rd Year'};if(!v)return buildStudent(profile);
  const [cgpa,marks,attendance,lms,engagement,coding,aptitude,interview,skills,feedback]=v;
  const data={academic:{cgpa,marks,backlogs:i===4?3:i===0?1:0,subjectPerformance:marks},attendance:{overall:attendance,subjects:{Mathematics:attendance,DBMS:Math.min(100,attendance+3)}},lms:{loginFrequency:lms,assignmentCompletion:lms,learningActivity:lms},engagement:{events:engagement,clubs:engagement,hackathons:engagement,certifications:engagement},placement:{coding,aptitude,interview,readiness:Math.round((coding+aptitude+interview)/3*100)/100},skills:{technical:skills,soft:skills,assessment:skills},feedback:{satisfaction:feedback,faculty:feedback}};
  const events=[0,1,2].map(month=>({measuredAt:`2026-0${7+month}-01T09:00:00Z`,source:'Synthetic hackathon dataset',data:Object.fromEntries(Object.entries(data).map(([category,values])=>[category,Object.fromEntries(Object.entries(values).map(([key,value])=>[key,typeof value==='number'&&!['cgpa','backlogs'].includes(key)?Math.max(0,Math.min(100,value+(category==='academic'&&key==='marks'&&i===2?(2-month)*8:-(2-month)*3))):value]))]))}));
  return buildStudent(profile,[],events);
 });
 return {success:true,mode:'DEMO',role:'DEMO',notice:'Synthetic demonstration data. No college records are read or changed.',students,summary:summarize(students),integrationReady:false};
}
module.exports=demoCampus;
