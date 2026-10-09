const labels={attendance:'Attendance',lms:'LMS activity',engagement:'Engagement',coding:'Coding',aptitude:'Aptitude',interview:'Mock interview',skills:'Skills',feedback:'Feedback'};
const activities={attendance:'Attend every scheduled class and review one missed lesson with your mentor.',lms:'Complete one pending course activity and review course material for 20 minutes.',engagement:'Join a study session and explain one topic to a peer.',coding:'Solve one beginner coding problem, trace its output and review mistakes.',aptitude:'Solve 15 aptitude questions and review incorrect answers.',interview:'Practise answers to two interview questions aloud and request feedback.',skills:'Practise one weak skill for 30 minutes and record what you learned.',feedback:'Discuss one feedback point with your mentor and act on it.'};
function riskPlan(performance){
 if(!performance)return {available:false,message:'Faculty-approved percentages are needed before estimating risk.'};
 const factors=Object.entries(labels).filter(([key])=>performance[key]!=null).map(([key,label])=>({key,label,value:Number(performance[key])}));
 if(factors.length!==8||factors.some(f=>!Number.isFinite(f.value)||f.value<0||f.value>100))return {available:false,message:'Complete verified percentages are needed.'};
 const average=factors.reduce((sum,f)=>sum+f.value,0)/8;
 const score=Math.round(average*100)/100,level=score<30?'HIGH':score<60?'MEDIUM':'LOW';
 const weak=factors.filter(f=>f.value<60).sort((a,b)=>a.value-b.value);
 const focus=weak.length?weak:[...factors].sort((a,b)=>a.value-b.value).slice(0,2);
 const daily=Array.from({length:7},(_,i)=>({day:i+1,focus:focus[i%focus.length].label,instruction:i===6?'Review your seven-day practice log with faculty, take a short assessment and submit evidence for verification.':activities[focus[i%focus.length].key],check:i===6?'Record reassessment results and agree on next-week goals.':'Keep a short practice log or completed-work reference.'}));
 return {available:true,score,level,average:Number(average.toFixed(2)),factors,weak,daily,explanation:weak.length?'Lowest approved areas: '+weak.map(f=>`${f.label} (${f.value}%)`).join(', ')+'.':'No approved area is below 60%. Maintain consistent practice.',method:'Academic health is the average of eight faculty-approved percentages. High risk: below 30%; Medium risk: 30–59.99%; Low risk: 60–100%. Higher percentages mean lower risk. This is a score-based estimate, not a validated prediction of academic failure.'};
}
module.exports=riskPlan;
