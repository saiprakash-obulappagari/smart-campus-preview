const db=require('../config/db');
const {loadUnified}=require('./unifiedData');
function buildPlan(data,scores){
 const tasks=[];
 if(data.overall_percentage!=null&&Number(data.overall_percentage)<60)tasks.push('Attend scheduled classes and review missed lessons with your mentor this week.');
 if(data.average_marks!=null&&Number(data.average_marks)<60)tasks.push('Revise two weak topics and complete a practice quiz this week.');
 if(data.coding_score!=null&&Number(data.coding_score)<60)tasks.push('Solve three beginner coding problems and review errors with faculty.');
 if(data.assignment_completion!=null&&Number(data.assignment_completion)<60)tasks.push('Complete two pending assignments with mentor support.');
 if(!tasks.length)tasks.push('Meet your faculty mentor and agree on two practical improvement actions.');
 tasks.push('Review progress after seven days using completed-work evidence.');
 return {title:'Seven-day student improvement plan',description:tasks.map((t,i)=>`${i+1}. ${t}`).join('\n'),tasks};
}
async function getSuggestions(user){
 const campus=await loadUnified(user),suggestions=[];
 for(const s of campus.students){
  if(!s.recommendations.length)continue;
  const tasks=s.recommendations.map(r=>r.task),plan={title:'Seven-day student improvement plan',description:tasks.map((t,i)=>`${i+1}. ${t}`).join('\n')+'\nReview progress with faculty after seven days using verified evidence.',tasks};
  const [sent]=await db.query("SELECT id FROM interventions WHERE student_id=? AND title=? AND description=? AND status IN ('ASSIGNED','IN_PROGRESS') LIMIT 1",[s.id,plan.title,plan.description]);
  suggestions.push({id:s.id,student_id:s.campusId,name:s.name,successScore:s.successScore,attendance:s.data.attendance?.overall??null,...plan,sent:sent.length>0});
 }
 return suggestions;
}
module.exports={getSuggestions,buildPlan};
