import { probe } from '../hotspot.js';
import { aValue } from './a';

export const cValue = 'C-' + (typeof aValue === 'undefined' ? '<<uninit>>' : aValue) + '-' + probe();
console.log('circle-js c loaded', cValue);
