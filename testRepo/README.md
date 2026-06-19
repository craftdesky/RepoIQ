# Test Repo with Circular Dependencies

This folder contains sample files and folders with intentional circular dependencies for testing the analyzer.

Structure created:

- `circle-js/` - ES module cycle: `a.js -> b.js -> c.js -> a.js`
- `circle-common/` - CommonJS cycle using `require`: `alpha -> beta -> gamma -> alpha`
- `react/` - JSX components forming a cycle: `CompA -> CompB -> CompC -> CompA`
- `reexports/` - Re-export cycle using `export * from`: `one -> two -> three -> one`
- `dynamic/` - Dynamic `import()` cycle: `d1 -> d2 -> d3 -> d1`
