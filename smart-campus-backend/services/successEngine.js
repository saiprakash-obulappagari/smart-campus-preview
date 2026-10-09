const riskAgent = require('../agents/riskAgent');
const interventionAgent = require('../agents/interventionAgent');
const { configure } = require('../agents/config');
const {configuration}=require('./successConfiguration');

const DEFINITIONS = {
 academic: { label:'Academic', fields:{cgpa:10, marks:100, backlogs:null, subjectPerformance:100},optional:['semester'] },
 attendance: { label:'Attendance', fields:{overall:100}, optional:['subjects'] },
 lms: { label:'LMS', fields:{loginFrequency:100, assignmentCompletion:100, learningActivity:100,learningProgress:100} },
 engagement: { label:'Engagement', fields:{events:100, clubs:100, hackathons:100, certifications:100,extracurricular:100} },
 placement: { label:'Placement', fields:{coding:100, aptitude:100, interview:100, readiness:100},optional:['mockInterviews','preparationActivities'] },
 skills: { label:'Skills', fields:{technical:100, soft:100, assessment:100,communication:100,teamwork:100,problemSolving:100} },
 feedback: { label:'Feedback', fields:{satisfaction:100, faculty:100} }
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
   const n=numeric(value),count=['semester','mockInterviews','preparationActivities'].includes(key),max=count?(key==='semester'?12:null):(spec.fields[key]??(key==='backlogs'?null:100));
   if(n<0||(max!=null&&n>max)||(key==='backlogs'&&!Number.isSafeInteger(n)))throw new Error(`${category}.${key} must be ${key==='backlogs'?'a non-negative integer':`between 0 and ${max}`}.`);
   if(count&&(!Number.isSafeInteger(n)||(key==='semester'&&n<1)))throw new Error(`${key} must be a valid integer count.`);
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
 }else{const extra=(DEFINITIONS[key].optional||[]).filter(f=>!['subjects','semester','mockInterviews','preparationActivities'].includes(f)&&values[f]!=null),scored=[...available,...extra];if(scored.length)score=scored.reduce((sum,f)=>sum+values[f],0)/scored.length;}
 return {score:score==null?null:round(score),coverage:round(available.length/required.length*100),missing:required.filter(f=>values[f]==null),contextMissing:(DEFINITIONS[key].optional||[]).filter(f=>values[f]==null)};
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
 {key:'LOW_ENGAGEMENT',label:'Engagement support',definition:'Available engagement score <60',actions:['Study group','Campus participation']},
 {key:'STRONG_ATTENDANCE_LOW_LMS',label:'Strong attendance, low LMS activity',definition:'Attendance >=75 and available LMS score <60',actions:['LMS onboarding','Assignment support']},
 {key:'BROAD_ACADEMIC_ENGAGEMENT_SUPPORT',label:'Academic and engagement support',definition:'Both academic and engagement domains have current support triggers',actions:['Faculty mentoring','Learning-support outreach']},
 {key:'IMPROVING_OVER_TIME',label:'Improving over time',definition:'Latest two comparable dated scores improve by at least the configured point threshold; coverage >=70%',actions:['Recognize progress','Maintain support routine']}
];
function assess(input,overrides={}) {
 const settings=configuration(overrides),data=input.data||{},drivers=Object.entries(DEFINITIONS).map(([category,d])=>({category,label:d.label,weight:['skills','feedback'].includes(category)?settings.weights.skillsFeedback/2:settings.weights[category],...categoryScore(category,data[category])}));
 const supportCount=drivers.filter(d=>['skills','feedback'].includes(d.category)&&d.score!=null).length;
 for(const d of drivers)d.scoringWeight=d.score==null?0:['skills','feedback'].includes(d.category)?settings.weights.skillsFeedback/supportCount:d.weight;
 const used=drivers.reduce((sum,d)=>sum+d.scoringWeight,0);
 const successScore=used?round(drivers.reduce((sum,d)=>sum+(d.score??0)*d.scoringWeight,0)/used):null;
 for(const d of drivers){
  d.effectiveWeight=d.score==null?0:round(d.scoringWeight/used*100);d.contribution=d.score==null?null:round(d.score*d.scoringWeight/used);d.shortfall=d.score==null?null:round((100-d.score)*d.scoringWeight/used);
  const values=data[d.category]||{},factor=d.score==null?null:d.scoringWeight/used;
  if(d.category==='academic'){
   const parts=[['cgpa',.35,10],['marks',.5,1],['subjectPerformance',.15,1]].filter(([key])=>values[key]!=null),availableWeight=parts.reduce((sum,p)=>sum+p[1],0);
   const raw=availableWeight?parts.reduce((sum,[key,w,m])=>sum+values[key]*m*w,0)/availableWeight:0;
   d.indicators=parts.map(([key,w,m])=>({key,value:values[key],normalized:values[key]*m,withinCategoryWeight:round(w/availableWeight*100),contribution:factor==null?null:round(values[key]*m*w/availableWeight*factor),effect:'positive'}));
   if(values.backlogs!=null)d.indicators.push({key:'backlogs',value:values.backlogs,normalized:null,withinCategoryWeight:null,contribution:factor==null?null:round(-Math.min(25,values.backlogs*5,raw)*factor),effect:'penalty'});
  }else{
   const available=[...Object.keys(DEFINITIONS[d.category].fields),...(DEFINITIONS[d.category].optional||[]).filter(key=>!['subjects','semester','mockInterviews','preparationActivities'].includes(key))].filter(key=>values[key]!=null);
   d.indicators=available.map(key=>({key,value:values[key],normalized:values[key],withinCategoryWeight:round(100/available.length),contribution:factor==null?null:round(values[key]/available.length*factor),effect:'positive'}));
  }
 }
 const history=[...(input.marksHistory||[])].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 const indicators=indicatorsFrom(data,history),risk=riskAgent(indicators,settings.rules),config=configure(settings.rules);
 risk.academic.triggers=risk.academic.triggers.filter(t=>t.indicator!=='attendance');
 if(indicators.attendance!=null&&indicators.attendance<config.attendanceMediumBelow){const level=indicators.attendance<config.attendanceHighBelow?'HIGH':'MEDIUM';risk.academic.triggers.push({indicator:'attendance',value:indicators.attendance,level,rule:`attendance < ${level==='HIGH'?config.attendanceHighBelow:config.attendanceMediumBelow}%`,explanation:`Attendance is ${indicators.attendance}%, below the institutional support threshold.`});}
 for(const [key,value]of [['cgpa',data.academic?.cgpa==null?null:data.academic.cgpa*10],['subjectPerformance',data.academic?.subjectPerformance]]){
  if(value==null)continue;risk.academic.observed.push(key);
  const level=value<config.highBelow?'HIGH':value<config.mediumBelow?'MEDIUM':null;
  if(level)risk.academic.triggers.push({indicator:key,value,level,rule:`${key} normalized < ${level==='HIGH'?config.highBelow:config.mediumBelow}%`,explanation:`${key==='cgpa'?'CGPA normalized to a percentage':'Subject performance'} is ${value}%, below the ${level.toLowerCase()}-risk threshold.`});
 }
 risk.academic.level=!risk.academic.observed.length?null:risk.academic.triggers.some(t=>t.level==='HIGH')?'HIGH':risk.academic.triggers.length?'MEDIUM':'LOW';
 risk.academic.status=!risk.academic.observed.length?'INSUFFICIENT_DATA':risk.academic.missing.length?'PARTIAL':'COMPLETE';
 for(const [key,value,minimum]of [['mockInterviews',data.placement?.mockInterviews,config.mockInterviewMinimum],['preparationActivities',data.placement?.preparationActivities,config.preparationMinimum]]){
  if(value==null){risk.placement.missing.push(key);continue;}risk.placement.observed.push(key);
  if(value<minimum)risk.placement.triggers.push({indicator:key,value,level:'MEDIUM',rule:`${key} < ${minimum}`,explanation:`${key==='mockInterviews'?'Recorded mock interviews':'Placement preparation activities'}: ${value}, below the required ${minimum}.`});
 }
 for(const [key,value,threshold]of [['readiness',data.placement?.readiness,config.placementPrepBelow],...['technical','soft','communication','teamwork','problemSolving'].map(k=>[k,data.skills?.[k],config.placementSkillsBelow])]){
  if(value==null)continue;risk.placement.observed.push(key);if(value<threshold)risk.placement.triggers.push({indicator:key,value,level:value<config.highBelow?'HIGH':'MEDIUM',rule:`${key} < ${threshold}%`,explanation:`${key} assessment is ${value}%, below the placement requirement of ${threshold}%.`});
 }
 risk.placement.level=!risk.placement.observed.length?null:risk.placement.triggers.some(t=>t.level==='HIGH')?'HIGH':risk.placement.triggers.length?'MEDIUM':'LOW';
 risk.placement.status=!risk.placement.observed.length?'INSUFFICIENT_DATA':risk.placement.missing.length?'PARTIAL':'COMPLETE';
 const engagementRisk={observed:[],missing:[],triggers:[]};
 for(const [key,value]of [['lms',indicators.lms],['assignments',indicators.assignments],['engagement',indicators.engagement]]){
  if(value==null){engagementRisk.missing.push(key);continue;}engagementRisk.observed.push(key);if(value<config.engagementMediumBelow){const level=value<config.engagementHighBelow?'HIGH':'MEDIUM';engagementRisk.triggers.push({indicator:key,value,level,rule:`${key} < ${level==='HIGH'?config.engagementHighBelow:config.engagementMediumBelow}%`,explanation:`${key} activity is ${value}%, below the engagement support threshold.`});}
 }
 const dated=(input.history||[]).filter(h=>h.categoryScores?.lms!=null&&h.observedCategories?.includes('lms')).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 if(dated.length>=2){const previous=dated.at(-2).categoryScores.lms,current=dated.at(-1).categoryScores.lms,decline=round(previous-current);if(previous<config.engagementMediumBelow&&current<config.engagementMediumBelow)engagementRisk.triggers.push({indicator:'persistentLms',value:current,level:current<config.engagementHighBelow?'HIGH':'MEDIUM',rule:`latest two LMS scores < ${config.engagementMediumBelow}%`,explanation:`LMS activity remained low across the latest two observations (${previous}% and ${current}%).`});if(decline>=config.engagementDeclineMedium)engagementRisk.triggers.push({indicator:'lmsDecline',value:decline,level:decline>=config.engagementDeclineHigh?'HIGH':'MEDIUM',rule:`LMS decline >= ${config.engagementDeclineMedium} percentage points`,explanation:`Recorded LMS engagement declined by ${decline} percentage points.`});}
 engagementRisk.level=!engagementRisk.observed.length?null:engagementRisk.triggers.some(t=>t.level==='HIGH')?'HIGH':engagementRisk.triggers.length?'MEDIUM':'LOW';engagementRisk.status=!engagementRisk.observed.length?'INSUFFICIENT_DATA':engagementRisk.missing.length?'PARTIAL':'COMPLETE';risk.engagement=engagementRisk;
 for(const domain of ['academic','placement','engagement'])risk[domain].method='RULE_BASED';
 const recommendations=interventionAgent(indicators,settings.rules).recommendations;
 const add=(key,domain,title,task,why,priority='MEDIUM')=>{if(!recommendations.some(r=>r.key===key))recommendations.push({key,domain,title,task,why,priority,approvalRequired:true,status:'PROPOSED',reviewAfterDays:7,evidenceRequired:'Completed-work reference, assessment result or faculty evaluation.'});};
 for(const trigger of risk.academic.triggers.filter(t=>['cgpa','subjectPerformance'].includes(t.indicator)))add(trigger.indicator,'academic','Academic mentoring','Review two weak subjects with a faculty mentor and complete two revision sessions this week.',trigger.explanation,trigger.level);
 for(const trigger of risk.academic.triggers.filter(t=>t.indicator==='attendance'))add('attendance','academic','Attendance follow-up','Review absence barriers with faculty and attend scheduled classes this week.',trigger.explanation,trigger.level);
 for(const trigger of risk.placement.triggers.filter(t=>!['coding','aptitude','interview'].includes(t.indicator)))add(trigger.indicator,'placement','Placement preparation: '+trigger.indicator,'Schedule placement mentoring, practise the weak assessment area, and complete two mock interviews.',trigger.explanation,trigger.level);
 for(const trigger of engagementRisk.triggers)add(trigger.indicator,'engagement','Learning-support outreach: '+trigger.indicator,'Complete two pending learning activities and review participation barriers with a mentor.',trigger.explanation,trigger.level);
 for(const [key,title,task]of [['engagement','Study-group support','Join one study-group session and participate in one campus learning activity this week.'],['skills','Skill development','Practise a weak technical or soft skill for 30 minutes daily and submit one demonstration.'],['feedback','Mentor check-in','Discuss learning barriers with your mentor and agree on two measurable support actions.']]){const d=drivers.find(d=>d.category===key);if(d.score!=null&&d.score<60)add(key,'support',title,task,`${d.label} score is ${d.score}%, below the 60% support threshold.`);}
 recommendations.sort((a,b)=>(a.priority==='HIGH'?0:1)-(b.priority==='HIGH'?0:1));
 for(const recommendation of recommendations){recommendation.responsibleRole=recommendation.domain==='placement'?'Placement coordinator':'Faculty mentor';recommendation.reviewDate=new Date(Date.now()+recommendation.reviewAfterDays*86400000).toISOString().slice(0,10);}
 const a=drivers.find(d=>d.category==='academic'),p=drivers.find(d=>d.category==='placement'),l=drivers.find(d=>d.category==='lms'),e=drivers.find(d=>d.category==='engagement');
 const decline=history.length>=2&&history.at(-1).date!==history.at(-2).date?history.at(-2).value-history.at(-1).value:null;
 const both=a.coverage===100&&p.coverage===100;
 const scoreHistory=(input.history||[]).filter(h=>h.score!=null).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 const comparable=scoreHistory.length>=2&&scoreHistory.at(-1).coverage>=config.lowConfidenceBelow&&scoreHistory.at(-2).coverage===scoreHistory.at(-1).coverage;
 const delta=comparable?round(scoreHistory.at(-1).score-scoreHistory.at(-2).score):null;
 const trendStatus=delta==null?'INSUFFICIENT_COMPARABLE_DATA':delta>=config.improvementPoints?'IMPROVING':delta<=-config.improvementPoints?'DECLINING':'STABLE';
 const matches=[both&&a.score>=75&&p.score<60,indicators.attendance!=null&&indicators.attendance<config.attendanceMediumBelow&&decline!=null&&decline>=config.declineMedium,indicators.attendance!=null&&indicators.marks!=null&&indicators.attendance>=config.attendanceMediumBelow&&indicators.marks<60,l.score!=null&&l.score<60,both&&a.score>=75&&p.score>=75,e.score!=null&&e.score<60,indicators.attendance!=null&&indicators.attendance>=config.attendanceMediumBelow&&l.score!=null&&l.score<60,risk.academic.triggers.length>0&&engagementRisk.triggers.length>0,trendStatus==='IMPROVING'];
 const segments=segmentDefinitions.filter((_,i)=>matches[i]).map(s=>({...s,definition:s.key==='LOW_ATTENDANCE_DECLINING_MARKS'?`Attendance <${config.attendanceMediumBelow}% and dated marks decline >=${config.declineMedium} points`:s.key==='STRONG_ATTENDANCE_LOW_LMS'?`Attendance >=${config.attendanceMediumBelow}% and LMS score <60%`:s.key==='IMPROVING_OVER_TIME'?`Latest comparable scores improve >=${config.improvementPoints} points with equal coverage >=${config.lowConfidenceBelow}%`:s.definition}));
 const coverage=round(drivers.reduce((sum,d)=>sum+d.weight*d.coverage,0));
 return {...input,data,semester:data.academic?.semester??null,successScore,coverage,confidence:coverage<config.lowConfidenceBelow?'LOW':'SUPPORTED',performanceCategory:successScore==null?'Unknown':successScore>=85?'Strong':successScore>=70?'On track':successScore>=50?'Developing':'Needs attention',trendStatus,trendDelta:delta,scoreStatus:!used?'INSUFFICIENT_DATA':drivers.every(d=>d.coverage===100)?'COMPLETE':'PARTIAL',drivers,indicators,risk,recommendations,segments,configuration:settings,method:'Six weighted components from seven source categories; skills and feedback form one component. Missing categories are excluded; coverage and confidence are separate. Risk flags are transparent rules, not predicted probabilities.'};
}
function summarize(students){
 const scores=students.filter(s=>s.successScore!=null),average=v=>v.length?round(v.reduce((a,b)=>a+b,0)/v.length):null;
 return {totalStudents:students.length,averageSuccess:average(scores.map(s=>s.successScore)),academicHigh:students.filter(s=>s.risk.academic.level==='HIGH').length,placementHigh:students.filter(s=>s.risk.placement.level==='HIGH').length,incomplete:students.filter(s=>s.scoreStatus!=='COMPLETE').length,categoryAverages:Object.fromEntries(Object.keys(DEFINITIONS).map(k=>[k,average(students.map(s=>s.drivers.find(d=>d.category===k).score).filter(v=>v!=null))]))};
}
module.exports={DEFINITIONS,round,cleanCategory,categoryScore,indicatorsFrom,assess,summarize,segmentDefinitions};
