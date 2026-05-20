/* global React, Sprite, CAST, HERO_VARIANTS, CapyImg, ORANGE, ORANGE_PAL */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* =========================================================================
 * Audio: square-wave wheek, munch, pop
 * ========================================================================= */
let audioCtx = null;
function getCtx() {
  if (!audioCtx) {
    try {audioCtx = new (window.AudioContext || window.webkitAudioContext)();}
    catch (e) {return null;}
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playWheek({ pitch = 880, duration = 0.18, sweep = 1.3 } = {}) {
  const ctx = getCtx();if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * sweep, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);osc.stop(t + duration + 0.02);
}
function playPop() {playWheek({ pitch: 600, duration: 0.08, sweep: 1.6 });}
function playMunch() {
  const ctx = getCtx();if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300 + i * 60, t + i * 0.05);
    gain.gain.setValueAtTime(0.0001, t + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.14, t + i * 0.05 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.07);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.05);osc.stop(t + i * 0.05 + 0.08);
  }
}

/* ====== Sky decor: clouds (day) / stars (night) ====== */
function SkyDecor() {
  const stars = useMemo(() =>
  Array.from({ length: 60 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, d: Math.random() * 2
  })),
  []);
  const clouds = useMemo(() =>
  Array.from({ length: 5 }, (_, i) => ({
    top: 8 + i * 12, dur: 80 + Math.random() * 60, delay: -Math.random() * 80,
    scale: 0.6 + Math.random() * 0.6
  })),
  []);
  return (
    <>
      <div className="sky-bg" />
      <div className="clouds">
        {clouds.map((c, i) =>
        <div key={i} className="cloud" style={{
          top: `${c.top}%`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`,
          transform: `scale(${c.scale})`
        }}>
            <div style={{
            width: 96, height: 56, background: '#fff',
            border: 'var(--border-pixel)', borderRadius: 999,
            boxShadow: 'inset -8px -8px 0 #ECE3D3'
          }} />
          </div>
        )}
      </div>
      <div className="stars">
        {stars.map((s, i) =>
        <div key={i} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s`
        }} />
        )}
      </div>
    </>);

}

/* =========================================================================
 * Top Nav with circular badge
 * ========================================================================= */
function TopNav({ onJump, mode }) {
  return (
    <nav className="topnav">
      <div className="brandmark">
        <img src="assets/badge.svg"
        alt="" style={{
          width: 44, height: 44, objectFit: 'contain'
        }} />
        <span>CAPYBARAND</span>
      </div>
      <div className="nav-links">
        <a className="nav-link" onClick={() => onJump('cast')}>Cast</a>
        <a className="nav-link" onClick={() => onJump('game')}>Play</a>
        <a className="nav-link" onClick={() => onJump('manifesto')}>Manifesto</a>
        <a className="nav-link" onClick={() => onJump('wheel')}>Wheel</a>
        <a className="nav-link" onClick={() => onJump('spring')}>Hot&nbsp;Spring</a>
      </div>
    </nav>);

}

/* =========================================================================
 * Hero: big sticker that wiggles, breathes, parallax-tilts, and squeaks
 * ========================================================================= */
function Hero({ heroVariant, onSqueak }) {
  const wrapRef = useRef(null);
  const portraitRef = useRef(null);
  const [wiggling, setWiggling] = useState(false);
  const [sparks, setSparks] = useState([]);
  const [breathing, setBreathing] = useState(1);

  // breathing
  useEffect(() => {
    let raf;
    const loop = () => {
      setBreathing(1 + Math.sin(Date.now() / 900) * 0.018);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // parallax tilt
  useEffect(() => {
    const onMove = (e) => {
      const wrap = wrapRef.current;
      const p = portraitRef.current;
      if (!wrap || !p) return;
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width; // -0.5 … 0.5
      const dy = (e.clientY - cy) / rect.height;
      const rx = -dy * 8;
      const ry = dx * 10;
      const tx = dx * 12;
      const ty = dy * 6;
      p.style.setProperty('--tilt-rx', rx + 'deg');
      p.style.setProperty('--tilt-ry', ry + 'deg');
      p.style.setProperty('--tilt-tx', tx + 'px');
      p.style.setProperty('--tilt-ty', ty + 'px');
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleClick = (e) => {
    onSqueak();
    setWiggling(true);
    setTimeout(() => setWiggling(false), 480);
    // sparkles around click
    const rect = wrapRef.current.getBoundingClientRect();
    const baseX = e.clientX - rect.left;
    const baseY = e.clientY - rect.top;
    const id = Date.now();
    const burst = Array.from({ length: 8 }, (_, i) => ({
      id: id + i,
      x: baseX + (Math.random() - 0.5) * 200,
      y: baseY + (Math.random() - 0.5) * 200
    }));
    setSparks((s) => [...s, ...burst]);
    setTimeout(() => setSparks((s) => s.filter((sp) => !burst.includes(sp))), 800);
  };

  const variant = HERO_VARIANTS.find((v) => v.id === heroVariant) || HERO_VARIANTS[0];

  return (
    <section className="hero">
      <div className="hero-grid">
        <div>
          <div className="badges">
            <span className="badge y">EST. 2020</span>
            <span className="badge o">VOL. 2026</span>
            <span className="badge g">♡ MADE&nbsp;IN&nbsp;TH</span>
          </div>
          <h1 className="hero-title" style={{ marginTop: 24 }}>
            DON’T<br />WORRY,<br />BE CAPY.
          </h1>
          <div className="hero-th">อย่ากังวล อยู่อย่างคาปี้</div>
          <p className="hero-sub">Cheerful comfort for everyday mindful living. Five guinea pigs, one calm philosophy, and a permanent supply of oranges.


          </p>
          <div className="hero-ctas">
            <button className="pxbtn orange" onClick={() => {
              onSqueak();
              document.getElementById('cast')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Meet the Cast →
            </button>
            <button className="pxbtn" onClick={() => {
              document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Feed Them ◇
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
          <div
            className="face-frame"
            ref={wrapRef}
            style={{ cursor: 'pointer', perspective: '900px' }}
            onClick={handleClick}>
            
            <span className="corner-tag">CPBR · 2026</span>
            <span className="corner-tag right">Click me ♡</span>
            <div
              ref={portraitRef}
              className={wiggling ? 'hero-wiggle' : ''}
              style={{
                width: '100%', height: '100%',
                display: 'grid', placeItems: 'center',
                transformStyle: 'preserve-3d',
                transform: `rotateX(var(--tilt-rx,0)) rotateY(var(--tilt-ry,0)) translate(var(--tilt-tx,0), var(--tilt-ty,0)) scale(${breathing})`,
                transition: 'transform 0.15s ease-out'
              }}>
              
              <img
                src={variant.src}
                alt=""
                draggable={false}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(6px 6px 0 var(--ink))',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }} />
              
            </div>
            {sparks.map((s) =>
            <div key={s.id} className="sparkle" style={{ left: s.x, top: s.y }} />
            )}
          </div>
        </div>
      </div>

      {sparks.map((s) =>
      <div key={s.id} className="sparkle" style={{ left: s.x, top: s.y, position: 'fixed' }} />
      )}
    </section>);

}

function FloatingDoodle({ children, left, right, top, bottom, rot = 0, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute', left, right, top, bottom,
      transform: `rotate(${rot}deg)`,
      animation: `bobby 4s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none'
    }}>
      {children}
    </div>);

}

/* =========================================================================
 * Cast section
 * ========================================================================= */
function Cast({ onSqueak }) {
  return (
    <section id="cast">
      <div className="section-inner">
        <div className="section-eyebrow" style={{ fontFamily: "Jumble" }}>★ The Cast · <span style={{ fontFamily: "\"IBM Plex Sans Thai\"", fontWeight: "700" }}>นักแสดง</span></div>
        <h2 className="section-title">Meet the Capys</h2>
        <div className="section-th" style={{ fontFamily: "\"IBM Plex Sans Thai\"" }}>หนูตะเภา 5 ตัว ที่เราเรียกพวกเขาว่าคาปิบารา</div>
        <div className="cast-grid">
          {CAST.map((c) => <CapyCard key={c.id} capy={c} onSqueak={onSqueak} />)}
        </div>
      </div>
    </section>);

}

function CapyCard({ capy, onSqueak }) {
  const cardRef = useRef(null);
  const [reacting, setReacting] = useState(false);
  const [sparks, setSparks] = useState([]);
  const react = (e) => {
    setReacting(true);
    onSqueak({ pitch: 700 + capy.name.length * 40 });
    const rect = cardRef.current.getBoundingClientRect();
    const baseX = e.clientX - rect.left;
    const baseY = e.clientY - rect.top;
    const id = Date.now();
    const newSparks = Array.from({ length: 5 }, (_, i) => ({
      id: id + i,
      x: baseX + (Math.random() - 0.5) * 100,
      y: baseY + (Math.random() - 0.5) * 80
    }));
    setSparks((s) => [...s, ...newSparks]);
    setTimeout(() => setSparks((s) => s.filter((sp) => !newSparks.includes(sp))), 700);
    setTimeout(() => setReacting(false), 700);
  };
  return (
    <div
      ref={cardRef}
      className={`capy-card ${reacting ? 'reacting' : ''}`}
      onClick={react}>
      
      <span className="swatch" style={{ background: capy.swatch }} />
      <div className="bubble">
        {capy.quote}
        <span className="th">{capy.quoteTh}</span>
      </div>
      <div style={{
        display: 'grid', placeItems: 'center',
        overflow: 'hidden',
        background: 'transparent',
        borderRadius: 8, padding: "0px", width: "180px", height: "200px"
      }}>
        <img
          src={capy.cardSrc || capy.src}
          alt={capy.name}
          draggable={false}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            transform: reacting ? 'translateY(-6px) rotate(-4deg) scale(1.05)' : 'translateY(0) scale(1)',
            transition: 'transform 0.2s ease',
            filter: 'drop-shadow(3px 3px 0 var(--ink))',
            userSelect: 'none', pointerEvents: 'none'
          }} />
        
      </div>
      <div className="name">{capy.name}</div>
      <div className="role">{capy.role} · {capy.roleTh}</div>
      {sparks.map((s) =>
      <div key={s.id} className="sparkle" style={{ left: s.x, top: s.y }} />
      )}
    </div>);

}

Object.assign(window, { Hero, Cast, TopNav, SkyDecor, playWheek, playPop, playMunch });