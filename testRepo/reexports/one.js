import { probe } from '../hotspot.js';
export * from './two';

// reexports/one -> two -> three -> one (cycle)  (probe: "" + probe())
