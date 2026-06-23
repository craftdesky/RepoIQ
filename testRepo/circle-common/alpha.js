const { probe } = require('../hotspot');
const beta = require('./beta');

module.exports = {
    alpha: 'alpha-' + (beta && beta.beta ? beta.beta : 'no-beta') + '-' + (probe ? 'p' : 'np')
};

console.log('circle-common alpha loaded', module.exports.alpha);
