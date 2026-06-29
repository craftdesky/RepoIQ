import React, { useState } from 'react';

export default function ChangelogRadius({ impactResults }) {
  const [selectedFileId, setSelectedFileId] = useState("");

  const selectedImpact = impactResults.find(n => n.id === selectedFileId);

  return (
    <div className="card">
      <h3 className="title">Changelog Radius</h3>
      <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
        Select a file to view its downstream impact across the codebase. Tiers represent how far the change propagates.
      </p>

      <div style={{ marginBottom: "2rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
          Target File
        </label>
        <select 
          value={selectedFileId} 
          onChange={(e) => setSelectedFileId(e.target.value)}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
        >
          <option value="">-- Select a file --</option>
          {[...impactResults].sort((a,b) => a.id.localeCompare(b.id)).map(node => (
            <option key={node.id} value={node.id}>{node.id}</option>
          ))}
        </select>
      </div>

      {selectedImpact && selectedImpact.blastRadius ? (
        <div>
          <h4 style={{ margin: "0 0 1rem 0", color: "#111827", fontSize: "1.125rem" }}>
            Blast Radius for {selectedImpact.id.split('/').pop()}
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {/* Tier 1 */}
            <div style={{ border: "1px solid #fecaca", borderRadius: "6px", backgroundColor: "#fff5f5", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "0.75rem", backgroundColor: "#fee2e2", borderBottom: "1px solid #fecaca", borderTopLeftRadius: "5px", borderTopRightRadius: "5px", fontWeight: "600", fontSize: "0.875rem", color: "#991b1b", textAlign: "center" }}>
                Tier 1<br/>
                <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>Direct Dependents (1-2 away)</span>
              </div>
              <div style={{ padding: "0.75rem", overflowY: "auto", maxHeight: "400px", flex: 1 }}>
                {selectedImpact.blastRadius.tier1?.length > 0 ? (
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                    {selectedImpact.blastRadius.tier1.map((file, idx) => (
                      <li key={idx} style={{ padding: "0.5rem 0", borderBottom: idx < selectedImpact.blastRadius.tier1.length - 1 ? "1px solid #fecaca" : "none", wordBreak: "break-all", color: "#7f1d1d" }}>
                        {file}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#b91c1c", textAlign: "center" }}>None</p>
                )}
              </div>
            </div>

            {/* Tier 2 */}
            <div style={{ border: "1px solid #fed7aa", borderRadius: "6px", backgroundColor: "#fff7ed", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "0.75rem", backgroundColor: "#ffedd5", borderBottom: "1px solid #fed7aa", borderTopLeftRadius: "5px", borderTopRightRadius: "5px", fontWeight: "600", fontSize: "0.875rem", color: "#9a3412", textAlign: "center" }}>
                Tier 2<br/>
                <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>Indirect (3-4 away)</span>
              </div>
              <div style={{ padding: "0.75rem", overflowY: "auto", maxHeight: "400px", flex: 1 }}>
                {selectedImpact.blastRadius.tier2?.length > 0 ? (
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                    {selectedImpact.blastRadius.tier2.map((file, idx) => (
                      <li key={idx} style={{ padding: "0.5rem 0", borderBottom: idx < selectedImpact.blastRadius.tier2.length - 1 ? "1px solid #fed7aa" : "none", wordBreak: "break-all", color: "#7c2d12" }}>
                        {file}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#c2410c", textAlign: "center" }}>None</p>
                )}
              </div>
            </div>

            {/* Tier 3 */}
            <div style={{ border: "1px solid #fef08a", borderRadius: "6px", backgroundColor: "#fefce8", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "0.75rem", backgroundColor: "#fef9c3", borderBottom: "1px solid #fef08a", borderTopLeftRadius: "5px", borderTopRightRadius: "5px", fontWeight: "600", fontSize: "0.875rem", color: "#854d0e", textAlign: "center" }}>
                Tier 3<br/>
                <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>Deep Transitive (4+ away)</span>
              </div>
              <div style={{ padding: "0.75rem", overflowY: "auto", maxHeight: "400px", flex: 1 }}>
                {selectedImpact.blastRadius.tier3?.length > 0 ? (
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                    {selectedImpact.blastRadius.tier3.map((file, idx) => (
                      <li key={idx} style={{ padding: "0.5rem 0", borderBottom: idx < selectedImpact.blastRadius.tier3.length - 1 ? "1px solid #fef08a" : "none", wordBreak: "break-all", color: "#713f12" }}>
                        {file}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#a16207", textAlign: "center" }}>None</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : selectedFileId ? (
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No blast radius data available for this file.</p>
      ) : null}
    </div>
  );
}
