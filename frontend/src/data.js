// Campaign data for the Matcha Ns example. Agent outputs are stored in the same shape the live generator saves.
export const STORE = {
  name: 'Matcha Ns',
  handle: 'matcha.ns1',
  whatsapp: '0555376901',
  pickup: 'North Al-Oraisa district, Jeddah',
  order: 'Order on WhatsApp. The order is confirmed after payment.',
};

export const AGENTS = [
  { id: 'trend', job: 'Finds a trend that fits your business.', name: 'Trend Intelligence', kind: 'Rule-based', steps: ['Read the business profile and campaign goal', 'Matched the request to a trend in the dated list', 'Recorded why it fits and what to avoid'] },
  { id: 'strategy', job: 'Turns it into a plan: audience and angle.', name: 'Campaign Strategy', kind: 'Writing agent', steps: ['Defined the target customer', 'Chose the angle for the video', 'Listed ways to build trust'] },
  { id: 'content', job: 'Writes the hook, scenes and caption.', name: 'Content Writing', kind: 'Writing agent', steps: ['Wrote the hook and the scenes', 'Wrote the voiceover and on-screen text', 'Wrote the caption and hashtags', 'Built the posting plan'] },
  { id: 'visual', job: 'Prepares the look and the shot list.', name: 'Visual Production', kind: 'Writing agent', steps: ['Set the look and light', 'Wrote a shot list for each scene', 'Video and photos: made by the team for now'] },
  { id: 'gate', job: 'You approve, or send it back for changes.', name: 'Owner approves?', kind: 'Owner decision', steps: ['The owner reviews the plan and approves it or asks for changes'] },
  { id: 'publish', job: 'Schedules the post and records lessons.', name: 'Publishing & Feedback', kind: 'Scheduling', steps: ['Starts once the campaign is approved', 'Schedules the post through Google Calendar', 'Collects results and records lessons'] },
];

const TREND_NOTE = 'A seasonal moment, not a live trend. Do not say it is trending today.';
const SAFETY = ['Show only menu items and prices the shop confirms.', 'Do not claim health benefits for matcha.'];

export const SEEDS = [
  {
    id: 'matcha-green-start', sample: true, status: 'Scheduled', launch: '2026-11-14T20:00',
    title: 'A Green Start to Your Day', brand: 'Matcha Ns', product: 'Vanilla matcha and Cloudy matcha', platform: 'TikTok', trend: 'Winter mornings', type: 'Video',
    concept: 'A short colour-led ad that introduces the two signature drinks, Vanilla matcha and Cloudy matcha, and ends with how to order.',
    caption: 'Your day starts green. Vanilla matcha or Cloudy matcha, ready to pick up. Order on WhatsApp. #MatchaNs #Jeddah #Matcha',
    script: [
      { scene: 1, duration: '0–3s', visual: 'Green ripple opens on a cream background.', voiceover: 'On-screen: Your day starts green.' },
      { scene: 2, duration: '3–8s', visual: 'The Vanilla matcha cup fills in layers.', voiceover: 'On-screen: Vanilla matcha. Smooth, sweet in the right amount.' },
      { scene: 3, duration: '8–13s', visual: 'The Cloudy matcha cup fills and a milk cloud forms on top.', voiceover: 'On-screen: Cloudy matcha. Cold and refreshing.' },
      { scene: 4, duration: '13–18s', visual: 'Brand end card with the order button.', voiceover: 'On-screen: Order now.' },
    ],
    postingPlan: [{ day: 'Day 1', task: 'Review and approve the ad' }, { day: 'Day 2', task: 'Schedule the TikTok post for the evening' }, { day: 'Day 3', task: 'Reply to WhatsApp orders and note which drink is asked for most' }],
    video: { src: '/media/campaign-1-green-start.mp4', poster: '/media/campaign-1-cover.png', ratio: '9 / 16', note: 'Graphic motion ad, 18 seconds.' },
    agents: {
      trend: { name: 'Winter mornings', why: 'Cool weather brings back warm drinks, comfort food and cozy things.', caution: TREND_NOTE },
      strategy: { audience: 'Students and young adults near North Al-Oraisa who want a cold matcha after class or work.', angle: 'Two drinks, one clear colour. Make the choice easy.', trustMoves: ['Show the exact menu names', 'Say how to order and where to pick up', 'Keep the claims simple'] },
      content: { hook: 'Your day starts green.', scenes: 4, hashtags: ['#MatchaNs', '#Jeddah', '#Matcha'] },
      visual: { theme: 'Cream and matcha green, bold Arabic type, one cup per scene', format: '9:16 motion graphic', shots: ['Ripple opening', 'Vanilla cup fill', 'Cloudy cup with milk cloud', 'End card'] },
      safety: SAFETY,
    },
    pipeline: [{ agent: 'trend', kind: 'rule', ms: 0 }, { agent: 'strategy', kind: 'writing', ms: 0 }, { agent: 'content', kind: 'writing', ms: 0 }, { agent: 'visual', kind: 'writing', ms: 0 }],
  },
  {
    id: 'matcha-first-sip', sample: true, status: 'Approved',
    title: 'First Sip in the Car', brand: 'Matcha Ns', product: 'Iced matcha with the swan cup', platform: 'TikTok', trend: 'POV', type: 'Video',
    concept: 'A first-person drive. The camera starts on the steering wheel, the hand takes the cup, then the shot turns to the first sip and a close-up of the swan logo.',
    caption: 'The best part of the drive. Matcha Ns, order on WhatsApp 0555376901. #MatchaNs #POV #Jeddah',
    script: [
      { scene: 1, duration: '0–3s', visual: 'Camera on the steering wheel and the car screen.', voiceover: 'No voiceover.' },
      { scene: 2, duration: '3–7s', visual: 'The hand takes the cup from the cupholder.', voiceover: 'No voiceover.' },
      { scene: 3, duration: '7–12s', visual: 'Close-up of the iced matcha, then the first sip with only the mouth and the cup visible.', voiceover: 'No voiceover.' },
      { scene: 4, duration: '12–14s', visual: 'Close-up of the swan logo on the cup.', voiceover: 'No voiceover.' },
    ],
    postingPlan: [{ day: 'Day 1', task: 'Pick the final cut and choose the sound inside TikTok' }, { day: 'Day 2', task: 'Post in the evening' }, { day: 'Day 3', task: 'Check views and WhatsApp orders' }],
    video: { src: '/media/campaign-2-first-sip.mp4', poster: '/media/campaign-2-cover.png', ratio: '9 / 16', note: 'Filmed by the team, 14 seconds.' },
    agents: {
      trend: { name: 'POV', why: 'First-person moments feel real and are easy to film with a phone.', caution: 'A format, not a live trend. Keep the face out of frame if the person asks.' },
      strategy: { audience: 'Young drivers and commuters who buy a drink on the way.', angle: 'The drive is the stage. The cup is the star.', trustMoves: ['Real cup, real drink', 'No exaggerated claims', 'Show the logo clearly at the end'] },
      content: { hook: 'Camera on the wheel, then the cup.', scenes: 4, hashtags: ['#MatchaNs', '#POV', '#Jeddah'] },
      visual: { theme: 'Warm daylight, phone filming, close-ups of the cup and the hand', format: '9:16 real footage', shots: ['Steering wheel and car screen', 'Hand takes the cup', 'First sip, mouth and below only', 'Logo close-up'] },
      safety: ['Use music inside TikTok, not inside the file, to avoid copyright problems.', ...SAFETY],
    },
    pipeline: [{ agent: 'trend', kind: 'rule', ms: 0 }, { agent: 'strategy', kind: 'writing', ms: 0 }, { agent: 'content', kind: 'writing', ms: 0 }, { agent: 'visual', kind: 'writing', ms: 0 }],
  },
  {
    id: 'matcha-on-the-road', sample: true, status: 'Pending',
    title: 'Matcha on the Road', brand: 'Matcha Ns', product: 'Iced matcha, pickup and delivery moment', platform: 'TikTok', trend: 'Day in the Life', type: 'Video',
    concept: 'A short story of an ordinary drive: the cup is handed over at the window, sits in the cupholder, and is enjoyed on the road. It closes on the logo and the ordering details.',
    caption: 'From the window to the road. Matcha Ns, pickup from North Al-Oraisa. Order on WhatsApp 0555376901. #MatchaNs #Jeddah',
    script: [
      { scene: 1, duration: '0–3s', visual: 'The cup is handed through the car window.', voiceover: 'No voiceover.' },
      { scene: 2, duration: '3–8s', visual: 'The cup in the cupholder, close-up of the iced matcha.', voiceover: 'No voiceover.' },
      { scene: 3, duration: '8–14s', visual: 'The driver sips and smiles while driving.', voiceover: 'No voiceover.' },
      { scene: 4, duration: '14–19s', visual: 'Wide shot of the car, then the logo and contact end card.', voiceover: 'On-screen: Matcha Ns.' },
    ],
    postingPlan: [{ day: 'Day 1', task: 'Owner reviews the cut' }, { day: 'Day 2', task: 'Add the song inside TikTok and schedule' }, { day: 'Day 3', task: 'Reply to orders and record what customers ask' }],
    video: { src: '/media/campaign-3-on-the-road.mp4', poster: '/media/campaign-3-poster.webp', ratio: '16 / 9', note: 'Widescreen cut, 19 seconds.' },
    agents: {
      trend: { name: 'Day in the Life', why: 'Place the product into a daily routine so it feels useful, not forced.', caution: 'A format, not a live trend.' },
      strategy: { audience: 'People who pick up a drink while out and about.', angle: 'The cup fits into the routine of the day.', trustMoves: ['Show the pickup moment', 'Show the real cup and drink', 'End with how to order'] },
      content: { hook: 'The cup is handed through the window.', scenes: 4, hashtags: ['#MatchaNs', '#Jeddah'] },
      visual: { theme: 'Natural light, car interior, close-up of ice and matcha', format: '16:9 widescreen cut', shots: ['Handover at the window', 'Cupholder close-up', 'Driving and sipping', 'Car exterior and end card'] },
      safety: SAFETY,
    },
    pipeline: [{ agent: 'trend', kind: 'rule', ms: 0 }, { agent: 'strategy', kind: 'writing', ms: 0 }, { agent: 'content', kind: 'writing', ms: 0 }, { agent: 'visual', kind: 'writing', ms: 0 }],
  },
];
