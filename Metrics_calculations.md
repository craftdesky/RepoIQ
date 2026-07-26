# Metrics Calculations & Formulas

## 1. Halstead Metrics
- **Vocabulary (n):** `Unique Operators + Unique Operands`
- **Length (N):** `Total Operators + Total Operands`
- **Volume (V):** `N * log2(n)` (0 if `n=0`)
- **Difficulty (D):** `(Unique Operators / 2) * (Total Operands / Unique Operands)` (0 if `Unique Operands=0`)
- **Effort (E):** `D * V`
- **Time (T):** `E / 18` seconds
- **Delivered Bugs (B):** `V / 3000`

## 2. Cyclomatic Complexity (CC)
- **Base:** Starts at `1` per function.
- **Increment (+1) for:** `if`, `for`, `for..in`, `for..of`, `while`, `do..while`, `case` (with a test), `? :` (ternary), `||`, `&&`, and `catch`.
- **Constraint:** Functions are extracted via AST traversal.

## 3. COCOMO Model
- **KLOC:** `Lines of Code / 1000`
- **Effort (Person-Months):** `a * (KLOC ^ b)`
- **Development Time (Months):** `c * (Effort ^ d)`
- **Average Team Size:** `Effort / Development Time`
- **Constants (a, b, c, d):**
  - **Organic:** 2.4, 1.05, 2.5, 0.38
  - **Semi-Detached:** 3.0, 1.12, 2.5, 0.35
  - **Embedded:** 3.6, 1.2, 2.5, 0.32

## 4. Maintainability Index (MI)
- **Formula:** `171 - 5.2*ln(V) - 0.23*CC - 16.2*ln(LOC) + 50*sqrt(2.46*CD)`
- **Variables:** `V`=Halstead Volume, `CC`=Cyclomatic Complexity, `LOC`=Lines of Code, `CD`=Comment Density.
- **Constraints:** `V >= 1`, `LOC >= 1`, `CC >= 1`, `0 <= CD <= 1`. Result is clamped to `[0, 100]`.
- **Thresholds / Categories:**
  - `MI >= 90`: Highly Maintainable (Excellent)
  - `MI >= 70`: Moderately Maintainable (Good)
  - `MI >= 50`: Low Maintainability (Concerning)
  - `MI < 50`: Unmaintainable (Critical)

## 5. Hotspot Score
- **Coupling Score:** `0.7*(Outgoing External / Outgoing Total) + 0.3*(Incoming External / Incoming Total)`
- **Impact Score:** `0.7*(Affected / Max Affected) + 0.3*(Dependents / Max Dependents)`
- **Complexity Score:** `CC / Max CC`
- **Cycle Penalty:** `min(CyclesCount * 0.10, 0.40)`
- **Formula:** `W1*Coupling + W2*Impact + W3*Complexity + W4*Cycle Penalty` (default weights: 0.35, 0.35, 0.25, 0.05). Clamped to `[0, 1]` and mapped to `100`.
- **Thresholds / Categories:**
  - `Score >= 80`: Critical Risk
  - `Score >= 60`: High Risk
  - `Score >= 30`: Moderate Risk
  - `Score < 30`: Low Risk

## 6. Technical Debt
- **Complexity Debt:** Penalizes files with `CC > 10` (+10) and `CC > 15` (+20).
- **Coupling Debt:** `Coupling Density * 100` (x1.25 multiplier if density > 0.75).
- **Cycle Debt:** `Cycles * 15` (capped at 100).
- **Documentation Debt:** Capped at 40 (Critical lack if `CD < 0.05`).
- **Maintainability Debt:** Penalizes `MI < 70` (+20) and `MI < 50` (+40).
- **Total Debt Score:** Weighted sum `(Complexity*0.30 + Coupling*0.25 + Cycles*0.25 + Docs*0.15 + MI*0.05)`. Capped at `100`.
- **Thresholds / Categories (Overall Risk):**
  - `Score <= 20`: Low Risk
  - `Score <= 40`: Medium Risk
  - `Score <= 60`: High Risk
  - `Score > 60`: Critical Risk

## 7. Architecture Health Score
- **Cycles Penalty:** `min(Cycles * 0.10, 0.40)`
- **Coupling Penalty:** `min(Coupling Density * 0.30, 0.30)`
- **Complexity Penalty:** `0` if `Average CC <= 2`, else `min((Average CC - 2) * 0.10, 0.30)`
- **Formula:** `(1.0 - (Cycles Penalty + Coupling Penalty + Complexity Penalty)) * 100`. Clamped to `[0, 100]`.

## 8. Code Quality Score
- **Complexity Score:** `1 - (Avg CC - 1)/(10 - 1)` (clamped to 0-1, 100 scale).
- **Coupling Score:** `1 - Coupling Density` (clamped to 0-1, 100 scale).
- **Documentation Score:** `Comment Density / 0.3` (clamped to 0-1, 100 scale).
- **Architecture Score:** `100 - min(100, Cycles * 10)`.
- **Consistency Score:** `100 - min(100, Coefficient of Variance for CC %)` where Variance is `(StdDev / Mean CC) * 100`.
- **Total Quality Score:** `(Complexity*0.25) + (Coupling*0.25) + (Docs*0.20) + (Arch*0.20) + (Consistency*0.10)`.
- **Thresholds / Categories:**
  - `Score >= 80`: Excellent (Grade A)
  - `Score >= 60`: Good (Grade B)
  - `Score >= 40`: Fair (Grade C)
  - `Score >= 20`: Poor (Grade D)
  - `Score < 20`: Poor (Grade F)

## 9. Coupling Density
- **External Links:** Edges where the source file and target file are located in different directories.
- **Internal Links:** Edges where both files reside in the same directory.
- **Formula:** `External Links / Total Links`

## 10. Comment Density
- **Code Lines:** `Total Lines - Blank Lines - Pure Comment Lines`
- **Comment Density:** `Pure Comment Lines / Code Lines`
- **Comment Coverage:** `Lines with Comments / Total Lines`

## 11. External Dependency Risk
- **Declared:** Third-party module imports that exist in `package.json` dependencies.
- **Undeclared:** Third-party module imports that are missing from `package.json` (excluding Node.js built-ins).
- **Unused:** Dependencies listed in `package.json` but never imported anywhere in the codebase.
- **Node Built-ins:** Core Node.js modules (e.g., `fs`, `path`, `http`) used natively.
