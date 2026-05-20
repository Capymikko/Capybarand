/* global React, ReactDOM, TopNav, Hero, Cast, Game, Manifesto, BrandWheel, Spring, FooterBar, SkyDecor,
   playWheek, TweaksPanel, TweakSection, TweakToggle, TweakRadio, TweakColor, useTweaks */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "day",
  "sound": true,
  "hero": "capy",
  "cursor": "sparkle"
}/*EDITMODE-END*/;

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  // apply mode to <html>
  React.useEffect(() => {
    document.documentElement.setAttribute('data-mode', t.mode);
  }, [t.mode]);

  const onSqueak = React.useCallback((opts) => {
    if (t.sound) playWheek(opts);
  }, [t.sound]);

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleMode = React.useCallback(() => {
    setT('mode', t.mode === 'day' ? 'night' : 'day');
  }, [t.mode]);

  return (
    <>
      <SkyDecor mode={t.mode} />
      <CursorTrail kind={t.cursor} />
      <TopNav onJump={jump} mode={t.mode} onToggleMode={toggleMode} />
      <div id="app">
        <Hero heroVariant={t.hero} onSqueak={onSqueak} />
        <Cast onSqueak={onSqueak} />
        <Game soundOn={t.sound} />
        <Manifesto />
        <BrandWheel />
        <Spring soundOn={t.sound} />
        <FooterBar />
      </div>

      <TweaksPanel title="Capybarand Tweaks">
        <TweakSection label="Vibe">
          <TweakRadio
            label="Time of day"
            value={t.mode}
            options={[
              { value: 'day', label: '☀ Day' },
              { value: 'night', label: '☾ Night' },
            ]}
            onChange={(v) => setT('mode', v)}
          />
          <TweakToggle label="Sound (wheek!)" value={t.sound} onChange={(v) => setT('sound', v)} />
        </TweakSection>
        <TweakSection label="Hero capy">
          <TweakRadio
            label="Who's in front?"
            value={t.hero}
            options={[
              { value: 'capy', label: 'Capy' },
              { value: 'barand', label: 'Barand' },
              { value: 'capoi', label: 'Capoi' },
              { value: 'baboon', label: 'Baboon' },
              { value: 'capu', label: 'Capu' },
            ]}
            onChange={(v) => setT('hero', v)}
          />
        </TweakSection>
        <TweakSection label="Cursor">
          <TweakRadio
            label="Trail effect"
            value={t.cursor}
            options={[
              { value: 'none', label: 'None' },
              { value: 'sparkle', label: '✦ Sparkle' },
              { value: 'leaf', label: '✿ Leaves' },
              { value: 'orange', label: '🍊 Oranges' },
            ]}
            onChange={(v) => setT('cursor', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

/* =========================================================================
 * Cursor trail
 * ========================================================================= */
function CursorTrail({ kind }) {
  const [bits, setBits] = React.useState([]);
  const lastRef = React.useRef(0);
  React.useEffect(() => {
    if (kind === 'none') return;
    const onMove = (e) => {
      const now = Date.now();
      if (now - lastRef.current < 50) return;
      lastRef.current = now;
      const id = now + Math.random();
      setBits(b => [...b, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setBits(b => b.filter(it => it.id !== id)), 700);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [kind]);

  if (kind === 'none') return null;

  const symbol = kind === 'sparkle' ? '✦' : kind === 'leaf' ? '✿' : '🍊';
  const color = kind === 'sparkle' ? 'var(--orange)' : kind === 'leaf' ? 'var(--green)' : 'var(--orange)';

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {bits.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          left: b.x - 10,
          top: b.y - 10,
          fontSize: 16,
          color,
          animation: 'cursorFade 0.7s ease-out forwards',
        }}>
          {symbol}
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
