import { probe } from '../hotspot.js';
import { cValue } from './c';

export const bValue = 'B-' + cValue + '-' + probe();
console.log('circle-js b loaded', bValue);
