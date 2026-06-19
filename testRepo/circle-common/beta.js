const gamma = require('./gamma');

module.exports = {
    beta: 'beta-' + (gamma && gamma.gamma ? gamma.gamma : 'no-gamma')
};

console.log('circle-common beta loaded', module.exports.beta);
