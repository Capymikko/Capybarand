/* global React, Sprite, CAST, ORANGE, ORANGE_PAL, playMunch, playPop, playWheek */
const { useState: useStateG, useEffect: useEffectG, useRef: useRefG, useCallback: useCallbackG } = React;

/* =========================================================================
 * Leaderboard persistence (shared between mini-games)
 * ========================================================================= */
function readBoard(key) {
  try {return JSON.parse(localStorage.getItem(key) || '[]');}
  catch {return [];}
}
function writeBoard(key, list) {
  try {localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));} catch {}
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
        {rows.map((r, i) =>
        <li key={i} className={i === highlightIndex ? 'me' : ''}>
            <span className="rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="who">{r ? r.name : '— — — — —'}</span>
            <span className="pts">{r ? r.score : '· · ·'}</span>
          </li>
        )}
      </ol>
    </div>);

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

  const randomOrangePos = () => {
    const stageW = stageRef.current?.clientWidth || 760;
    const zone = Math.floor(Math.random() * 3); // 0=left 1=center 2=right
    const cx = zone === 0 ? 114 : zone === 1 ? stageW / 2 : stageW - 114;
    return {
      x: cx - 70 + Math.random() * 110,
      y: 30 + Math.random() * 100,
    };
  };

  useEffectG(() => {localStorage.setItem('capy-name', playerName);}, [playerName]);

  // Spawn oranges while playing
  useEffectG(() => {
    if (!playing) return;
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      setOranges((prev) => {
        if (prev.length >= 5) return prev;
        const id = nextIdRef.current++;
        return [...prev, { id, ...randomOrangePos(), dragging: false }];
      });
    };
    spawn();
    const i = setInterval(spawn, 1200);
    return () => {cancelled = true;clearInterval(i);};
  }, [playing]);

  // Idle decoration: a few oranges already on tree
  useEffectG(() => {
    if (oranges.length === 0 && !playing) {
      setOranges([
      { id: 'seed1', ...randomOrangePos(), dragging: false },
      { id: 'seed2', ...randomOrangePos(), dragging: false },
      { id: 'seed3', ...randomOrangePos(), dragging: false }]
      );
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
      const idx = newBoard.findIndex((e) => e.score === score && e.name.toUpperCase() === (playerName || 'CAPY FAN').toUpperCase().slice(0, 12));
      setLastRank(idx);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, timeLeft]); // eslint-disable-line

  // Rotate target capy
  useEffectG(() => {
    if (!playing) return;
    const ids = CAST.map((c) => c.id);
    const i = setInterval(() => {
      setTargetId((prev) => {
        const others = ids.filter((x) => x !== prev);
        return others[Math.floor(Math.random() * others.length)];
      });
    }, 3500);
    return () => clearInterval(i);
  }, [playing]);

  const startGame = () => {
    setScore(0);setTimeLeft(45);setPlaying(true);setOranges([]);
    setLastRank(-1);
    nextIdRef.current = 1;
  };

  /* Drag handlers */
  const onPointerDown = (e, id) => {
    e.preventDefault();e.stopPropagation();
    const ele = e.currentTarget;
    const rect = ele.getBoundingClientRect();
    dragRef.current = {
      id, ele,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top
    };
    setOranges((prev) => prev.map((o) => o.id === id ? { ...o, dragging: true } : o));
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
    d.lastX = e.clientX;d.lastY = e.clientY;
  };
  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (!d.id) return;
    const stage = stageRef.current;
    const dropX = d.lastX ?? e.clientX;
    const dropY = d.lastY ?? e.clientY;
    let hitCapy = null;
    stage.querySelectorAll('[data-capy-id]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (dropX >= r.left && dropX <= r.right && dropY >= r.top && dropY <= r.bottom) {
        hitCapy = el.dataset.capyId;
      }
    });
    const droppedId = d.id;
    dragRef.current = { id: null };

    if (hitCapy) {
      if (soundOn) playMunch();
      setOranges((prev) => prev.filter((o) => o.id !== droppedId));
      const bonus = hitCapy === targetId ? 3 : 1;
      setScore((s) => s + bonus);
      setFullIds((ids) => [...ids, hitCapy]);
      setTimeout(() => setFullIds((ids) => ids.filter((i) => i !== hitCapy)), 500);
      const stageRect = stage.getBoundingClientRect();
      const popId = Math.random();
      setPops((p) => [...p, {
        id: popId, x: dropX - stageRect.left, y: dropY - stageRect.top,
        text: hitCapy === targetId ? `+${bonus} ★` : `+${bonus}`
      }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== popId)), 800);
    } else {
      if (d.ele) d.ele.style.transform = '';
      setOranges((prev) => prev.map((o) => o.id !== droppedId ? o : { ...o, ...randomOrangePos(), dragging: false }));
    }
  };

  const targetCapy = CAST.find((c) => c.id === targetId);

  return (
    <section id="game">
      <div className="section-inner">
        <div className="section-eyebrow">▸▸ Mini Game · <span style={{ fontFamily: '"IBM Plex Sans Thai"', fontWeight: 700 }}>มินิเกม</span></div>
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
                    disabled={playing} />
                  
                </label>
                <div className="score-chip">Score · {score}</div>
                <div className="score-chip time">Time · {timeLeft}s</div>
                {playing && targetCapy &&
                <div className="score-chip heart">
                    Feed {targetCapy.name} ★
                  </div>
                }
              </div>
              <button className="pxbtn orange" onClick={startGame}>
                {playing ? 'Restart' : timeLeft === 0 ? 'Play Again' : 'Start Game'}
              </button>
            </div>

            <div
              className="game-stage"
              ref={stageRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: 'none' }}>
              
              {['left', 'center', 'right'].map((pos) => (
                <div key={pos} className={`game-tree game-tree-${pos}`}>
                  <div className="tree-leaves" />
                  <div className="tree-trunk" />
                </div>
              ))}

              {oranges.map((o) =>
              <div
                key={o.id}
                className={`tree-orange ${o.dragging ? 'dragging' : ''}`}
                style={{ left: o.x, top: o.y, position: 'absolute' }}
                onPointerDown={(e) => onPointerDown(e, o.id)} />

              )}

              <div className="game-grass" />
              <div className="game-capys">
                {CAST.map((c) =>
                <div
                  key={c.id}
                  data-capy-id={c.id}
                  className={`game-capy ${fullIds.includes(c.id) ? 'full' : ''} ${playing && c.id === targetId ? 'target' : ''}`}>
                  
                    {playing && c.id === targetId &&
                  <div className="want-bubble">
                        <Sprite pattern={ORANGE} palette={ORANGE_PAL} scale={3} />
                      </div>
                  }
                    <img
                    src={c.gameSrc || c.src} alt={c.name} draggable={false}
                    style={{
                      width: 96, height: 96, objectFit: 'contain',
                      userSelect: 'none', pointerEvents: 'none'
                    }} />
                  
                  </div>
                )}
              </div>

              {pops.map((p) =>
              <div key={p.id} className="score-pop" style={{ left: p.x, top: p.y }}>
                  {p.text}
                </div>
              )}

              {!playing && timeLeft === 0 &&
              <div className="game-over">
                  <div className="game-over-card">
                    <div className="font-disp" style={{ fontSize: 28 }}>Wheek wheek!</div>
                    <div className="font-th" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                      น้องอิ่มหมดเลย ขอบใจ ~
                    </div>
                    <div className="font-disp" style={{
                    fontSize: 64, margin: '14px 0 6px', color: 'var(--orange)', lineHeight: 1
                  }}>
                      {score} PTS
                    </div>
                    {lastRank >= 0 &&
                  <div className="font-disp" style={{ fontSize: 18, color: 'var(--green)' }}>
                        Rank #{lastRank + 1} on the board
                      </div>
                  }
                    <button className="pxbtn orange" style={{ marginTop: 18 }} onClick={startGame}>
                      Play Again
                    </button>
                  </div>
                </div>
              }

              {!playing && timeLeft > 0 &&
              <div className="press-start">
                  <div className="font-disp" style={{ fontSize: 22 }}>Press Start</div>
                  <div className="font-th" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                    กดเริ่มเล่นได้เลย
                  </div>
                </div>
              }
            </div>

            <p style={{ color: 'var(--ink-soft)', marginTop: 12, fontSize: 14 }}>
              ★ The starred capy is extra hungry — drop on them for +3.
            </p>
          </div>

          <Scoreboard
            title="Top Feeders"
            themeColor="var(--orange)"
            entries={board}
            highlightIndex={lastRank} />
          
        </div>
      </div>
    </section>);

}

/* =========================================================================
 * Brand Wheel — Spokes (interactive wheel-of-fortune)
 * ========================================================================= */
function BrandWheel() {
  const [selected, setSelected] = useStateG(0);
  const [rotation, setRotation] = useStateG(0);
  const [spinning, setSpinning] = useStateG(false);

  const spokes = [
    { n: '01', color: '#FFD261', text: '#1A0F08', l1: 'STAY', l2: 'EASY',
      title: 'Stay Easy',          tag: 'stress is not on the group chat',
      th: 'ใจเย็นไว้ ไม่ต้องรีบ',                            pitch: 660 },
    { n: '02', color: '#F28522', text: '#FFFCEE', l1: 'SPREAD', l2: 'POSITIVITY',
      title: 'Spread Positivity',  tag: 'serotonin dealer, no prescription needed',
      th: 'แจกพลังบวก ไม่ต้องมีใบสั่งยา',                     pitch: 880 },
    { n: '03', color: '#267F55', text: '#FFFCEE', l1: 'BE KIND', l2: 'TO ALL',
      title: 'Kind to All Things', tag: 'yes, even that one coworker',
      th: 'ใจดีกับทุกสรรพสิ่ง รวมถึงเพื่อนร่วมงานคนนั้น',         pitch: 990 },
    { n: '04', color: '#BA7A35', text: '#FFFCEE', l1: 'MINDFUL', l2: 'LIVING',
      title: 'Mindful Living',     tag: 'touch grass, but make it aesthetic',
      th: 'อยู่กับปัจจุบัน แบบมีสไตล์',                          pitch: 1180 },
  ];

  // Build the four 90° pie slices, segment 0 centered at top
  const R = 180, CX = 200, CY = 200;
  const segPath = (i) => {
    const sa = (i * 90 - 45 - 90) * Math.PI / 180;
    const ea = (i * 90 + 45 - 90) * Math.PI / 180;
    const x1 = CX + R * Math.cos(sa), y1 = CY + R * Math.sin(sa);
    const x2 = CX + R * Math.cos(ea), y2 = CY + R * Math.sin(ea);
    return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
  };

  const select = (i) => {
    if (spinning) return;
    setSelected(i);
    const base = Math.round(rotation / 360) * 360;
    const target = base + (-i * 90) + 360 * 2;
    setSpinning(true);
    setRotation(target);
    if (window.playWheek) window.playWheek({ pitch: spokes[i].pitch, duration: 0.22, sweep: 1.4 });
    setTimeout(() => setSpinning(false), 1200);
  };

  const spinRandom = () => {
    if (spinning) return;
    const i = Math.floor(Math.random() * 4);
    const base = Math.round(rotation / 360) * 360;
    const turns = 4 + Math.floor(Math.random() * 3);
    const target = base + (-i * 90) + 360 * turns;
    setSelected(i);
    setSpinning(true);
    setRotation(target);
    if (window.playWheek) window.playWheek({ pitch: 480, duration: 0.6, sweep: 2.6 });
    setTimeout(() => {
      setSpinning(false);
      if (window.playWheek) window.playWheek({ pitch: spokes[i].pitch, duration: 0.28, sweep: 1.6 });
      if (window.playPop) window.playPop();
    }, 1800);
  };

  const active = spokes[selected];

  return (
    <section id="wheel" className="wheel">
      <div className="section-inner">
        <div className="section-eyebrow" style={{ textAlign: 'center' }}>◎ Brand Wheel · <span style={{ fontFamily: '"IBM Plex Sans Thai"', fontWeight: 700 }}>กงล้อแบรนด์</span></div>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Four spokes,<br />one capy.</h2>
        <div className="section-th" style={{ textAlign: 'center', fontFamily: '"IBM Plex Sans Thai"' }}>
          คลิกที่ซี่ล้อ — หรือกด SPIN ที่ดุมตรงกลางเพื่อให้คาปี้สุ่มให้
        </div>

        <div className="wheel-stage">
          <div className="wheel-pointer" aria-hidden="true">
            <svg width="44" height="56" viewBox="0 0 44 56">
              <path d="M 4 0 L 40 0 L 22 48 Z" fill="#1A0F08" stroke="#1A0F08" strokeWidth="4" strokeLinejoin="round"/>
              <path d="M 9 5 L 35 5 L 22 40 Z" fill="#F28522"/>
            </svg>
          </div>

          <svg
            className={`wheel-svg ${spinning ? 'is-spinning' : ''}`}
            viewBox="0 0 400 400"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Outer ring */}
            <circle cx="200" cy="200" r="188" fill="#1A0F08" />
            {/* Segments */}
            {spokes.map((s, i) => (
              <g
                key={i}
                className={`wheel-seg ${selected === i ? 'active' : ''}`}
                onClick={() => select(i)}
              >
                <path d={segPath(i)} fill={s.color} stroke="#1A0F08" strokeWidth="5" strokeLinejoin="round" />
                <g transform={`rotate(${i * 90} 200 200)`} style={{ pointerEvents: 'none' }}>
                  <text x="200" y="56"
                    textAnchor="middle"
                    fontFamily="Nunito, sans-serif"
                    fontWeight="900"
                    fontSize="12"
                    letterSpacing="3"
                    fill={s.text}
                    opacity="0.6">{s.n} · 04</text>
                  <text x="200" y="90"
                    textAnchor="middle"
                    fontFamily="Nunito, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    letterSpacing="0.5"
                    fill={s.text}>{s.l1}</text>
                  <text x="200" y="117"
                    textAnchor="middle"
                    fontFamily="Nunito, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    letterSpacing="0.5"
                    fill={s.text}>{s.l2}</text>
                </g>
              </g>
            ))}
            {/* Inner ring border */}
            <circle cx="200" cy="200" r="62" fill="#FFFCEE" stroke="#1A0F08" strokeWidth="5" />
            {/* Bolts on each spoke divider for that wheel-of-fortune feel */}
            {[0, 90, 180, 270].map((deg) => {
              const a = (deg - 90 + 45) * Math.PI / 180;
              return (
                <circle key={deg}
                  cx={200 + 175 * Math.cos(a)}
                  cy={200 + 175 * Math.sin(a)}
                  r="7" fill="#1A0F08" />
              );
            })}
          </svg>

          <button
            className="wheel-spin-btn"
            onClick={spinRandom}
            disabled={spinning}
            aria-label="Spin the wheel">
            <img src="assets/CapyCoin.png" alt="" draggable={false} />
            <span className="spin-label">{spinning ? 'SPINNING…' : 'SPIN!'}</span>
          </button>
        </div>

        <div className="wheel-panel" style={{ '--accent': active.color, borderColor: '#1A0F08' }}>
          <div className="wheel-panel-num">SPOKE {active.n} / 04</div>
          <h3 className="wheel-panel-title">{active.title}</h3>
          <div className="wheel-panel-tag">“{active.tag}”</div>
          <div className="wheel-panel-th">{active.th}</div>
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
        <div className="section-eyebrow" style={{ color: 'var(--brown-d)' }}>♡ The Manifesto · <span style={{ fontFamily: '"IBM Plex Sans Thai"', fontWeight: 700 }}>ปรัชญา</span></div>
        <p className="manifesto-quote">
          Don’t worry,<br />
          be capy.<br />
          <span className="wheek">wheek&nbsp;wheek</span><br />
          all the way.
        </p>
        <div className="manifesto-th">
          ไม่ต้องกังวล อยู่ให้สบายๆ เหมือนคาปี้<br />
          แล้วก็ส่งเสียงวี้กๆ ตลอดทาง
        </div>
      </div>
    </section>);

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

  useEffectG(() => {localStorage.setItem('capy-name', playerName);}, [playerName]);

  // Spawn bubbles
  useEffectG(() => {
    if (!playing) return;
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      setBubbles((prev) => {
        if (prev.length > 14) return prev;
        const r = Math.random();
        const kind = r < 0.7 ? 'small' : r < 0.92 ? 'gold' : 'bomb';
        const stage = stageRef.current;
        const w = stage?.clientWidth || 600;
        return [...prev, {
          id: nextId.current++,
          kind,
          x: 30 + Math.random() * (w - 60),
          y: stage?.clientHeight || 360, // starts at bottom
          vy: kind === 'bomb' ? 1.0 : kind === 'gold' ? 1.4 : 1.8,
          drift: (Math.random() - 0.5) * 0.6,
          born: Date.now()
        }];
      });
    };
    const i = setInterval(spawn, 380);
    return () => {cancelled = true;clearInterval(i);};
  }, [playing]);

  // Animate bubbles
  useEffectG(() => {
    if (!playing) return;
    let raf;
    const tick = () => {
      setBubbles((prev) => prev.
      map((b) => ({ ...b, y: b.y - b.vy * 1.6, x: b.x + b.drift })).
      filter((b) => b.y > -40)
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
      const idx = newBoard.findIndex((e) =>
      e.score === score &&
      e.name.toUpperCase() === (playerName || 'CAPY FAN').toUpperCase().slice(0, 12)
      );
      setLastRank(idx);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, timeLeft]); // eslint-disable-line

  // Bliss drains slowly
  useEffectG(() => {
    if (!playing) return;
    const i = setInterval(() => setBliss((b) => Math.max(0, b - 1.2)), 200);
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
    setScore(0);setBliss(0);setCombo(0);setTimeLeft(ROUND);
    setBubbles([]);setLastRank(-1);
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
    setScore((s) => s + total);
    setBliss((v) => Math.min(100, v + (b.kind === 'bomb' ? 18 : b.kind === 'gold' ? 9 : 4)));
    setBubbles((prev) => prev.filter((x) => x.id !== b.id));
    const popId = Math.random();
    setPops((p) => [...p, {
      id: popId,
      x: b.x, y: b.y,
      text: multiplier > 1 ? `+${total} x${multiplier}` : `+${total}`,
      kind: b.kind
    }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== popId)), 750);
  };

  // Capy expressions based on bliss
  const blissLevel =
  bliss >= 90 ? 'ecstatic' :
  bliss >= 60 ? 'happy' :
  bliss >= 30 ? 'content' : 'idle';

  return (
    <section id="spring" className="spring">
      <div className="section-inner">
        <div className="section-eyebrow">♨ Hot Spring · <span style={{ fontFamily: '"IBM Plex Sans Thai"', fontWeight: 700 }}>ออนเซ็น</span></div>
        <h2 className="section-title">Onsen Pop</h2>
        <div className="section-th">ตบฟองสบู่ ปลุกความผ่อนคลายให้น้องๆ</div>

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
                    disabled={playing} />
                  
                </label>
                <div className="score-chip">Score · {score}</div>
                <div className="score-chip time">Time · {timeLeft}s</div>
                {combo >= 2 &&
                <div className="score-chip heart" style={{ background: 'var(--green)' }}>
                    Combo x{combo}
                  </div>
                }
              </div>
              <button className="pxbtn orange" onClick={start}>
                {playing ? 'Restart' : timeLeft === 0 ? 'Play Again' : 'Start Game'}
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
              style={{ touchAction: 'manipulation' }}>
              
              {/* steam tile background */}
              <div className="onsen-steam-bg" />

              {/* capys in onsen */}
              <div className="onsen-capys">
                {CAST.map((c, i) =>
                <div key={c.id} className={`onsen-capy ${blissLevel}`} style={{
                  animationDelay: `${i * 0.4}s`
                }}>
                    <img
                    src={c.gameSrc || c.src} alt={c.name} draggable={false}
                    style={{
                      width: 110, height: 110, objectFit: 'contain',
                      filter: 'drop-shadow(2px 2px 0 var(--ink))',
                      userSelect: 'none', pointerEvents: 'none',
                      maskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 92%)',
                      WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 62%, transparent 92%)'
                    }} />
                  
                    {bliss >= 60 &&
                  <div className="onsen-hearts">{bliss >= 90 ? '✦' : '♡'}</div>
                  }
                  </div>
                )}
              </div>

              {/* water surface line */}
              <div className="onsen-waterline" />

              {/* bubbles */}
              {bubbles.map((b) =>
              <button
                key={b.id}
                className={`bubble-target ${b.kind}`}
                style={{ left: b.x, top: b.y }}
                onClick={(e) => pop(b, e)}
                aria-label="pop">
                
                  {b.kind === 'bomb' ? '✺' : b.kind === 'gold' ? '★' : ''}
                </button>
              )}

              {pops.map((p) =>
              <div key={p.id} className={`onsen-pop ${p.kind}`} style={{ left: p.x, top: p.y }}>
                  {p.text}
                </div>
              )}

              {/* overlays */}
              {!playing && timeLeft === 0 &&
              <div className="game-over">
                  <div className="game-over-card">
                    <div className="font-disp" style={{ fontSize: 28 }}>Maximum Bliss</div>
                    <div className="font-th" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>น้องๆ ผ่อนคลายสุดๆ ขอบใจ ~

                  </div>
                    <div className="font-disp" style={{
                    fontSize: 64, margin: '14px 0 6px', color: 'var(--orange)', lineHeight: 1
                  }}>
                      {score} PTS
                    </div>
                    {lastRank >= 0 &&
                  <div className="font-disp" style={{ fontSize: 18, color: 'var(--green)' }}>
                        Rank #{lastRank + 1} on the board
                      </div>
                  }
                    <button className="pxbtn orange" style={{ marginTop: 18 }} onClick={start}>
                      Soak Again
                    </button>
                  </div>
                </div>
              }
              {!playing && timeLeft > 0 &&
              <div className="press-start">
                  <div className="font-disp" style={{ fontSize: 22 }}>Tap Bubbles to Relax</div>
                  <div className="font-th" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                    กดฟอง — ★ ทอง +3 · ✺ บอมบ์ +5
                  </div>
                </div>
              }
            </div>

            <p style={{ color: 'var(--ink-soft)', marginTop: 12, fontSize: 14 }}>
              Combos give x2 / x3 multipliers. Keep the bliss meter above 60% to make the capys melt with joy.
            </p>
          </div>

          <Scoreboard
            title="Bliss Champions"
            themeColor="var(--green)"
            entries={board}
            highlightIndex={lastRank} />
          
        </div>
      </div>
    </section>);

}

function FooterBar() {
  return (
    <footer>
      <div>Capybarand © 2020–2026 · ♡ from Bangkok</div>
      <div className="footer-th">คาปี้ขอขอบคุณที่แวะมา&nbsp;~ แล้วเจอกันใหม่นะ</div>
    </footer>);

}

Object.assign(window, { Game, Manifesto, BrandWheel, Spring, FooterBar });