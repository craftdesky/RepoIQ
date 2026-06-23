// A deliberately complex module used by tests to create hotspot-like behavior.
// Contains multiple functions with control flow to raise cyclomatic complexity
// and is imported by many other files to increase coupling/impact.

export function probe() {
  return "probe";
}

export function complexA(n) {
  let r = 0;
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) r += 1;
    else if (i % 3 === 0) r += 2;

    switch (i % 5) {
      case 0:
        r += 1;
        break;
      case 1:
        r += 2;
        break;
      default:
        r += 0;
    }
  }
  return r;
}

export function complexB(x) {
  if (!x) return 0;
  let s = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      if ((i + j) % 2 === 0) s += i + j;
      else s -= j;
    }
  }
  try {
    JSON.parse('{}');
  } catch (e) {
    s += 1;
  }
  return s;
}

export function complexC(flag) {
  let v = 0;
  if (flag) {
    v += 1;
    if (flag === true) v += 2;
    else v += 0;
  } else {
    for (let k = 0; k < 2; k++) {
      v += k;
      while (v < 10) {
        v += 1;
        if (v > 5) break;
      }
    }
  }
  return v;
}

export function utilOne(a) { return a ? a * 2 : a; }
export function utilTwo(b) { return b + 1; }
export function utilThree(c) { return c - 1; }
export function utilFour(d) { for (let i = 0; i < 3; i++) d += i; return d; }
export function utilFive(e) { if (e > 10) return e; if (e > 5) return e + 1; return 0; }
export function utilSix(f) { switch (f) { case 0: return 0; case 1: return 1; default: return -1; } }

export function manyBranches(x) {
  let t = 0;
  if (x === 0) t += 1;
  if (x === 1) t += 2;
  if (x === 2) t += 3;
  if (x === 3) t += 4;
  if (x === 4) t += 5;
  return t;
}

export default {
  probe,
  complexA,
  complexB,
  complexC
};
