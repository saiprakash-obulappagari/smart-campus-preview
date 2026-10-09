const riskAgent=require('./riskAgent');
const actions={attendance:['Attendance follow-up','Review absence barriers with faculty and attend all scheduled classes this week.'],marks:['Remedial classes','Attend two remedial sessions and complete a topic practice quiz this week.'],marksTrend:['Faculty mentoring','Review the latest two assessments with a mentor and practise the weakest topics daily.'],backlogs:['Backlog support','Meet your faculty mentor and schedule revision sessions for each pending subject.'],assignments:['Assignment support','Break pending assignments into steps and submit two with mentor support this week.'],lms:['LMS support','Complete two pending learning activities and review course material daily.'],coding:['Coding practice','Solve three coding problems and submit solutions with an error log.'],aptitude:['Aptitude training','Complete three practice sessions of 15 questions and review mistakes.'],interview:['Mock interviews','Complete two mock interviews and record evaluator feedback.']};
function interventionAgent(data, config){
    const risk=riskAgent(data,config), recommendations=[];
    for(const domain of ['academic','placement'])for(const trigger of risk[domain].triggers){
        const [title,task]=actions[trigger.indicator];
        recommendations.push({key:trigger.indicator,domain,priority:trigger.level,title,task,why:trigger.explanation,reviewAfterDays:7,evidenceRequired:'Completed-work reference, assessment result or faculty evaluation.',approvalRequired:true,status:'PROPOSED'});
    }
    recommendations.sort((a,b)=>(a.priority==='HIGH'?0:1)-(b.priority==='HIGH'?0:1));
    return {agent:'interventions',version:1,recommendations,missingIndicators:[...risk.academic.missing,...risk.placement.missing],outcome:'NOT_EVALUATED',message:'Recommendations are proposals. Success requires recorded follow-up evidence.'};
}
module.exports=interventionAgent;
