import { probe } from '../hotspot.js';
import React from 'react';
import CompA from './CompA';

export default function CompC() {
    return (
        <div>
            <h3>CompC - {probe()}</h3>
            <CompA />
        </div>
    );
}
