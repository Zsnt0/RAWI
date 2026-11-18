import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, Check, Circle } from 'lucide-react';

const PHASES = ['Business brief', 'Initial screening', 'Trend & scenarios', 'Coordinator review', 'Production', 'Final audit', 'Approval & schedule'];
const SCENARIOS = [
  ['Matcha on the Road', 'Follow the drink from pickup to a quiet moment in a parked car, ending with the logo and ordering details.'],
  ['The Afternoon Pause', 'An everyday work break: close the laptop, pick up the matcha, and enjoy a moment away from the desk.'],
  ['One Cup, Three Moments', 'Follow the same cup through pickup, a walk and a relaxed afternoon stop.']
];

const AGENT_WORK = [
  [{ name: 'Business onboarding · owner input', input: 'Matcha Ns, iced matcha and the sample cup image.', action: 'Organized the business name, product and brand reference into a brief. No marketing generation happens at this stage.', output: 'A structured brief for Initial Screening.', next: 'Initial Screening' }],
  [{ name: 'Initial Screening · simulated rules and AI triage', input: 'Business brief, product description and identity reference.', action: 'Flagged missing rights and participant-consent evidence; checked for unsupported claims and identified permissions requiring human verification.', output: 'REVIEW report with rights, consent, truthfulness and permissions checks. Example human review record shown below.', next: 'Trends Agent, after human clearance' }],
  [{ name: 'Trends Agent · simulated LLM suggestion', input: 'The screened Matcha Ns brief and everyday brand tone.', action: 'Matched the product to a familiar daily-routine format. Did not query X or claim real-time popularity.', output: 'One direction: Day in the Life.', next: 'Campaign + Storytelling' },
   { name: 'Campaign + Storytelling · simulated creative agent', input: 'Day in the Life plus the real cup, pickup experience and brand identity.', action: 'Developed three different story angles using the same direction and avoided invented discounts or product benefits.', output: 'Matcha on the Road; The Afternoon Pause; One Cup, Three Moments.', next: 'Scenario Screening' },
   { name: 'Scenario Screening · simulated audit', input: 'All three scenario concepts.', action: 'Reviewed claims, likeness and filming risks. Required a parked-car tasting scene and a later rights check for music.', output: 'Screened concepts with a revision note for coordinator review.', next: 'Human Coordinator' }],
  [{ name: 'Human Coordinator · simulated human action', input: 'Three screened scenarios and the owner’s example feedback.', action: 'Shortlisted Matcha on the Road and recorded the request to keep the cup, pickup and ordering information clear.', output: 'Selected scenario 01 and documented feedback.', next: 'Campaign Agent revision' },
   { name: 'Campaign Agent · simulated revision', input: 'Selected scenario and coordinator feedback.', action: 'Changed the tasting scene to a parked car and retained the product-focused end card. The revised concept is reviewed before approval.', output: 'An approved example production direction, shown below.', next: 'Content + Visual Production' }],
  [{ name: 'Content Agent · simulated writing', input: 'The approved Matcha on the Road scenario.', action: 'Split the story into four timed scenes and prepared the caption and ordering call to action.', output: 'Storyboard and caption shown below.', next: 'Visual Production' },
   { name: 'Visual Agent · simulated production planning', input: 'Storyboard, cup reference, logo and brand tone.', action: 'Planned natural light, product close-ups, framing and an end card. The existing video is attached as a sample result; no AI video is generated in this demo.', output: 'Visual brief plus existing sample footage for review.', next: 'Final Audit' }],
  [{ name: 'Final Audit · simulated policy check', input: 'Draft copy with the deliberately introduced claim “This matcha cures illness.”', action: 'Flagged the unsupported health claim and demonstrated rejection. Use the correction button below to see the revised copy and example re-audit.', output: 'REJECT → corrected text example. Actual footage and rights still require human inspection.', next: 'Human media reviewer, then owner approval' }],
  [{ name: 'Business owner · simulated approval', input: 'The final advertisement and resolved review reports in the example flow.', action: 'Recorded an illustrative sign-off for the reviewed version. This does not change the saved campaign’s real status.', output: 'Example final approval record.', next: 'Planning Agent' },
   { name: 'Planning Agent · simulated scheduling', input: 'The owner-approved example campaign.', action: 'Prepared the launch sequence and a Google Calendar handoff. No event is created during the walkthrough.', output: 'The sample launch plan below.', next: 'Manual performance review after launch' },
   { name: 'Feedback · planned/manual step', input: 'Views, engagement and enquiries supplied after publication.', action: 'No metrics are available in this walkthrough, so no performance analysis or results are invented.', output: 'A future review task—not an executed agent result.', next: 'Insights for the next campaign when data is available' }],
];
function SimulatedWork({ step, resolved }) {
  const offset = AGENT_WORK.slice(0, step).reduce((n, agents) => n + agents.length, 0);
  return <div className="demo-agent-flow mb-8" aria-label="Simulated agent workflow">
    
    <ol className="trail-list">{AGENT_WORK[step].map((agent, i) => {
      const [name, kind] = agent.name.split(' · ');
      const planned = name === 'Feedback';
      const blocked = step === 5 && !resolved;
      const tasks = agent.action.match(/[^.!?]+[.!?]*/g) || [agent.action];
      return <li key={agent.name} className={`trail-agent ${planned || blocked ? 'is-open' : 'is-done'}`}>
        <span className="trail-dot" aria-hidden="true">{planned || blocked ? offset + i + 1 : <Check size={14}/>}</span>
        <div className="trail-body">
          <div className="trail-head"><b>{name}</b><span className="pill trail-kind">{kind.replace('simulated ', '')}</span></div>
          <p className="text-silver text-xs mt-2">{planned ? 'Planned · not executed' : blocked ? 'Flagged · correction required' : 'Done · simulated'}</p>
          <p className="muted text-sm mt-3"><span className="text-silver">Received:</span> {agent.input}</p>
          <ul className="trail-steps">{tasks.map((task, index) => <li key={index} className={planned ? '' : 'is-done'}>{planned ? <Circle size={12} aria-hidden="true"/> : <Check size={14} aria-hidden="true"/>}<span>{task.trim()}</span></li>)}</ul>
          <div className="trail-out"><span className="trail-out-label">{planned ? 'PLANNED OUTPUT' : 'PRODUCED'}</span><p className="trail-out-main">{step === 5 ? (resolved ? 'Corrected example copy: unsupported claim removed.' : 'REJECT: unsupported health claim detected.') : agent.output}</p></div>
          <p className="demo-agent-handoff">Next → {agent.next}</p>
        </div>
      </li>;
    })}</ol>
  </div>;
}

function Note({ title, children }) { return <div className="card p-5"><h3 className="font-bold mb-3">{title}</h3><div className="muted text-sm leading-relaxed whitespace-pre-line">{children}</div></div>; }
export default function CampaignAgentWorkflow({ campaign: c, expanded = false }) {
  const [resolved, setResolved] = useState(false), [failed, setFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(expanded);
  return <details className="card p-5 md:p-6 agent-workflow-disclosure" open={isOpen} onToggle={e => setIsOpen(e.currentTarget.open)}>
    <summary className="agent-workflow-toggle"><span>How agents work</span><ChevronDown size={20} aria-hidden="true"/></summary>
    <p className="muted text-sm mt-4 mb-6">The complete Matcha on the Road workflow. Prefilled simulation: no API calls, verified permissions, real approvals or publishing. The video is existing sample footage.</p>
    <div className="combined-agent-workflow">{PHASES.map((phase, step) => <section key={phase} className="combined-agent-phase">
      <h2 className="text-xl font-bold mb-5"><span className="text-silver mr-3">{String(step + 1).padStart(2, '0')}</span>{phase}</h2>
      <SimulatedWork step={step} resolved={resolved}/>
      {step === 0 && <div className="grid  gap-6"><div className="space-y-4"><Note title="Business name">Matcha Ns</Note><Note title="Product">Iced matcha for pickup—shown in the brand’s signature swan cup.</Note><Note title="Brand identity · sample reference">Cream and matcha green. A warm, everyday tone. Keep the real cup, swan mark and ordering details recognizable.</Note></div><figure><img src={c.video.poster} className="rounded-xl w-full" alt="Matcha Ns campaign reference showing the iced matcha cup"/><figcaption className="muted text-xs mt-3">Existing campaign image used as the demo identity reference; no new file upload required.</figcaption></figure></div>}
      {step === 1 && <div className="space-y-4"><Note title="Screening outcome · review → illustrative clearance">The reviewer requests evidence before moving forward. This prefilled demo shows what the review record would contain.</Note>{[['Brand and asset rights', 'Example evidence reference: brand owner authorization for the logo, product images and campaign footage.'], ['Likeness and privacy', 'Example action: obtain participant consent and remove visible personal information.'], ['Truthful advertising', 'Use the real product and ordering details. No cure claims, invented discounts or customer testimonials.'], ['Product and platform permissions', 'Example action: verify applicable advertising permissions, commercial audio rights and disclosure requirements before launch.']].map(([title, text]) => <Note key={title} title={title}>{text}</Note>)}<p className="text-xs muted">These references demonstrate the review process; supporting legal documents are not attached or verified.</p></div>}
      {step === 2 && <><Note title="One suggested direction · Day in the Life">Place the product into an ordinary daily routine so it feels natural and relatable. This is a prefilled creative direction, not a verified live X trend.</Note><div className="grid  gap-4 mt-5">{SCENARIOS.map(([title, text], i) => <div key={title} className={`card p-5 ${i === 0 ? 'border-silver' : ''}`}><p className="text-silver text-xs mb-3">SCENARIO 0{i + 1}</p><h3 className="text-xl font-bold">{title}</h3><p className="muted text-sm mt-3">{text}</p>{i === 0 && <span className="pill mt-4">SHORTLISTED</span>}</div>)}</div></>}
      {step === 3 && <div className="space-y-4"><Note title="Owner feedback · example">“Keep it natural. Show the real cup, the pickup moment and how to order. Avoid making it look like a big commercial.”</Note><Note title="Selected scenario">01 · Matcha on the Road</Note><Note title="Coordinator revision">Keep the tasting moment in a parked car. Focus on the cup and use a clear brand end card. Confirm music licensing separately.</Note><Note title="Scenario approval · simulated">The owner and coordinator agree on the revised scenario before production begins. A real workflow records and screens this revision before generating the production brief.</Note></div>}
      {step === 4 && <div className="grid  gap-6"><div><video key={c.video.src} controls playsInline preload="metadata" poster={c.video.poster} src={c.video.src} className="w-full rounded-xl" onError={() => setFailed(true)} aria-label="Matcha on the Road sample campaign video"/><p className="muted text-xs mt-3">{failed ? 'The sample video could not load. Check the local media file.' : 'Existing sample footage—not generated live by RAWI. The review of the draft is demonstrated in the audit below.'}</p><div className="mt-5"><Note title="Caption">{c.caption}</Note></div></div><div className="space-y-3"><h3 className="font-bold">Revised storyboard · example production brief</h3>{c.script.map((scene, i) => <Note key={i} title={`${scene.duration} · Scene ${i + 1}`}>{i === 2 ? 'Enjoy the drink while the car is parked. Keep the product in focus.' : scene.visual}</Note>)}<p className="muted text-xs">The revised brief does not modify the existing sample video.</p></div></div>}
      {step === 5 && <div className="space-y-4"><Note title="Final audit · deliberately introduced text issue">Test caption: “This matcha cures illness.”
Decision: REJECT. Unsupported health claim. Publication remains blocked until the copy is corrected and reviewed again.</Note>{!resolved ? <button className="btn btn-primary" onClick={() => setResolved(true)}>Show corrected copy and re-audit example</button> : <div className="review-report decision-allow"><b>Corrected demo copy</b><p className="mt-3">“From pickup to your afternoon pause. Discover Matcha Ns.”</p><p className="muted text-sm mt-3">Example text outcome: claim removed. This is a scripted audit demonstration, not a new automated check.</p></div>}<Note title="Media checklist · human review still required">Confirm the actual footage matches the revised parked-car storyboard. Verify cup and logo fidelity, participant consent, commercial audio rights and required disclosures. The sample video has not been certified by this demo.</Note></div>}
      {step === 6 && <div className="space-y-4"><div className="flex gap-3 text-silver items-center"><CheckCircle2/><b>Illustrative end state · ready for launch after all checks pass</b></div><Note title="Final owner approval · example record">“Approved for the agreed channel after the final cut, copy and required permissions are checked.”</Note><Note title="Launch plan · example">Day 1 · Complete the final media review.
Day 2 · Owner signs off and saves the launch event in Google Calendar.
Day 3 · Review available views, engagement and customer enquiries.</Note><Note title="What RAWI would do next">Only an audited, owner-approved campaign can move to scheduling in the real workspace. This demo creates no calendar event and changes no campaign status.</Note></div>}

    </section>)}</div>
  </details>;
}
