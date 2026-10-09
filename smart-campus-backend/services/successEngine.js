const riskAgent = require('../agents/riskAgent');
const interventionAgent = require('../agents/interventionAgent');
const { configure } = require('../agents/config');

const DEFINITIONS = {
 academic: { label:'Academic', weight:.25, fields:{cgpa:10, marks:100, backlogs:null, subjectPerformance:100} },
 attendance: { label:'Attendance', weight:.15, fields:{overall:100}, optional:['subjects'] },
 lms: { label:'LMS', weight:.10, fields:{loginFrequency:100, assignmentCompletion:100, learningActivity:100} },
 engagement: { label:'Engagement', weight:.10, fields:{events:100, clubs:100, hackathons:100, certifications:100} },
 placement: { label:'Placement', weight:.20, fields:{coding:100, aptitude:100, interview:100, readiness:100} },
 skills: { label:'Skills', weight:.10, fields:{technical:100, soft:100, assessment:100} },
 feedback: { label:'Feedback', weight:.10, fields:{satisfaction:100, faculty:100} }
};
const round = n => Math.round(n*100)/100;
function numeric(value) {
 if (!['number','string'].includes(typeof value) || (typeof value==='string'&&!/^\d+(\.\d+)?$/.test(value.trim()))) throw new Error('Use a finite numeric value.');
 const n=Number(value);if(!Number.isFinite(n))throw new Error('Use a finite numeric value.');return n;
}
function cleanCategory(category, values) {
 const spec=DEFINITIONS[category];
 if(!spec||!values||typeof values!=='object'||Array.isArray(values))throw new Error('Unknown category or invalid values object.');
 const cleaned={};
 for(const [key,value]of Object.entries(values)) {
  if(!Object.hasOwn(spec.fields,key)&&!spec.optional?.includes(key))throw new Error(`Unknown ${category} indicator: ${key}.`);
  if(value==null||value==='')continue;
  if(key==='subjects'){
   let subjects=value;if(typeof subjects==='string'){try{subjects=JSON.parse(subjects);}catch{throw new Error('subjects must contain a JSON object.');}}
   if(!subjects||typeof subjects!=='object'||Array.isArray(subjects)||Object.keys(subjects).length>100)throw new Error('subjects must be an object with at most 100 subjects.');
   cleaned.subjects={};
   for(const [subject,v]of Object.entries(subjects)){if(!subject.trim()||subject.length>100||['__proto__','constructor','prototype'].includes(subject))throw new Error('Invalid subject name.');const n=numeric(v);if(n<0||n>100)throw new Error('Subject attendance must be 0–100%.');if(Object.hasOwn(cleaned.subjects,subject.trim()))throw new Error('Duplicate subject name after trimming.');cleaned.subjects[subject.trim()]=n;}
  }else{
   const n=numeric(value),max=spec.fields[key];
   if(n<0||(max!=null&&n>max)||(key==='backlogs'&&!Number.isSafeInteger(n)))throw new Error(`${category}.${key} must be ${key==='backlogs'?'a non-negative integer':`between 0 and ${max}`}.`);
   cleaned[key]=n;
  }
 }
 if(!Object.keys(cleaned).length)throw new Error('Provide at least one indicator.');return cleaned;
}
function categoryScore(key,values={}) {
 const required=Object.keys(DEFINITIONS[key].fields),available=required.filter(f=>values[f]!=null);
 let score=null;
 if(key==='academic'){
  const parts=[['cgpa',.35,10],['marks',.5,1],['subjectPerformance',.15,1]].filter(([field])=>values[field]!=null);
  const used=parts.reduce((sum,p)=>sum+p[1],0);
  if(used)score=Math.max(0,parts.reduce((sum,[f,w,m])=>sum+values[f]*m*w,0)/used-Math.min(25,(values.backlogs??0)*5));
 }else if(available.length)score=available.reduce((sum,f)=>sum+values[f],0)/available.length;
 return {score:score==null?null:round(score),coverage:round(available.length/required.length*100),missing:required.filter(f=>values[f]==null)};
}
function indicatorsFrom(data,marksHistory=[]) {
 const indicators={marksHistory};const set=(k,v)=>{if(v!=null)indicators[k]=v;};
 set('attendance',data.attendance?.overall);set('marks',data.academic?.marks);set('backlogs',data.academic?.backlogs);set('assignments',data.lms?.assignmentCompletion);
 for(const key of ['coding','aptitude','interview'])set(key,data.placement?.[key]);
 for(const key of ['lms','engagement','skills','feedback'])set(key,categoryScore(key,data[key]).score);
 return indicators;
}
const segmentDefinitions=[
 {key:'ACADEMIC_STRONG_PLACEMENT_WEAK',label:'Strong academics, placement support',definition:'Complete academic category score >=75 and complete placement category score <60',actions:['Coding practice','Aptitude training','Mock interviews']},
 {key:'LOW_ATTENDANCE_DECLINING_MARKS',label:'Attendance and marks support',definition:'Attendance <60 and marks decline >=5 percentage points across the latest two dates',actions:['Attendance follow-up','Faculty mentoring']},
 {key:'GOOD_ATTENDANCE_WEAK_MARKS',label:'Attending, but needs academic support',definition:'Attendance >=75 and marks <60',actions:['Remedial classes','Assignment support']},
 {key:'LOW_LMS_PARTICIPATION',label:'Low LMS participation',definition:'Available LMS score <60',actions:['LMS support']},
 {key:'STRONG_ACADEMIC_AND_PLACEMENT',label:'Strong academics and placement',definition:'Complete academic and placement category scores both >=75',actions:['Advanced practice','Maintain study routine']},
 {key:'LOW_ENGAGEMENT',label:'Engagement support',definition:'Available engagement score <60',actions:['Study group','Campus participation']}
];
function assess(input,overrides={}) {
 const data=input.data||{},drivers=Object.entries(DEFINITIONS).map(([category,d])=>({category,label:d.label,weight:d.weight,...categoryScore(category,data[category])}));
 const used=drivers.reduce((sum,d)=>sum+(d.score==null?0:d.weight),0);
 const successScore=used?round(drivers.reduce((sum,d)=>sum+(d.score??0)*d.weight,0)/used):null;
 for(const d of drivers){
  d.effectiveWeight=d.score==null?0:round(d.weight/used*100);d.contribution=d.score==null?null:round(d.score*d.weight/used);d.shortfall=d.score==null?null:round((100-d.score)*d.weight/used);
  const values=data[d.category]||{},factor=d.score==null?null:d.weight/used;
  if(d.category==='academic'){
   const parts=[['cgpa',.35,10],['marks',.5,1],['subjectPerformance',.15,1]].filter(([key])=>values[key]!=null),availableWeight=parts.reduce((sum,p)=>sum+p[1],0);
   const raw=availableWeight?parts.reduce((sum,[key,w,m])=>sum+values[key]*m*w,0)/availableWeight:0;
   d.indicators=parts.map(([key,w,m])=>({key,value:values[key],normalized:values[key]*m,withinCategoryWeight:round(w/availableWeight*100),contribution:factor==null?null:round(values[key]*m*w/availableWeight*factor),effect:'positive'}));
   if(values.backlogs!=null)d.indicators.push({key:'backlogs',value:values.backlogs,normalized:null,withinCategoryWeight:null,contribution:factor==null?null:round(-Math.min(25,values.backlogs*5,raw)*factor),effect:'penalty'});
  }else{
   const available=Object.keys(DEFINITIONS[d.category].fields).filter(key=>values[key]!=null);
   d.indicators=available.map(key=>({key,value:values[key],normalized:values[key],withinCategoryWeight:round(100/available.length),contribution:factor==null?null:round(values[key]/available.length*factor),effect:'positive'}));
  }
 }
 const history=[...(input.marksHistory||[])].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 const indicators=indicatorsFrom(data,history),risk=riskAgent(indicators,overrides),config=configure(overrides);
 for(const [key,value]of [['cgpa',data.academic?.cgpa==null?null:data.academic.cgpa*10],['subjectPerformance',data.academic?.subjectPerformance]]){
  if(value==null)continue;risk.academic.observed.push(key);
  const level=value<config.highBelow?'HIGH':value<config.mediumBelow?'MEDIUM':null;
  if(level)risk.academic.triggers.push({indicator:key,value,level,rule:`${key} normalized < ${level==='HIGH'?config.highBelow:config.mediumBelow}%`,explanation:`${key==='cgpa'?'CGPA normalized to a percentage':'Subject performance'} is ${value}%, below the ${level.toLowerCase()}-risk threshold.`});
 }
 risk.academic.level=!risk.academic.observed.length?null:risk.academic.triggers.some(t=>t.level==='HIGH')?'HIGH':risk.academic.triggers.length?'MEDIUM':'LOW';
 risk.academic.status=!risk.academic.observed.length?'INSUFFICIENT_DATA':risk.academic.missing.length?'PARTIAL':'COMPLETE';
 const recommendations=interventionAgent(indicators,overrides).recommendations;
 const add=(key,domain,title,task,why,priority='MEDIUM')=>{if(!recommendations.some(r=>r.key===key))recommendations.push({key,domain,title,task,why,priority,approvalRequired:true,status:'PROPOSED',reviewAfterDays:7,evidenceRequired:'Completed-work reference, assessment result or faculty evaluation.'});};
 for(const trigger of risk.academic.triggers.filter(t=>['cgpa','subjectPerformance'].includes(t.indicator)))add(trigger.indicator,'academic','Academic mentoring','Review two weak subjects with a faculty mentor and complete two revision sessions this week.',trigger.explanation,trigger.level);
 for(const [key,title,task]of [['engagement','Study-group support','Join one study-group session and participate in one campus learning activity this week.'],['skills','Skill development','Practise a weak technical or soft skill for 30 minutes daily and submit one demonstration.'],['feedback','Mentor check-in','Discuss learning barriers with your mentor and agree on two measurable support actions.']]){const d=drivers.find(d=>d.category===key);if(d.score!=null&&d.score<60)add(key,'support',title,task,`${d.label} score is ${d.score}%, below the 60% support threshold.`);}
 recommendations.sort((a,b)=>(a.priority==='HIGH'?0:1)-(b.priority==='HIGH'?0:1));
 const a=drivers.find(d=>d.category==='academic'),p=drivers.find(d=>d.category==='placement'),l=drivers.find(d=>d.category==='lms'),e=drivers.find(d=>d.category==='engagement');
 const decline=history.length>=2&&history.at(-1).date!==history.at(-2).date?history.at(-2).value-history.at(-1).value:null;
 const both=a.coverage===100&&p.coverage===100;
 const matches=[both&&a.score>=75&&p.score<60,indicators.attendance!=null&&indicators.attendance<60&&decline!=null&&decline>=5,indicators.attendance!=null&&indicators.marks!=null&&indicators.attendance>=75&&indicators.marks<60,l.score!=null&&l.score<60,both&&a.score>=75&&p.score>=75,e.score!=null&&e.score<60];
 const segments=segmentDefinitions.filter((_,i)=>matches[i]);
 const coverage=round(drivers.reduce((sum,d)=>sum+d.weight*d.coverage,0));
 return {...input,data,successScore,coverage,scoreStatus:!used?'INSUFFICIENT_DATA':drivers.every(d=>d.coverage===100)?'COMPLETE':'PARTIAL',drivers,indicators,risk,recommendations,segments,method:'Seven-category weighted score; missing categories are excluded and weights renormalized. Coverage is separate. Risk flags are explainable rules, not predicted probabilities.'};
}
function summarize(students){
 const scores=students.filter(s=>s.successScore!=null),average=v=>v.length?round(v.reduce((a,b)=>a+b,0)/v.length):null;
 return {totalStudents:students.length,averageSuccess:average(scores.map(s=>s.successScore)),academicHigh:students.filter(s=>s.risk.academic.level==='HIGH').length,placementHigh:students.filter(s=>s.risk.placement.level==='HIGH').length,incomplete:students.filter(s=>s.scoreStatus!=='COMPLETE').length,categoryAverages:Object.fromEntries(Object.keys(DEFINITIONS).map(k=>[k,average(students.map(s=>s.drivers.find(d=>d.category===k).score).filter(v=>v!=null))]))};
}
module.exports={DEFINITIONS,round,cleanCategory,categoryScore,indicatorsFrom,assess,summarize,segmentDefinitions};
