import React from 'react';
import { ArrowUp } from 'lucide-react';
import Mark from './Mark';
import { AGENTS } from './data';

export default function Footer({ navigate }) {
  const go = (p) => (e) => { e.preventDefault(); navigate(p); };
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo"><Mark size={42} /><span className="brand-latin">RAWI<small>CREATIVE INTELLIGENCE</small></span></div>
          <p className="footer-statement">Marketing thinking for small businesses, from a first idea to a campaign the owner approves.</p>
          <p className="footer-slogan" lang="ar" dir="rtl">رَويّ = فكر تسويقي وأثر قويّ</p>
        </div>
        <nav className="footer-col" aria-label="Footer navigation">
          <h2>EXPLORE</h2>
          <a href="#" onClick={go('home')}>Home</a>
          <a href="#" onClick={go('dashboard')}>Dashboard</a>
          <a href="#" onClick={go('campaigns')}>Campaigns</a>
          <a href="#" onClick={go('create')}>Create a campaign</a>
        </nav>
        <div className="footer-col">
          <h2>THE AGENTS</h2>
          {AGENTS.map((a, i) => <span key={a.id}><i>0{i + 1}</i>{a.name}</span>)}
        </div>
        <div className="footer-col">
          <h2>PROJECT</h2>
          <span>Tanmia-thon 2026</span>
          <span>Economic track · Jeddah</span>
          <span className="footer-small">Low-cost digital marketing for emerging businesses.</span>
        </div>
      </div>
      <div className="footer-base">
        <p>© 2026 RAWI. Sample trends and campaigns are illustrative, not live platform data.</p>
        <button type="button" className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top <ArrowUp size={14} /></button>
      </div>
    </footer>
  );
}
