import { probe } from '../hotspot.js';
import React from 'react';
import CompB from './CompB';

export default function CompA() {
    return (
        <div>
            <h3>CompA - {probe()}</h3>
            <CompB />
        </div>
    );
}
