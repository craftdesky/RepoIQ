import { aValue } from './a';

export const cValue = 'C-' + (typeof aValue === 'undefined' ? '<<uninit>>' : aValue);
console.log('circle-js c loaded', cValue);
