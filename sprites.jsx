/* global React */
const { useMemo: useMemoS } = React;

/* ===========================================================
 * Pixel Sprite (kept for the orange in the mini-game)
 * =========================================================== */
function Sprite({ pattern, palette, scale = 6, style = {}, className = '' }) {
  const { w, h, cells } = useMemoS(() => {
    const w = pattern[0].length;
    const h = pattern.length;
    const cells = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push(pattern[r][c]);
    return { w, h, cells };
  }, [pattern]);
  return (
    <div className={`pixel-sprite ${className}`} style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${w}, ${scale}px)`,
      gridTemplateRows: `repeat(${h}, ${scale}px)`,
      width: w * scale, height: h * scale, ...style,
    }}>
      {cells.map((ch, i) => (
        <div key={i} style={{ backgroundColor: ch === '.' ? 'transparent' : (palette[ch] || 'transparent') }} />
      ))}
    </div>
  );
}

/* Pixel orange (for the cursor trail + a wee one inside the want-bubble) */
const ORANGE = [
  '..nnnn..',
  '.nooon..',
  'oOOOOOOo',
  'oOOOLLOo',
  'oOOOOOOo',
  'oOOOSSOo',
  '.oOOSSo.',
  '..oooo..',
];
const ORANGE_PAL = {
  n: '#4F8B3A', o: '#000000', O: '#FF8C42', L: '#FFB76B', S: '#E5670C',
};

/* ===========================================================
 * Character data — real SVG stickers
 * `src` is the sticker portrait (used for cast cards, mini-game, spring).
 * `swatch` is the brand-sheet color square.
 * `tone` controls a faint card-glow / "name banner" color in dark mode.
 * =========================================================== */
const CAST = [
  {
    id: 'capy',
    name: 'CAPY',
    nameTh: 'คาปี้',
    role: 'The Leader',
    roleTh: 'ผู้นำใจสงบ',
    src: 'assets/capy.svg',
    swatch: '#BA7A35',
    tone: '#FFD261',
    quote: 'Lead with calm. Snack with confidence.',
    quoteTh: 'นำด้วยใจเย็น กินส้มอย่างมั่นใจ',
  },
  {
    id: 'barand',
    name: 'BARAND',
    nameTh: 'บาแรนด์',
    role: 'The Stylist',
    roleTh: 'สายแต่งตัว',
    src: 'assets/barand.svg',
    swatch: '#969184',
    tone: '#FFD261',
    quote: 'Fur today, fab forever.',
    quoteTh: 'ขนสวยวันนี้ ปังตลอดไป',
  },
  {
    id: 'capoi',
    name: 'CAPOI',
    nameTh: 'แคปอย',
    role: 'The Loud One',
    roleTh: 'สายเสียงดัง',
    src: 'assets/capoi.svg',
    swatch: '#704C28',
    tone: '#FFD261',
    quote: 'Wheek wheek WHEEK!',
    quoteTh: 'วี้ก วี้ก วี้ก!',
  },
  {
    id: 'baboon',
    name: 'BABOON',
    nameTh: 'บาบูน',
    role: 'The Sleepy',
    roleTh: 'สายหลับ',
    src: 'assets/baboon.svg',
    swatch: '#543A24',
    tone: '#FFD261',
    quote: 'Naps are productive.',
    quoteTh: 'งีบคืองาน',
  },
  {
    id: 'capu',
    name: 'CAPU',
    nameTh: 'แคปปู',
    role: 'The Little One',
    roleTh: 'น้องเล็ก',
    src: 'assets/capu.svg',
    swatch: '#A6431C',
    tone: '#FFD261',
    quote: 'Just keep nibbling.',
    quoteTh: 'แทะต่อไปนะ',
  },
];

/* Hero portrait variants (the giant capy). The hero portrait has a label too,
 * but we crop/scale so the face dominates. */
const HERO_VARIANTS = [
  { id: 'capy',   src: 'assets/capy.svg' },
  { id: 'barand', src: 'assets/barand.svg' },
  { id: 'capoi',  src: 'assets/capoi.svg' },
  { id: 'baboon', src: 'assets/baboon.svg' },
  { id: 'capu',   src: 'assets/capu.svg' },
];

/* A small reusable img component for capys.
 * - object-contain so the sticker doesn't get squashed
 * - drop-shadow for that lifted sticker feel
 */
function CapyImg({ src, size = 120, style = {}, className = '' }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: size, height: size,
        objectFit: 'contain',
        display: 'block',
        filter: 'drop-shadow(3px 3px 0 var(--ink))',
        userSelect: 'none',
        ...style,
      }}
      className={className}
    />
  );
}

Object.assign(window, { Sprite, ORANGE, ORANGE_PAL, CAST, HERO_VARIANTS, CapyImg });
