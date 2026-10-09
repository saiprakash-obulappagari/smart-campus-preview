const defaults = {
    mediumBelow: 60, highBelow: 30, declineMedium: 5, declineHigh: 10,
    backlogMedium: 1, backlogHigh: 3,
    academicWeights: { attendance: 0.3, marks: 0.5, assignments: 0.2 },
    placementWeights: { coding: 0.5, aptitude: 0.2, interview: 0.3 }
};
function configure(overrides = {}) {
    const config = { ...defaults, ...overrides };
    for (const key of ['mediumBelow','highBelow','declineMedium','declineHigh','backlogMedium','backlogHigh']) {
        if (!Number.isFinite(config[key]) || config[key] < 0) throw new Error(`Invalid configuration: ${key}`);
    }
    if (config.highBelow >= config.mediumBelow || config.mediumBelow > 100 || config.declineMedium > config.declineHigh || config.backlogMedium > config.backlogHigh) throw new Error('Invalid threshold ordering');
    for (const group of ['academicWeights','placementWeights']) {
        if (!config[group] || Object.keys(config[group]).sort().join() !== Object.keys(defaults[group]).sort().join() || Object.values(config[group]).some(w => !Number.isFinite(w) || w < 0) || Object.values(config[group]).reduce((a,b) => a+b,0) <= 0) throw new Error(`Invalid ${group}`);
    }
    return config;
}
module.exports = { defaults, configure };
