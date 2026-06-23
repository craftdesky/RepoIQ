import { probe } from '../hotspot.js';
import React from 'react';
import CompC from './CompC';

export default function CompB() {
    return (
        <div>
            <h3>CompB - {probe()}</h3>
            <CompC />
        </div>
    );
}
