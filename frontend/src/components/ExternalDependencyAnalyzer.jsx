import React, { useState } from 'react';

export default function ExternalDependencyAnalyzer({ externalDeps }) {
  const [expandedPkg, setExpandedPkg] = useState(null);
  
  if (!externalDeps) {
    return <div className="text-muted">No external dependency data available.</div>;
  }

  const { summary, used, unused, undeclared, builtins } = externalDeps;

  return (
    <div className="card">
      <h3 className="title">External Dependency Risk Evaluator</h3>
      <p className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Audit your third-party packages to find unused libraries, undeclared dependencies, and core package usage across your repository.
      </p>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ padding: "1rem", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", textAlign: "center" }}>
          <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>DECLARED</span>
          <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#111827" }}>{summary.declaredCount}</span>
        </div>
        <div style={{ padding: "1rem", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", textAlign: "center" }}>
          <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>USED</span>
          <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#065f46" }}>{summary.usedCount}</span>
        </div>
        <div style={{ padding: "1rem", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", textAlign: "center" }}>
          <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>UNUSED</span>
          <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#991b1b" }}>{summary.unusedCount}</span>
        </div>
        <div style={{ padding: "1rem", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", textAlign: "center" }}>
          <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>UNDECLARED</span>
          <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#92400e" }}>{summary.undeclaredCount}</span>
        </div>
        <div style={{ padding: "1rem", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", textAlign: "center" }}>
          <span className="text-muted" style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>NODE BUILT-INS</span>
          <span style={{ fontSize: "1.5rem", fontWeight: "600", color: "#4b5563" }}>{summary.builtinCount}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Unused Warning */}
        <div style={{ border: "1px solid #fecaca", borderRadius: "6px", backgroundColor: "#fff5f5" }}>
          <div style={{ padding: "0.75rem", backgroundColor: "#fee2e2", borderBottom: "1px solid #fecaca", borderTopLeftRadius: "5px", borderTopRightRadius: "5px", fontWeight: "600", fontSize: "0.875rem", color: "#991b1b" }}>
            Unused Dependencies (Bloat Risk)
          </div>
          <div style={{ padding: "0.75rem" }}>
            {unused.length > 0 ? (
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem", color: "#7f1d1d" }}>
                {unused.map((pkg, i) => (
                  <li key={i} style={{ padding: "0.25rem 0", borderBottom: i < unused.length - 1 ? "1px solid #fecaca" : "none" }}>
                    <code>{pkg}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534" }}>No unused dependencies detected!</p>
            )}
          </div>
        </div>

        {/* Undeclared Warning */}
        <div style={{ border: "1px solid #fde68a", borderRadius: "6px", backgroundColor: "#fffbeb" }}>
          <div style={{ padding: "0.75rem", backgroundColor: "#fef3c7", borderBottom: "1px solid #fde68a", borderTopLeftRadius: "5px", borderTopRightRadius: "5px", fontWeight: "600", fontSize: "0.875rem", color: "#92400e" }}>
            Undeclared Packages (Ghost Imports)
          </div>
          <div style={{ padding: "0.75rem", maxHeight: "250px", overflowY: "auto" }}>
            {undeclared.length > 0 ? (
              <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem", color: "#78350f" }}>
                {undeclared.map((pkg, i) => (
                  <li key={i} style={{ padding: "0.5rem 0", borderBottom: i < undeclared.length - 1 ? "1px solid #fde68a" : "none" }}>
                    <code>{pkg.name}</code> <span className="text-muted">({pkg.files.length} files)</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534" }}>All external imports are declared!</p>
            )}
          </div>
        </div>
      </div>

      {/* Used Dependencies Table */}
      <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#37352F" }}>Declared & Used Dependencies</h4>
      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", backgroundColor: "#ffffff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>Package Name</th>
              <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>Usage Count</th>
              <th style={{ padding: "0.75rem", textAlign: "left", color: "#374151" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {used.sort((a,b) => b.files.length - a.files.length).map(pkg => (
              <React.Fragment key={pkg.name}>
                <tr 
                  onClick={() => setExpandedPkg(expandedPkg === pkg.name ? null : pkg.name)}
                  style={{ 
                    cursor: "pointer", 
                    backgroundColor: expandedPkg === pkg.name ? "#f9fafb" : "transparent",
                    borderBottom: "1px solid #e5e7eb",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = expandedPkg === pkg.name ? "#f9fafb" : "#f3f4f6"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedPkg === pkg.name ? "#f9fafb" : "transparent"}
                >
                  <td style={{ padding: "0.75rem", fontWeight: "500", color: "#2563eb" }}><code>{pkg.name}</code></td>
                  <td style={{ padding: "0.75rem", color: "#374151" }}>{pkg.files.length} files</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span className="badge badge-info" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Verified</span>
                  </td>
                </tr>
                {expandedPkg === pkg.name && (
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <td colSpan={3} style={{ padding: "1.5rem" }}>
                      <h5 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", color: "#37352F" }}>Imported by:</h5>
                      <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "0.5rem", backgroundColor: "#ffffff" }}>
                        <ul style={{ listStyleType: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
                          {pkg.files.map((file, idx) => (
                            <li key={idx} style={{ padding: "0.5rem", borderBottom: idx < pkg.files.length - 1 ? "1px solid #f3f4f6" : "none", wordBreak: "break-all", color: "#4b5563" }}>
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {used.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280" }}>
                  No declared dependencies are used in the source code.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
