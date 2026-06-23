import { probe } from '../hotspot.js';
import { bValue } from './b';

export const aValue = 'A-' + bValue + '-' + probe();
console.log('circle-js a loaded', aValue);
