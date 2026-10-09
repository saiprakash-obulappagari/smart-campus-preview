const { validate } = require('./scoreAgent');
const { configure } = require('./config');
function riskAgent(data, overrides) {
    validate(data); const config = configure(overrides);
    function domain(keys) {
        const triggers = [], observed = keys.filter(key => data[key] != null);
        for (const key of observed) {
            const value=data[key], level=value<config.highBelow?'HIGH':value<config.mediumBelow?'MEDIUM':null;
            if(level) triggers.push({ indicator:key, value, level, rule:`${key} < ${level==='HIGH'?config.highBelow:config.mediumBelow}%`, explanation:`Verified ${key} is ${value}%, below the ${level.toLowerCase()}-risk threshold.` });
        }
        return { triggers, observed, missing:keys.filter(key => data[key]==null) };
    }
    const academic=domain(['attendance','marks','assignments','lms']), placement=domain(['coding','aptitude','interview']);
    if(data.backlogs!=null){academic.observed.push('backlogs');const level=data.backlogs>=config.backlogHigh?'HIGH':data.backlogs>=config.backlogMedium?'MEDIUM':null;if(level)academic.triggers.push({indicator:'backlogs',value:data.backlogs,level,rule:`backlogs >= ${level==='HIGH'?config.backlogHigh:config.backlogMedium}`,explanation:`${data.backlogs} verified outstanding backlogs.`});}else academic.missing.push('backlogs');
    const history=[...(data.marksHistory||[])].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
    if(history.length>=2 && Date.parse(history.at(-1).date)>Date.parse(history.at(-2).date)){
        const decline=Math.round((history.at(-2).value-history.at(-1).value)*100)/100;
        const level=decline>=config.declineHigh?'HIGH':decline>=config.declineMedium?'MEDIUM':null;
        academic.observed.push('marksTrend');
        if(level)academic.triggers.push({indicator:'marksTrend',value:decline,level,rule:`decline >= ${level==='HIGH'?config.declineHigh:config.declineMedium} percentage points`,explanation:`Marks declined from ${history.at(-2).value}% to ${history.at(-1).value}% across the latest two verified observations.`});
    }else academic.missing.push('marksTrend');
    for(const result of [academic,placement]){
        result.level=!result.observed.length?null:result.triggers.some(t=>t.level==='HIGH')?'HIGH':result.triggers.length?'MEDIUM':'LOW';
        result.status=!result.observed.length?'INSUFFICIENT_DATA':result.missing.length?'PARTIAL':'COMPLETE';
    }
    return {agent:'risk',version:1,academic,placement,thresholds:config,method:'Transparent indicator rules; these flags are decision support, not predicted probabilities or disciplinary decisions.'};
}
module.exports=riskAgent;
