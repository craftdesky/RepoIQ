function calculateArchitecturalHealth({ numCycles = 0, couplingDensity = 0, CCavg = 0 } = {}) {
    const couplingValue = typeof couplingDensity === "object" ? (couplingDensity.density || 0) : (couplingDensity || 0);

    // Cycles penalty: 10% per cycle, capped at 40%
    const P_cycles = Math.min(numCycles * 0.10, 0.40);

    // Coupling penalty: couplingDensity * 30%
    const P_coupling = Math.min(Math.max(0, couplingValue) * 0.30, 0.30);

    // Complexity penalty: (CCavg - 2) * 10% capped at 30%; no penalty if CCavg <= 2
    const P_complexity = CCavg <= 2 ? 0 : Math.min((CCavg - 2) * 0.10, 0.30);

    const P_total = P_cycles + P_coupling + P_complexity;

    const raw = 1.0 - P_total;
    const health = Math.round(Math.max(0, Math.min(1, raw)) * 100);

    return {
        healthScore: health,
        components: {
            P_cycles: Number(P_cycles.toFixed(4)),
            P_coupling: Number(P_coupling.toFixed(4)),
            P_complexity: Number(P_complexity.toFixed(4)),
            P_total: Number(P_total.toFixed(4))
        },
        inputs: {
            numCycles,
            couplingDensity: couplingValue,
            CCavg
        }
    };
}

module.exports = {
    calculateArchitecturalHealth
};
