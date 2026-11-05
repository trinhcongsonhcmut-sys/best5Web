/** Ingredient callouts: written by the R3F scene (projected anchor px), read by the DOM overlay each frame. */
export const CALLOUTS = [
  { title: 'Gamberi', sub: 'tôm sú nướng than', side: 'r' },
  { title: 'Cozze', sub: 'vẹm xanh hấp vang', side: 'l' },
  { title: 'Pomodorini', sub: 'cà chua bi confit', side: 'r' },
  { title: 'Basilico', sub: 'húng tây vừa hái', side: 'l' },
  { title: 'Spaghetti', sub: 'alla chitarra · mì cán tay', side: 'r' },
] as const;

/** x,y = anchor on the ingredient (px); tx,ty = where the label text sits (leader line between); side: 1 = label to the right of its anchor, -1 = to the left */
export const callouts = CALLOUTS.map(() => ({ x: 0, y: 0, tx: 0, ty: 0, op: 0, vis: 0, side: 1, col: 1, lineK: 1 }));
