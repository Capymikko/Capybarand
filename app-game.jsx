/* global React, Sprite, CAST, ORANGE, ORANGE_PAL, playMunch, playPop, playWheek */
const { useState: useStateG, useEffect: useEffectG, useRef: useRefG, useCallback: useCallbackG } = React;

/* =========================================================================
 * Leaderboard persistence (shared between mini-games)
 * ========================================================================= */
function readBoard(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function writeBoard(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list.slice(0, 10))); } catch {}
}
function addToBoard(key, name, score) {
  const cleaned = (name || 'CAPY FAN').trim().slice(0, 12).toUpperCase() || 'CAPY FAN';
  const list = readBoard(key);
  list.push({ name: cleaned, score, ts: Date.now() });
  list.sort((a, b) => b.score - a.score);
  writeBoard(key, list);
  return list.slice(0, 10);
}

/* =========================================================================
 * <Scoreboard> — pixel-arcade leaderboard panel
 * ========================================================================= */
function Scoreboard({ title, themeColor, entries, highlightIndex }) {
  const rows = entries.slice(0, 7);
  while (rows.length < 7) rows.push(null);
  return (
    <div className="scoreboard">
      <div className="scoreboard-head" style={{ background: themeColor }}>
        <span>🏆</span>
        <span>{title}</span>
      </div>
      <ol className="scoreboard-list">
        {rows.map((r, i) => (
          <li key={i} className={i === highlightIndex ? 'me' : ''}>
            <span className="rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="who">{r ? r.name : '— — — — —'}</span>
            <span className="pts">{r ? r.score : '· · ·'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* =========================================================================
 * Catch-the-Orange Mini Game
 * ========================================================================= */
function Game({ soundOn }) {
  const stageRef = useRefG(null);
  const [oranges, setOranges] = useStateG([]);
  const [score, setScore] = useStateG(0);
  const [timeLeft, setTimeLeft] = useStateG(45);
  const [playing, setPlaying] = useStateG(false);
  const [pops, setPops] = useStateG([]);
  const [fullIds, setFullIds] = useStateG([]);
  const [targetId, setTargetId] = useStateG('capy');
  const [playerName, setPlayerName] = useStateG(() => localStorage.getItem('capy-name') || '');
  const [board, setBoard] = useStateG(() => readBoard('capy-board-orange'));
  const [lastRank, setLastRank] = useStateG(-1);

  const dragRef = useRefG({ id: null, offX: 0, offY: 0, ele: null });
  const nextIdRef = useRefG(1);

  const randomOrangePos = () => ({
    x: 34 + Math.random() * 110,
    y: 34 + Math.random() * 100,
  });

  useEffectG(() => { localStorage.setItem('capy-name', playerName); }, [playerName]);

  // Spawn oranges while playing
  useEffectG(() => {
    if (!playing) return;
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      setOranges(prev => {
        if (prev.length >= 5) return prev;
        const id = nextIdRef.current++;
        return [...prev, { id, ...randomOrangePos(), dragging: false }];
      });
    };
    spawn();
    const i = setInterval(spawn, 1200);
    return () => { cancelled = true; clearInterval(i); };
  }, [playing]);

  // Idle decoration: a few oranges already on tree
  useEffectG(() => {
    if (oranges.length === 0 && !playing) {
      setOranges([
        { id: 'seed1', ...randomOrangePos(), dragging: false },
        { id: 'seed2', ...randomOrangePos(), dragging: false },
        { id: 'seed3', ...randomOrangePos(), dragging: false },
      ]);
    }
  }, []); // eslint-disable-line

  // Timer
  useEffectG(() => {
    if (!playing) return;
    if (timeLeft <= 0) {
      setPlaying(false);
      // commit score to leaderboard
      const newBoard = addToBoard('capy-board-orange', playerName, score);
      setBoard(newBoard);
      const idx = newBoard.findIndex(e => e.score === score && e.name.toUpperCase() === (playerName || 'CAPY FAN').toUpperCase().slice(0,12));
      setLastRank(idx);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, timeLeft]); // eslint-disable-line

  // Rotate target capy
  useEffectG(() => {
    if (!playing) return;
    const ids = CAST.map(c => c.id);
    const i = setInterval(() => {
      setTargetId(prev => {
        const others = ids.filter(x => x !== prev);
        return others[Math.floor(Math.random() * others.length)];
      });
    }, 3500);
    return () => clearInterval(i);
  }, [playing]);

  const startGame = () => {
    setScore(0); setTimeLeft(45); setPlaying(true); setOranges([]);
    setLastRank(-1);
    nextIdRef.current = 1;
  };

  /* Drag handlers */
  const onPointerDown = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const ele = e.currentTarget;
    const rect = ele.getBoundingClientRect();
    dragRef.current = {
      id, ele,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
    };
    setOranges(prev => prev.map(o => o.id === id ? { ...o, dragging: true } : o));
    if (soundOn) playPop();
    ele.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.id || !d.ele) return;
    const stage = stageRef.current;
    const stageRect = stage.getBoundingClientRect();
    const newX = e.clientX - stageRect.left - d.offX;
    const newY = e.clientY - stageRect.top - d.offY;
    d.ele.style.left = newX + 'px';
    d.ele.style.top = newY + 'px';
    d.ele.style.transform = `scale(1.15) rotate(${Math.round(Math.sin(Date.now() / 80) * 8)}deg)`;
    d.lastX = e.clientX; d.lastY = e.clientY;
  };
  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (!d.id) return;
    const stage = stageRef.current;
    const dropX = d.lastX ?? e.clientX;
    const dropY = d.lastY ?? e.clientY;
    let hitCapy = null;
    stage.querySelectorAll('[data-capy-id]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (dropX >= r.left && dropX <= r.right && dropY >= r.top && dropY <= r.bottom) {
        hitCapy = el.dataset.capyId;
      }
    });
    const droppedId = d.id;
    dragRef.current = { id: null };

    if (hitCapy) {
      if (soundOn) playMunch();
      setOranges(prev => prev.filter(o => o.id !== droppedId));
      const bonus = hitCapy === targetId ? 3 : 1;
      setScore(s => s + bonus);
      setFullIds(ids => [...ids, hitCapy]);
      setTimeout(() => setFullIds(ids => ids.filter(i => i !== hitCapy)), 500);
      const stageRect = stage.getBoundingClientRect();
      const popId = Math.random();
      setPops(p => [...p, {
        id: popId, x: dropX - stageRect.left, y: dropY - stageRect.top,
        text: hitCapy === targetId ? `+${bonus} ★` : `+${bonus}`,
      }]);
      setTimeout(() => setPops(p => p.filter(x => x.id !== popId)), 800);
    } else {
      if (d.ele) d.ele.style.transform = '';
      setOranges(prev => prev.map(o => o.id !== droppedId ? o : { ...o, ...randomOrangePos(), dragging: false }));
    }
  };

  const targetCapy = CAST.find(c => c.id === targetId);

  return (
    <section id="game">
      <div className="section-inner">
        <div className="section-eyebrow">▸▸ Mini Game · มินิเกม</div>
        <h2 className="section-title">Catch the Orange</h2>
        <div className="section-th">ลากส้มจากต้นไม้ ไปป้อนน้องที่หิว</div>

        <div className="game-layout">
          <div className="game-main">
            <div className="game-hud">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <label className="name-input">
                  <span>P1</span>
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="YOUR NAME"
                    maxLength={12}
                    disabled={playing}
                  />
                </label>
                <div className="score-chip">Score · {score}</div>
                <div className="score-chip time">Time · {timeLeft}s</div>
                {playing && targetCapy && (
                  <div className="score-chip heart">
                    Feed {targetCapy.name} ★
                  </div>
                )}
              </div>
              <button className="pxbtn orange" onClick={startGame}>
                {playing ? 'Restart' : (timeLeft === 0 ? 'Play Again' : 'Start Game')}
              </button>
            </div>

            <div
              className="game-stage"
              ref={stageRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: 'none' }}
            >
              <div className="game-tree">
                <div className="tree-leaves" />
                <div className="tree-trunk" />
              </div>

              {oranges.map(o => (
                <div
                  key={o.id}
                  className={`tree-orange ${o.dragging ? 'dragging' : ''}`}
                  style={{ left: o.x, top: o.y, position: 'absolute' }}
                  onPointerDown={(e) => onPointerDown(e, o.id)}
                />
              ))}

              <div className="game-grass" />
              <div className="game-capys">
                {CAST.map(c => (
                  <div
                    key={c.id}
                    data-capy-id={c.id}
                    className={`game-capy ${fullIds.includes(c.id) ? 'full' : ''} ${playing && c.id === targetId ? 'target' : ''}`}
                  >
                    {playing && c.id === targetId && (
                      <div className="want-bubble">
                        <Sprite pattern={ORANGE} palette={ORANGE_PAL} scale={3} />
                      </div>
                    )}
                    <img
                      src={c.src} alt={c.name} draggable={false}
                      style={{
                        width: 96, height: 96, objectFit: 'contain',
                        filter: 'drop-shadow(2px 2px 0 var(--ink))',
                        userSelect: 'none', pointerEvents: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>

              {pops.map(p => (
                <div key={p.id} className="score-pop" style={{ left: p.x, top: p.y }}>
                  {p.text}
                </div>
              ))}

              {!playing && timeLeft === 0 && (
                <div className="game-over">
                  <div className="game-over-card">
                    <div className="font-disp" style={{ fontSize: 28 }}>Wheek wheek!</div>
                    <div className="font-th" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                      น้องอิ่มหมดเลย ขอบใจ ~
                    </div>
                    <div className="font-disp" style={{
                      fontSize: 64, margin: '14px 0 6px', color: 'var(--orange)', lineHeight: 1,
                    }}>
                      {score} PTS
                    </div>
                    {lastRank >= 0 && (
                      <div className="font-disp" style={{ fontSize: 18, color: 'var(--green)' }}>
                        Rank #{lastRank + 1} on the board
                      </div>
                    )}
                    <button className="pxbtn orange" style={{ marginTop: 18 }} onClick={startGame}>
                      Play Again
                    </button>
                  </div>
                </div>
              )}

              {!playing && timeLeft > 0 && (
                <div className="press-start">
                  <div className="font-disp" style={{ fontSize: 22 }}>Press Start</div>
                  <div className="font-th" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                    กดเริ่มเล่นได้เลย
                  </div>
                </div>
              )}
            </div>

            <p style={{ color: 'var(--ink-soft)', marginTop: 12, fontSize: 14 }}>
              ★ The starred capy is extra hungry — drop on them for +3.
            </p>
          </div>

          <Scoreboard
            title="Top Feeders"
            themeColor="var(--orange)"
            entries={board}
            highlightIndex={lastRank}
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
 * Manifesto
 * ========================================================================= */
function Manifesto() {
  return (
    <section id="manifesto" className="manifesto">
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <div className="section-eyebrow" style={{ color: 'var(--brown-d)' }}>♡ The Manifesto · ปรัชญา</div>
        <p className="manifesto-quote">
          Don’t worry,<br />
          be capy.<br />
          <span className="wheek">wheek&nbsp;wheek</span><br />
          all the way.
        </p>
        <div className="manifesto-th">
          ไม่ต้องกังวล อยู่ให้สบาย ๆ เหมือนคาปี้<br />
          แล้วก็ส่งเสียงวี้ก ๆ ตลอดทาง
        </div>
        <div className="badges" style={{ justifyContent: 'center', marginTop: 28 }}>
          <span className="badge">Calm</span>
          <span className="badge g">Confident</span>
          <span className="badge o">Heartwarming</span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
 * Hot Spring — "Onsen Pop" mini-game
 * Bubbles rise from the water. Click them before they reach the top.
 * - small white bubbles: +1
 * - golden bubbles: +3
 * - bath-bomb confetti: +5
 * Bliss meter fills with each pop; drains over time.
 * 40s round. Leaderboard.
 * ========================================================================= */
function Spring({ soundOn }) {
  const ROUND = 40;
  const stageRef = useRefG(null);
  const [playing, setPlaying] = useStateG(false);
  const [timeLeft, setTimeLeft] = useStateG(ROUND);
  const [score, setScore] = useStateG(0);
  const [combo, setCombo] = useStateG(0);
  const [bliss, setBliss] = useStateG(0); // 0..100
  const [bubbles, setBubbles] = useStateG([]); // {id, kind, x, y, vy, ts}
  const [pops, setPops] = useStateG([]);
  const [playerName, setPlayerName] = useStateG(() => localStorage.getItem('capy-name') || '');
  const [board, setBoard] = useStateG(() => readBoard('capy-board-onsen'));
  const [lastRank, setLastRank] = useStateG(-1);
  const nextId = useRefG(1);
  const lastClickAt = useRefG(0);

  useEffectG(() => { localStorage.setItem('capy-name', playerName); }, [playerName]);

  // Spawn bubbles
  useEffectG(() => {
    if (!playing) return;
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      setBubbles(prev => {
        if (prev.length > 14) return prev;
        const r = Math.random();
        const kind = r < 0.7 ? 'small' : r < 0.92 ? 'gold' : 'bomb';
        const stage = stageRef.current;
        const w = stage?.clientWidth || 600;
        return [...prev, {
          id: nextId.current++,
          kind,
          x: 30 + Math.random() * (w - 60),
          y: stage?.clientHeight || 360,  // starts at bottom
          vy: kind === 'bomb' ? 1.0 : kind === 'gold' ? 1.4 : 1.8,
          drift: (Math.random() - 0.5) * 0.6,
          born: Date.now(),
        }];
      });
    };
    const i = setInterval(spawn, 380);
    return () => { cancelled = true; clearInterval(i); };
  }, [playing]);

  // Animate bubbles
  useEffectG(() => {
    if (!playing) return;
    let raf;
    const tick = () => {
      setBubbles(prev => prev
        .map(b => ({ ...b, y: b.y - b.vy * 1.6, x: b.x + b.drift }))
        .filter(b => b.y > -40)
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Timer
  useEffectG(() => {
    if (!playing) return;
    if (timeLeft <= 0) {
      setPlaying(false);
      const newBoard = addToBoard('capy-board-onsen', playerName, score);
      setBoard(newBoard);
      const idx = newBoard.findIndex(e =>
        e.score === score &&
        e.name.toUpperCase() === ((playerName || 'CAPY FAN').toUpperCase().slice(0,12))
      );
      setLastRank(idx);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, timeLeft]); // eslint-disable-line

  // Bliss drains slowly
  useEffectG(() => {
    if (!playing) return;
    const i = setInterval(() => setBliss(b => Math.max(0, b - 1.2)), 200);
    return () => clearInterval(i);
  }, [playing]);

  // Combo decays
  useEffectG(() => {
    if (!playing) return;
    const i = setInterval(() => {
      if (Date.now() - lastClickAt.current > 1300) setCombo(0);
    }, 300);
    return () => clearInterval(i);
  }, [playing]);

  const start = () => {
    setScore(0); setBliss(0); setCombo(0); setTimeLeft(ROUND);
    setBubbles([]); setLastRank(-1);
    nextId.current = 1;
    setPlaying(true);
  };

  const pop = (b, e) => {
    if (!playing) return;
    e?.stopPropagation();
    if (soundOn) playPop();
    const points = b.kind === 'bomb' ? 5 : b.kind === 'gold' ? 3 : 1;
    const newCombo = combo + 1;
    setCombo(newCombo);
    lastClickAt.current = Date.now();
    const multiplier = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : 1;
    const total = points * multiplier;
    setScore(s => s + total);
    setBliss(v => Math.min(100, v + (b.kind === 'bomb' ? 18 : b.kind === 'gold' ? 9 : 4)));
    setBubbles(prev => prev.filter(x => x.id !== b.id));
    const popId = Math.random();
    setPops(p => [...p, {
      id: popId,
      x: b.x, y: b.y,
      text: multiplier > 1 ? `+${total} x${multiplier}` : `+${total}`,
      kind: b.kind,
    }]);
    setTimeout(() => setPops(p => p.filter(x => x.id !== popId)), 750);
  };

  // Capy expressions based on bliss
  const blissLevel =
    bliss >= 90 ? 'ecstatic' :
    bliss >= 60 ? 'happy' :
    bliss >= 30 ? 'content' : 'idle';

  return (
    <section id="spring" className="spring">
      <div className="section-inner">
        <div className="section-eyebrow">♨ Hot Spring · ออนเซ็น</div>
        <h2 className="section-title">Onsen Pop</h2>
        <div className="section-th">ตบฟองสบู่ ปลุกความผ่อนคลายให้น้อง ๆ</div>

        <div className="game-layout">
          <div className="game-main">
            <div className="game-hud">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <label className="name-input">
                  <span>P1</span>
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="YOUR NAME"
                    maxLength={12}
                    disabled={playing}
                  />
                </label>
                <div className="score-chip">Score · {score}</div>
                <div className="score-chip time">Time · {timeLeft}s</div>
                {combo >= 2 && (
                  <div className="score-chip heart" style={{ background: 'var(--green)' }}>
                    Combo x{combo}
                  </div>
                )}
              </div>
              <button className="pxbtn orange" onClick={start}>
                {playing ? 'Restart' : (timeLeft === 0 ? 'Play Again' : 'Start Game')}
              </button>
            </div>

            {/* Bliss meter */}
            <div className="bliss-bar">
              <div className="bliss-bar-label">Capy Bliss</div>
              <div className="bliss-bar-track">
                <div className="bliss-bar-fill" style={{ width: bliss + '%' }}>
                  <span className="bliss-bar-percent">{Math.round(bliss)}%</span>
                </div>
              </div>
            </div>

            <div
              className="onsen-stage"
              ref={stageRef}
              style={{ touchAction: 'manipulation' }}
            >
              {/* steam tile background */}
              <div className="onsen-steam-bg" />

              {/* capys in onsen */}
              <div className="onsen-capys">
                {CAST.map((c, i) => (
                  <div key={c.id} className={`onsen-capy ${blissLevel}`} style={{
                    animationDelay: `${i * 0.4}s`,
                  }}>
                    <img
                      src={c.src} alt={c.name} draggable={false}
                      style={{
                        width: 110, height: 110, objectFit: 'contain',
                        filter: 'drop-shadow(2px 2px 0 var(--ink))',
                        userSelect: 'none', pointerEvents: 'none',
                        maskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 92%)',
                        WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 92%)',
                      }}
                    />
                    {bliss >= 60 && (
                      <div className="onsen-hearts">{bliss >= 90 ? '✦' : '♡'}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* water surface line */}
              <div className="onsen-waterline" />

              {/* bubbles */}
              {bubbles.map(b => (
                <button
                  key={b.id}
                  className={`bubble-target ${b.kind}`}
                  style={{ left: b.x, top: b.y }}
                  onClick={(e) => pop(b, e)}
                  aria-label="pop"
                >
                  {b.kind === 'bomb' ? '✺' : b.kind === 'gold' ? '★' : ''}
                </button>
              ))}

              {pops.map(p => (
                <div key={p.id} className={`onsen-pop ${p.kind}`} style={{ left: p.x, top: p.y }}>
                  {p.text}
                </div>
              ))}

              {/* overlays */}
              {!playing && timeLeft === 0 && (
                <div className="game-over">
                  <div className="game-over-card">
                    <div className="font-disp" style={{ fontSize: 28 }}>Maximum Bliss</div>
                    <div className="font-th" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                      น้อง ๆ ผ่อนคลายสุด ๆ ขอบใจ ~
                    </div>
                    <div className="font-disp" style={{
                      fontSize: 64, margin: '14px 0 6px', color: 'var(--orange)', lineHeight: 1,
                    }}>
                      {score} PTS
                    </div>
                    {lastRank >= 0 && (
                      <div className="font-disp" style={{ fontSize: 18, color: 'var(--green)' }}>
                        Rank #{lastRank + 1} on the board
                      </div>
                    )}
                    <button className="pxbtn orange" style={{ marginTop: 18 }} onClick={start}>
                      Soak Again
                    </button>
                  </div>
                </div>
              )}
              {!playing && timeLeft > 0 && (
                <div className="press-start">
                  <div className="font-disp" style={{ fontSize: 22 }}>Tap Bubbles to Relax</div>
                  <div className="font-th" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                    กดฟอง — ★ ทอง +3 · ✺ บอมบ์ +5
                  </div>
                </div>
              )}
            </div>

            <p style={{ color: 'var(--ink-soft)', marginTop: 12, fontSize: 14 }}>
              Combos give x2 / x3 multipliers. Keep the bliss meter above 60% to make the capys melt with joy.
            </p>
          </div>

          <Scoreboard
            title="Bliss Champions"
            themeColor="var(--green)"
            entries={board}
            highlightIndex={lastRank}
          />
        </div>
      </div>
    </section>
  );
}

function FooterBar() {
  return (
    <footer>
      <div>Capybarand © 2020–2027 · ♡ from Bangkok</div>
      <div className="footer-th">คาปี้ขอขอบคุณที่แวะมา&nbsp;~ แล้วเจอกันใหม่นะ</div>
    </footer>
  );
}

Object.assign(window, { Game, Manifesto, Spring, FooterBar });
