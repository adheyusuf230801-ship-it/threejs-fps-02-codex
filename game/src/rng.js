// All simulation and visual variation comes from this replayable stream.
export function mulberry32(seed) { let a=seed|0; return () => { a=(a+0x6d2b79f5)|0; let t=Math.imul(a^(a>>>15),1|a); t^=t+Math.imul(t^(t>>>7),61|t); return ((t^(t>>>14))>>>0)/4294967296; }; }
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
