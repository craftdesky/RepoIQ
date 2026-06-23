const { probe } = require('../hotspot');
const gamma = require('./gamma');

module.exports = {
    beta: 'beta-' + (gamma && gamma.gamma ? gamma.gamma : 'no-gamma') + '-' + (probe ? 'p' : 'np')
};

console.log('circle-common beta loaded', module.exports.beta);
