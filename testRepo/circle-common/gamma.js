const alpha = require('./alpha');

module.exports = {
    gamma: 'gamma-' + (alpha && alpha.alpha ? alpha.alpha : 'no-alpha')
};

console.log('circle-common gamma loaded', module.exports.gamma);
