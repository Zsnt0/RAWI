import React, { useEffect, useRef, useState } from 'react';
import { AGENTS } from './data';

// Node positions on a 1100 x 440 route. Odd stops sit low, even stops sit high.
const POINTS = [[110, 330], [280, 150], [450, 330], [620, 150], [790, 330], [960, 150]];
const ROUTE = 'M30 330 L110 330 C195 330 195 150 280 150 C365 150 365 330 450 330 C535 330 535 150 620 150 C705 150 705 330 790 330 C875 330 875 150 960 150 L1070 150';

export default function AgentMap() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`agent-map ${seen ? 'is-seen' : ''}`} ref={ref} dir="ltr" lang="en">
      <svg className="map-svg" viewBox="0 0 1100 440" preserveAspectRatio="none" aria-hidden="true">
        <path d={ROUTE} className="map-track" />
        <path d={ROUTE} className="map-progress" pathLength="1" />
      </svg>
      <span className="map-end map-start" style={{ '--x': 3, '--y': 75 }}>START<br />ONE BRIEF</span>
      <span className="map-end map-finish" style={{ '--x': 97, '--y': 34 }}>FINISH<br />CAMPAIGN READY</span>
      <ol className="map-stops">
        {AGENTS.map((a, i) => {
          const [x, y] = POINTS[i];
          const high = y < 200;
          return (
            <li key={a.id} className={`map-stop ${high ? 'is-high' : 'is-low'}`} style={{ '--x': (x / 1100) * 100, '--y': (y / 440) * 100, '--i': i }}>
              <span className="map-node">{String(i + 1).padStart(2, '0')}</span>
              <div className="map-label"><h3>{a.name}</h3><p>{a.job}</p></div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
