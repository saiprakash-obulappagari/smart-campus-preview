const DEFAULT_WEIGHTS={academic:.35,attendance:.20,lms:.15,engagement:.10,placement:.15,skillsFeedback:.05};
const DEFAULT_RULES={mediumBelow:60,highBelow:30,declineMedium:5,declineHigh:10,backlogMedium:1,backlogHigh:3,attendanceMediumBelow:75,attendanceHighBelow:60,placementSkillsBelow:60,placementPrepBelow:60,mockInterviewMinimum:2,preparationMinimum:1,engagementMediumBelow:60,engagementHighBelow:30,engagementDeclineMedium:5,engagementDeclineHigh:10,lowConfidenceBelow:70,improvementPoints:3};
function configuration(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Provide a configuration object.');
 const requested=input.weights||DEFAULT_WEIGHTS;
 if(Object.keys(requested).sort().join()!==Object.keys(DEFAULT_WEIGHTS).sort().join()||Object.values(requested).some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>100))throw new Error('Provide all six weights as finite non-negative numbers.');
 const total=Object.values(requested).reduce((a,b)=>a+b,0);if(total<=0)throw new Error('At least one score weight must be positive.');
 const weights=Object.fromEntries(Object.entries(requested).map(([k,v])=>[k,v/total]));
 const changes=input.rules||Object.fromEntries(Object.entries(input).filter(([key])=>Object.hasOwn(DEFAULT_RULES,key)));
 if(typeof changes!=='object'||Array.isArray(changes))throw new Error('Risk rules must be an object.');
 if(Object.keys(changes).some(k=>!Object.hasOwn(DEFAULT_RULES,k)))throw new Error('Unknown risk setting.');
 const rules={...DEFAULT_RULES,...changes};
 for(const [key,value]of Object.entries(rules))if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)throw new Error(`Invalid risk setting: ${key}`);
 for(const [high,medium]of [['highBelow','mediumBelow'],['attendanceHighBelow','attendanceMediumBelow'],['engagementHighBelow','engagementMediumBelow']])if(rules[high]>=rules[medium])throw new Error(`${high} must be below ${medium}.`);
 for(const [medium,high]of [['declineMedium','declineHigh'],['backlogMedium','backlogHigh'],['engagementDeclineMedium','engagementDeclineHigh']])if(rules[medium]>rules[high])throw new Error(`${medium} must not exceed ${high}.`);
 if(['backlogMedium','backlogHigh','mockInterviewMinimum','preparationMinimum'].some(key=>!Number.isInteger(rules[key])))throw new Error('Count thresholds must be integers.');
 return {weights,rules};
}
async function readConfiguration(connection){
 let input={};try{const [rows]=await connection.query('SELECT configuration FROM student_success_settings WHERE id=1');if(rows[0])input=typeof rows[0].configuration==='string'?JSON.parse(rows[0].configuration):rows[0].configuration;}
 catch(e){if(e.code!=='ER_NO_SUCH_TABLE')throw e;}
 if(!Object.keys(input).length&&process.env.AGENT_RULES_JSON)input={rules:JSON.parse(process.env.AGENT_RULES_JSON)};
 return configuration(input);
}
module.exports={DEFAULT_WEIGHTS,DEFAULT_RULES,configuration,readConfiguration};
