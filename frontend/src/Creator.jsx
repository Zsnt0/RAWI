import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Save, Sparkles } from 'lucide-react';
import AgentTrail from './AgentTrail';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const FALLBACK_TRENDS = [{ id: 'winter-mornings', name: { en: 'Winter mornings' } }];
const RUN = [
  ['trend', 'Trend Intelligence', 'Choosing a trend from the dated list'],
  ['strategy', 'Campaign Strategy', 'Defining the audience, angle and trust moves'],
  ['content', 'Content Writing', 'Writing the hook, scenes, caption and plan'],
  ['visual', 'Visual Production', 'Preparing the look and the shot list'],
];
const PACE = { trend: 700, strategy: 900, content: 1000, visual: 2200 };

function Field({ label, children }) {
  return <label className="block"><span className="text-sm font-bold block mb-2">{label}</span>{children}</label>;
}

async function post(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(Array.isArray(d.detail) ? 'Check the required fields and description length.' : d.detail || 'Generation failed. Try again.');
  }
  return res.json();
}

export default function Creator({ add, notify }) {
  const [form, setForm] = useState({ brand: '', product: '', audience: '', platform: 'TikTok', trend: 'winter-mornings', goal: 'Brand awareness', description: '' });
  const [trends, setTrends] = useState(FALLBACK_TRENDS);
  const [asOf, setAsOf] = useState('');
  const [status, setStatus] = useState({});          // agent id -> idle | run | done
  const [outs, setOuts] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('');
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    fetch('/api/trends').then(r => r.json()).then(d => { if (alive.current && d.items) { setTrends(d.items); setAsOf(d.asOf); } }).catch(() => {});
    return () => { alive.current = false; };
  }, []);

  const change = (k, v) => { setForm(f => ({ ...f, [k]: v })); setResult(null); setError(''); setStatus({}); setOuts({}); };

  async function generate(e) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setOuts({}); setStatus({});
    const req = { ...form, language: 'en' };
    const steps = [];
    const run = async (id, call) => {
      setStatus(s => ({ ...s, [id]: 'run' }));
      const demo = mode !== 'gemini';
      const [r] = await Promise.all([call(), demo ? sleep(PACE[id]) : Promise.resolve()]);
      steps.push({ agent: id, kind: r.kind, ms: r.ms });
      if (r.mode) setMode(r.mode);
      setOuts(o => ({ ...o, [id]: r.out }));
      setStatus(s => ({ ...s, [id]: 'done' }));
      return r.out;
    };
    try {
      await run('trend', () => post('/api/agent/trend', req));
      const strategy = await run('strategy', () => post('/api/agent/strategy', { req }));
      const content = await run('content', () => post('/api/agent/content', { req, strategy }));
      const visual = await run('visual', () => post('/api/agent/visual', { req, content }));
      const final = await post('/api/agent/finish', { req, strategy, content, visual, steps });
      if (alive.current) { setResult({ ...final, strategy, content, visual }); notify('Campaign generated successfully'); }
    } catch (err) {
      setStatus({});
      setError(err instanceof TypeError ? 'Could not reach FastAPI. Check that it is running on port 8000.' : err.message);
    } finally { setLoading(false); }
  }

  function save() {
    if (!result) return;
    const { strategy, content, visual } = result;
    add({
      id: crypto.randomUUID(), brand: form.brand, product: form.product, platform: form.platform, goal: form.goal,
      title: content.title, concept: content.concept, script: content.script, caption: content.caption, postingPlan: content.postingPlan,
      trend: result.trend.name, status: 'Pending', type: 'Video', sample: false, generationMode: result.generationMode, pipeline: result.pipeline,
      agents: {
        trend: { name: result.trend.name, why: result.brandSafety.fit, caution: result.brandSafety.caution },
        strategy: { audience: `${strategy.audience.who} ${strategy.audience.why}`.trim(), angle: strategy.angle, trustMoves: strategy.trustMoves },
        content: { hook: content.script[0]?.visual, scenes: content.script.length, hashtags: content.hashtags },
        visual: { theme: visual.theme, format: visual.format, shots: visual.shots.map(s => s.shot) },
        safety: result.brandSafety.notes,
      },
    });
  }

  const showRun = loading || Object.keys(status).length > 0;
  return <div className="max-w-7xl mx-auto px-5 md:px-8 py-12">
    <div className="mb-10"><p className="text-silver text-xs tracking-[.22em] font-bold mb-4">THE CAMPAIGN GENERATOR</p><h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">Big ideas start here.</h1><p className="muted text-base mt-4 max-w-2xl">Tell RAWI about your product. The agents work one after another and you can watch each step.</p></div>
    <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-6">
      <form onSubmit={generate} className="card p-6 md:p-8"><fieldset disabled={loading} className="space-y-5">
        <h2 className="text-2xl font-bold mb-5">01 / Campaign brief</h2>
        <Field label="Brand name"><input className="field" required maxLength={120} placeholder="e.g. Matcha Ns" value={form.brand} onChange={e => change('brand', e.target.value)} /></Field>
        <Field label="Product"><input className="field" required maxLength={160} placeholder="e.g. Vanilla matcha" value={form.product} onChange={e => change('product', e.target.value)} /></Field>
        <Field label="Product description (optional)"><textarea className="field" rows={3} maxLength={2000} placeholder="What makes this product special?" value={form.description} onChange={e => change('description', e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Target audience"><input className="field" placeholder="e.g. Students near the shop" value={form.audience} onChange={e => change('audience', e.target.value)} /></Field>
          <Field label="Platform"><select className="field" value={form.platform} onChange={e => change('platform', e.target.value)}><option>TikTok</option><option>Instagram</option><option>Snapchat</option></select></Field>
        </div>
        <Field label="Choose a trend">
          <div className="flex flex-wrap gap-2">{trends.map(t => <button type="button" key={t.id} aria-pressed={form.trend === t.id} onClick={() => change('trend', t.id)} className={`pill transition-colors ${form.trend === t.id ? 'bg-silver text-ink border-silver' : 'text-[#bbb6aa]'}`}>{t.name.en}</button>)}</div>
          <p className="muted text-xs mt-2">A curated, dated sample{asOf ? ` (${asOf})` : ''}. Not live social-media data.</p>
        </Field>
        <Field label="Campaign goal"><select className="field" value={form.goal} onChange={e => change('goal', e.target.value)}><option>Brand awareness</option><option>Product launch</option><option>Engagement</option><option>Increase sales</option></select></Field>
        <button disabled={loading} className="btn btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}{loading ? 'Agents are working...' : 'Generate campaign'}</button>
        {error && <p role="alert" className="text-silver text-sm">{error}</p>}
      </fieldset></form>
      <div className="card p-6 md:p-8">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">02 / The agents at work</h2><span className="pill">{result ? 'READY TO REVIEW' : loading ? 'WORKING' : 'AWAITING INPUT'}</span></div>
        {!showRun && <div className="min-h-[420px] flex flex-col justify-center items-center text-center"><div className="w-20 h-20 rounded-2xl bg-silver/10 text-silver grid place-items-center mb-6"><Sparkles size={35} /></div><h3 className="text-3xl font-bold">Your next big idea awaits.</h3><p className="muted max-w-sm mt-3">Complete the brief and generate. You will see each agent take its turn here.</p></div>}
        {showRun && !result && <ol className="trail-list trail-live">
          {RUN.map(([id, name, doing], i) => {
            const st = status[id] || 'idle';
            return <li key={id} className={`trail-agent ${st === 'done' ? 'is-done' : st === 'run' ? 'is-run' : ''}`}>
              <span className="trail-dot" aria-hidden="true">{st === 'done' ? <Check size={14} /> : i + 1}</span>
              <div className="trail-body"><div className="trail-head"><b>{name}</b><span className="trail-state">{st === 'run' ? (id === 'visual' ? 'Processing' : 'Working') : st === 'done' ? 'Done' : 'Waiting'}</span></div>
                {st === 'run' && <p className="muted text-sm mt-2">{doing}{id === 'visual' ? '. The video and photos themselves are made by the team for now.' : ''}</p>}
                {st === 'done' && outs[id] && <div className="trail-out"><span className="trail-out-label">PRODUCED</span><p className="trail-out-main">{id === 'trend' ? outs[id].name.en : id === 'strategy' ? outs[id].angle : id === 'content' ? outs[id].title : outs[id].theme}</p></div>}
              </div></li>;
          })}
        </ol>}
        {result && <div className="space-y-6">
          <div className="bg-silver/10 rounded-xl p-5 border border-silver/20"><span className="text-silver text-xs tracking-widest">GENERATED CONCEPT</span><h3 className="text-3xl font-bold mt-2">{result.title}</h3><p className="muted mt-3 leading-relaxed">{result.concept}</p></div>
          <div><h3 className="font-bold text-xl mb-3">Storyboard</h3>{(result.script || []).map((s, i) => <div key={i} className="border-b border-white/10 py-3 flex gap-3"><span className="text-silver font-bold">{String(i + 1).padStart(2, '0')}</span><div><p className="text-xs text-silver">{s.duration}</p><p className="text-sm mt-1">{s.visual}</p>{s.voiceover && <p className="muted text-xs mt-1">Voiceover: {s.voiceover}</p>}</div></div>)}</div>
          <div><h3 className="font-bold text-xl mb-2">Caption</h3><p className="muted">{result.caption}</p></div>
          <p className="muted text-xs">{result.generationMode === 'demo' ? 'Generated by the built-in demo writer. Add a Gemini API key to enable live AI generation. Step timing in demo mode is paced so you can follow it.' : 'Generated with Gemini AI.'}</p>
          <button className="btn btn-primary w-full" onClick={save}><Save size={17} /> Save for approval</button>
          <p className="muted text-xs">After saving, the campaign page shows the full step list for every agent.</p>
        </div>}
      </div>
    </div>
  </div>;
}
