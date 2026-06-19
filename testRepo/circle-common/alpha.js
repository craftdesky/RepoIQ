const beta = require('./beta');

module.exports = {
    alpha: 'alpha-' + (beta && beta.beta ? beta.beta : 'no-beta')
};

console.log('circle-common alpha loaded', module.exports.alpha);
