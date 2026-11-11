import React from 'react';
import { Check, Circle } from 'lucide-react';
import { AGENTS } from './data.js';

const DEV = { publish: 2 };            // sub-step index that is still in development
const asOf = '8 Nov 2026';

/** What each agent produced, taken from the saved campaign. */
function outputs(c) {
  const a = c.agents || {};
  const trendName = a.trend?.name || (typeof c.trend === 'string' ? c.trend : c.trend?.name);
  const tr = [trendName, a.trend?.why, a.trend?.caution ? `Avoid: ${a.trend.caution}` : null];
  const st = [a.strategy?.audience, a.strategy?.angle, a.strategy?.trustMoves?.length ? `${a.strategy.trustMoves.length} ways to build trust: ${a.strategy.trustMoves.join(' · ')}` : null];
  const ct = [c.title, a.content?.hook ? `Hook: ${a.content.hook}` : null, `${(c.script || []).length} scenes`];
  const vs = [a.visual?.theme, a.visual?.format, a.visual?.shots?.length ? `Shots: ${a.visual.shots.join(' → ')}` : null];
  return { trend: tr, strategy: st, content: ct, visual: vs };
}

export default function AgentTrail({ campaign: c }) {
  const out = outputs(c);
  const approved = c.status !== 'Pending';
  const scheduled = c.status === 'Scheduled';
  const timing = id => (c.pipeline || []).find(p => p.agent === id);
  const state = id => id === 'gate' ? (approved ? 'Done' : 'Waiting for the owner') : id === 'publish' ? (scheduled ? 'Scheduled' : approved ? 'Ready to schedule' : 'Starts after approval') : 'Done';
  const doneAt = (id, i) => {
    if (id === 'gate') return approved;
    if (id === 'publish') return i === 0 ? approved : i === 1 ? scheduled : false;
    if (id === 'visual') return i < 2 || Boolean(c.video);
    return true;
  };
  return (
    <section className="card trail" aria-labelledby="trail-title">
      <h3 id="trail-title">How the agents built this campaign</h3>
      <p className="muted trail-sub">Each agent worked from the output of the one before it. The owner decides before anything is published.</p>
      <ol className="trail-list">
        {AGENTS.map((agent, idx) => {
          const tm = timing(agent.id);
          const st = state(agent.id);
          const finished = st === 'Done' || st === 'Scheduled';
          return (
            <li key={agent.id} className={`trail-agent ${finished ? 'is-done' : 'is-open'}`}>
              <span className="trail-dot" aria-hidden="true">{finished ? <Check size={14} /> : idx + 1}</span>
              <div className="trail-body">
                <div className="trail-head">
                  <b>{agent.name}</b>
                  <span className="pill trail-kind">{agent.kind}</span>
                  <span className="trail-state">{st}{tm && tm.ms > 0 ? ` · ${tm.ms} ms` : ''}</span>
                </div>
                <ul className="trail-steps">
                  {agent.steps.map((s, i) => (
                    <li key={s} className={doneAt(agent.id, i) ? 'is-done' : ''}>
                      {doneAt(agent.id, i) ? <Check size={14} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
                      <span>{s.replace('the dated list', `the dated list (${asOf})`)}{DEV[agent.id] === i && !doneAt(agent.id, i) ? <em> · in development</em> : null}</span>
                    </li>
                  ))}
                </ul>
                {out[agent.id] && out[agent.id].some(Boolean) && (
                  <div className="trail-out">
                    <span className="trail-out-label">PRODUCED</span>
                    {out[agent.id].filter(Boolean).map((line, i) => <p key={i} className={i === 0 ? 'trail-out-main' : 'muted'}>{line}</p>)}
                  </div>
                )}
                {agent.id === 'visual' && c.video && (
                  <div className="trail-out">
                    <span className="trail-out-label">RESULT</span>
                    <p className="trail-out-main">{c.video.note} See the video above.</p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
