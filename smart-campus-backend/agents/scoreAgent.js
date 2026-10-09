const { configure } = require('./config');
const percentages = ['attendance','marks','assignments','lms','coding','aptitude','interview','engagement','skills','feedback'];
function validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Student indicators must be an object');
    for (const key of percentages) if (data[key] != null && (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0 || data[key] > 100)) throw new Error(`Invalid percentage: ${key}`);
    if (data.backlogs != null && (!Number.isInteger(data.backlogs) || data.backlogs < 0)) throw new Error('Invalid backlog count');
    if (data.marksHistory != null && (!Array.isArray(data.marksHistory) || data.marksHistory.some(x => !x || !Number.isFinite(x.value) || x.value < 0 || x.value > 100 || !Number.isFinite(Date.parse(x.date))))) throw new Error('Invalid marks history');
    return data;
}
function weighted(data, weights) {
    const indicators = Object.entries(weights).filter(([key,w]) => data[key] != null && w > 0).map(([key,weight]) => ({ key, value:data[key], weight }));
    const usedWeight = indicators.reduce((sum,x) => sum+x.weight,0);
    const totalWeight = Object.values(weights).reduce((a,b) => a+b,0);
    return { score:usedWeight ? Math.round(indicators.reduce((sum,x) => sum+x.value*x.weight,0)/usedWeight*100)/100 : null, coverage:Math.round(usedWeight/totalWeight*100), status:!usedWeight?'INSUFFICIENT_DATA':usedWeight<totalWeight?'PARTIAL':'COMPLETE', missing:Object.keys(weights).filter(key => data[key] == null && weights[key]>0), indicators };
}
function scoreAgent(data, overrides) {
    validate(data); const config = configure(overrides);
    return { agent:'score', version:1, academic:weighted(data,config.academicWeights), placement:weighted(data,config.placementWeights), method:'Weighted mean of available verified indicators; missing values are excluded and coverage is reported.' };
}
module.exports = { scoreAgent, validate, percentages };
