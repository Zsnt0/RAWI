import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Pause, Play } from 'lucide-react';
import { AGENTS } from './data';
import { Spark } from './Mark';
import AgentMap from './AgentMap';

export default function CinematicHome({ navigate, campaigns, open }) {
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const [source, setSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setReduced(preference.matches);
      if (preference.matches) {
        setSource(null);
        setPlaying(false);
      } else {
        setSource(window.matchMedia('(max-width: 767px)').matches
          ? '/media/rawi-sunset-mobile.mp4'
          : '/media/rawi-sunset-1080.mp4');
      }
    };
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    let inView = true;
    const syncPlayback = () => {
      if (!source || reduced || paused || !inView || document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => setPlaying(false));
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 });
    observer.observe(heroRef.current);
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, [source, reduced, paused]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    const elements = document.querySelectorAll([
      '.story-section > .section-rule',
      '.story-layout > *',
      '.selected-section > .section-rule',
      '.editorial-heading > *',
      '.concept-card',
      '.library-link',
      '.process-section > .section-rule',
      '.process-section > h2',
      '.process-grid article',
      '.closing-section > :not(.closing-signature)',
    ].join(', '));
    elements.forEach(element => {
      element.classList.add('reveal');
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (playing) {
      setPaused(true);
      video.pause();
    } else {
      setPaused(false);
      video.play().catch(() => setPlaying(false));
    }
  };

  useEffect(() => {
    // Some browsers block autoplay until the first interaction; start the film then.
    const start = () => { const v = videoRef.current; if (v && source && !paused && !reduced && v.paused) v.play().catch(() => {}); };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, start, { once: true, passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, start));
  }, [source, paused, reduced]);

  return <main className="cinematic-home">
    <section className="film-hero" ref={heroRef} aria-labelledby="hero-title">
      <div className="film-frame">
        <video ref={videoRef} className="hero-film" src={source || undefined}
          poster="/media/rawi-sunset-poster.webp" autoPlay={!reduced && !paused} muted loop playsInline
          preload={source ? 'metadata' : 'none'} aria-hidden="true" tabIndex={-1}
          onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}
          onError={() => setPlaying(false)} />
      </div>
      <div className="hero-shade" />
      <div className="hero-copy" dir="ltr" lang="en">
        <p className="eyebrow">YOUR NEXT CAMPAIGN STARTS WITH A STORY.</p>
        <h1 id="hero-title">Every campaign.<br /><span>A story worth telling.</span></h1>
        <p className="hero-description">Creative thinking. Lasting impact.</p><p className="hero-description">Your next chapter. A campaign worth sharing.</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate('create')}>Start creating <ArrowUpRight size={18} /></button>
          <button className="quiet-link" onClick={() => navigate('campaigns')}>Explore campaigns <span>↗</span></button>
        </div>
      </div>
      <div className="hero-foot">
        <a href="#rawi-story" className="scroll-link"><ArrowDown size={15} /><span>SCROLL TO EXPLORE</span></a>
        <span className="film-caption">RAWI — IDEAS TAKE FLIGHT</span>
        {!reduced && <button className="film-control" onClick={togglePlayback}
          aria-label={playing ? 'Pause background video' : 'Play background video'}>
          {playing ? <Pause size={14} /> : <Play size={14} />}<span>{playing ? 'PAUSE FILM' : 'PLAY FILM'}</span>
        </button>}
        {reduced && <span className="film-caption">STILL FRAME</span>}
      </div>
    </section>

    <section id="rawi-story" className="story-section section-shell">
      <div className="section-rule"><span>01 / THE IDEA</span><span lang="en" dir="ltr">ROOM TO IMAGINE</span></div>
      <div className="story-layout">
        <div className="story-note"><Spark size={64} className="story-spark" /><p>FROM A FIRST SPARK<br />TO A LASTING IMPRESSION.</p></div>
        <div dir="ltr" lang="en">
          <h2 className="editorial-display">Your ideas deserve<br /><span className="soft-text">a little spotlight.</span></h2>
          <p className="story-description">Bring your imagination. RAWI helps you shape it into campaign concepts, storyboards, and captions that connect with your audience.</p>
        </div>
      </div>
    </section>

    <section className="selected-section section-shell agents-glow">
      <div className="section-rule"><span>02 / THE AGENTS</span><span lang="en" dir="ltr">ONE JOB EACH</span></div>
      <div className="editorial-heading"><h2>One brief.<br /><span>A team of agents.</span></h2><p dir="ltr" lang="en">Follow the route from your brief to a campaign ready to publish.<br />Each agent hands its work to the next, and you approve before anything goes out.</p></div>
      <AgentMap />
      <button className="quiet-link library-link" onClick={() => navigate('campaigns')}>See the agents at work in a campaign <ArrowUpRight size={18} /></button>
    </section>

    <section className="process-section section-shell">
      <div className="section-rule"><span>03 / THE CREATIVE PROCESS</span><span lang="en" dir="ltr">MAKE IT HAPPEN</span></div>
      <h2 className="editorial-display" lang="en" dir="ltr">You bring the spark.<br /><span className="soft-text">We’ll help it grow.</span></h2>
      <div className="process-grid" dir="ltr" lang="en">
        {[
          ['01', 'Tell us your idea', 'Introduce your brand and product, then pick a creative direction from our sample trends.'],
          ['02', 'Watch the agents work', 'See each agent take its turn and read what it produced, step by step.'],
          ['03', 'Approve and schedule', 'Review the campaign, approve it, then choose a launch date and add it to Google Calendar.'],
        ].map(([number, title, description]) => <article key={number}>
          <span className="process-number">{number}</span><h3>{title}</h3><p>{description}</p>
        </article>)}
      </div>
    </section>
    <section className="closing-section" dir="ltr" lang="en">
      <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h2 className="editorial-display">Let’s make it happen.</h2>
      <button className="btn btn-primary" onClick={() => navigate('create')}>Create your first campaign <ArrowUpRight size={18} /></button>
      <span className="closing-signature" aria-hidden="true">RAWI</span>
    </section>
  </main>;
}




