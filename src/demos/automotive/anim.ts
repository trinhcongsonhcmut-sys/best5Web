/** Per-frame scene state derived ONLY from scroll progress (pure function of p → reversible). */
export const anim = {
  p: 0,
  /** 0..1 exploded / exoskeleton amount */
  explode: 0,
  /** metres of virtual travel (ground scroll + wheel roll) */
  roll: 0,
  /** 0..1 rear light bar */
  rear: 0,
  /** 0..1 rocker underglow */
  glow: 0,
  /** 0..1 ".01" driving beat (wheels spin, dust trails) */
  drive: 0,
};
