/**
 * Podcast-style dialogue transcripts for all modules.
 * Each entry is keyed by module ID and contains an array of speaker turns.
 */

export interface PodcastLine {
  speaker: string;
  role: string;
  text: string;
}

export type PodcastScript = PodcastLine[];

/**
 * Static audio URLs for pre-generated podcast episodes.
 * These modules load instantly with zero API calls.
 */
const HERITAGE_MP3 = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/podcast-audio/m-rb-intro-heritage.mp3`;

export const staticPodcastUrls: Record<string, string> = {
  "m-rb-intro-heritage": HERITAGE_MP3,
  "RAT-INTRO-001": HERITAGE_MP3,
  "RAT-INTRO-LM-001": HERITAGE_MP3,
};

/**
 * Resolve a static podcast URL for any module ID alias.
 * When accountName indicates a white-labeled account (e.g. Pinnacle Capital),
 * skip the Rathbones-specific static audio so the player falls back to
 * on-demand TTS with the already-substituted transcript text.
 */
export function getStaticPodcastUrl(moduleId: string, accountName?: string): string | undefined {
  // If this is a white-labeled account, don't serve the Rathbones static audio
  if (accountName && accountName !== "Rathbones") return undefined;
  return staticPodcastUrls[moduleId];
}

export const podcastTranscripts: Record<string, PodcastScript> = {
  /* ═══ RATHBONES INTRO MODULES ═══ */

  "m-rb-intro-heritage": [
    { speaker: "Sarah Chen", role: "Host, Head of Training", text: "Welcome to this episode of 'Inside Rathbones.' I'm Sarah Chen, Head of Training, and today we're going to talk about something that truly defines this firm — our heritage and values. Joining me is James Morton, one of our most experienced Senior Investment Managers." },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "Thanks, Sarah. It's always a pleasure to talk about what makes Rathbones special. I've been here for eighteen years, and the heritage of this firm is genuinely embedded in how we work every single day." },
    { speaker: "Sarah Chen", role: "Host", text: "So let's start at the beginning. Rathbones was founded in 1742 — that's over 280 years ago. James, what does that history actually mean for how we operate today?" },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "It means stability and trust. We started as timber merchants in Liverpool, and over generations we evolved into one of the UK's leading wealth managers. The key thread through all of that? We've always put the client relationship first. That hasn't changed." },
    { speaker: "Sarah Chen", role: "Host", text: "And then of course we had the merger with Investec Wealth & Investment UK in 2023. That was transformational." },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "Absolutely. That took us to around £109.7 billion in assets under management and significantly expanded our reach. But the cultural alignment was carefully planned — our core values of empowerment, integrity, independent thinking, client-centricity, and institutional discipline remained front and centre." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's unpack those values. Empowerment — what does that look like for a new Investment Manager joining Rathbones?" },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "It means you're given genuine autonomy. You manage your own client book, you make investment decisions within the agreed mandates, and you're supported by world-class research and infrastructure. It's not micromanagement — it's responsibility backed by support." },
    { speaker: "Sarah Chen", role: "Host", text: "And integrity — that's non-negotiable here, isn't it?" },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "Completely non-negotiable. From our earliest days, trust has been the bedrock. In an FCA-regulated environment, integrity is a regulatory imperative, but for us it's also a moral one. Transparency about fees, performance, risks — it's who we are." },
    { speaker: "Sarah Chen", role: "Host", text: "Independent thinking is another one that new joiners often ask about. How does that balance with having a house view?" },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "Great question. We have a strong Investment Committee and a clear house view, but we actively encourage healthy debate. You're expected to apply that view to each client's unique circumstances. We don't follow the herd, and we don't use off-the-shelf models. Every portfolio is bespoke." },
    { speaker: "Sarah Chen", role: "Host", text: "Client-centricity — at the heart of everything." },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "The heart, absolutely. Our entire business model is built around one-to-one relationships. You're not managing a segment or a cohort — you're building a genuine partnership with each client. Understanding their lives, ambitions, fears. That's where Consumer Duty truly comes alive." },
    { speaker: "Sarah Chen", role: "Host", text: "And finally, institutional discipline. That might sound bureaucratic, but it's actually vital." },
    { speaker: "James Morton", role: "Senior Investment Manager", text: "It's the guardrails that make everything else possible. Robust processes, risk management, regulatory compliance — they provide the stability and structure that lets us deliver bespoke, independent solutions at scale. It's the blend of agility and rigour that makes Rathbones unique." },
    { speaker: "Sarah Chen", role: "Host", text: "Brilliant summary, James. For anyone joining Rathbones, remember: you're becoming a custodian of a 280-year legacy. These values will guide everything you do. Thanks for listening." },
  ],

  "m-rb-intro-invest": [
    { speaker: "Sarah Chen", role: "Host, Head of Training", text: "Welcome back to 'Inside Rathbones.' Today we're tackling a fundamental topic — how we invest. I'm joined by Eleanor Webb, one of our senior members on the Investment Committee." },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Thank you, Sarah. This is probably the most important topic for any new Investment Manager to understand, because it defines what makes Rathbones different from virtually every other wealth manager in the UK." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's start with the cornerstone — bespoke discretionary management. What does that actually mean in practice?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "It means every single portfolio we manage is built from the ground up for that specific client. We do not use model portfolios. A client nearing retirement with income needs from an ISA will have a fundamentally different portfolio from a younger client investing for long-term growth in a SIPP, even if both have a 'medium' risk profile." },
    { speaker: "Sarah Chen", role: "Host", text: "And the one-to-one relationship model — that's central to how we deliver this?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Absolutely. The Investment Manager is the client's primary point of contact, their advocate within Rathbones. You interpret their needs, translate them into investment objectives, and communicate strategy and performance back to them. Clients value knowing that the person they speak to is the person making decisions." },
    { speaker: "Sarah Chen", role: "Host", text: "Talk us through the Investment Committee's role in all of this." },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "The IC is the engine room. We meet regularly to analyse macroeconomic conditions, geopolitical events, market valuations, and long-term trends. We produce a 'house view' — asset class weightings, regional preferences, sectoral tilts. But here's the crucial part: that's top-down guidance. The individual IM decides how to implement that for each client's unique circumstances." },
    { speaker: "Sarah Chen", role: "Host", text: "So it's top-down guidance, bottom-up implementation?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Exactly. The IC might recommend overweight UK equities and underweight emerging market debt for a balanced portfolio. But you decide which specific UK equities or bonds are right for your individual client. That's where your skill and client knowledge come in." },
    { speaker: "Sarah Chen", role: "Host", text: "ESG and responsible investment — how does that fit in?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "It's fundamental, not an add-on. We believe considering ESG factors is integral to our fiduciary duty. Our central responsible investment team provides research and tools, but we also tailor ESG approaches to each client's preferences — whether that's positive impact, sector exclusion, or integrated ESG analysis." },
    { speaker: "Sarah Chen", role: "Host", text: "And how do we differ from model-based approaches that many competitors use?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Models categorise clients into broad buckets — Conservative, Balanced, Growth — and slot them into pre-defined baskets. We believe that rarely captures the full nuance of someone's financial life. Our approach offers true personalisation, greater flexibility around tax management, and a holistic view of the client's entire wealth picture." },
    { speaker: "Sarah Chen", role: "Host", text: "Thank you, Eleanor. For our new IMs listening — this investment philosophy is a commitment to depth over breadth, quality over quantity, and genuine partnership. You're at the heart of delivering that." },
  ],

  "m-rb-intro-90days": [
    { speaker: "Sarah Chen", role: "Host, Head of Training", text: "Today's episode is all about your first 90 days at Rathbones. I'm joined by Tom Richards, who completed his own onboarding just eight months ago and is already thriving." },
    { speaker: "Tom Richards", role: "Investment Manager", text: "Hi Sarah! Yes, I remember my first 90 days vividly. It's intense but genuinely exciting. I wish someone had told me a few things upfront, so hopefully I can help." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's start with Week 1. What should new joiners expect?" },
    { speaker: "Tom Richards", role: "Investment Manager", text: "Week 1 is all about orientation and immersion. You'll meet key stakeholders, get your IT set up — Xplan, Bloomberg, the portfolio management system — and complete mandatory compliance training. The most important thing? Get your 'buddy' assignment sorted and actually use them." },
    { speaker: "Sarah Chen", role: "Host", text: "The buddy system is really valuable, isn't it?" },
    { speaker: "Tom Richards", role: "Investment Manager", text: "Hugely. Your buddy isn't your line manager — they're someone you can ask the 'silly questions' to without feeling judged. Mine helped me navigate the informal culture, introduced me to people, and saved me hours of confusion." },
    { speaker: "Sarah Chen", role: "Host", text: "What about weeks two through four?" },
    { speaker: "Tom Richards", role: "Investment Manager", text: "That's when you start embedding into your team. Attend regular meetings, understand the current client work and pipeline. If you're taking over an existing book, client handovers begin — and that's meticulous, compliance-driven work. If you're building your book, you'll learn the internal referral process." },
    { speaker: "Sarah Chen", role: "Host", text: "And the shadowing opportunities?" },
    { speaker: "Tom Richards", role: "Investment Manager", text: "Proactively ask to shadow experienced IMs. Attend client meetings with permission, sit in on portfolio reviews. Observing how senior colleagues build rapport, explain complex concepts, and handle tough questions is invaluable. I learned more from shadowing than from any single training module." },
    { speaker: "Sarah Chen", role: "Host", text: "Months two and three — what shifts?" },
    { speaker: "Tom Richards", role: "Investment Manager", text: "You start taking on more responsibility. Managed client meetings with support, deeper engagement with the Investment Committee's research output, and building your internal network across Research, Financial Planning, Operations, and Compliance. You should also be proactively identifying skill gaps and discussing them with your manager." },
    { speaker: "Sarah Chen", role: "Host", text: "Any top tips for new joiners?" },
    { speaker: "Tom Richards", role: "Investment Manager", text: "Three things. First, be proactive — don't wait for things to come to you. Second, build relationships early across departments, not just your immediate team. Third, don't be afraid to ask questions. The culture here genuinely supports that. Everyone remembers being new." },
    { speaker: "Sarah Chen", role: "Host", text: "Great advice, Tom. For everyone listening — your first 90 days are about laying the foundation for a successful career. Embrace it." },
  ],

  /* ═══ RATHBONES FOUNDATIONS MODULES (m-rb1 through m-rb7) ═══ */

  "m-rb1": [
    { speaker: "Sarah Chen", role: "Host", text: "Welcome to today's session on the Investment Manager role and good client outcomes. With me is Victoria Palmer, Head of Client Experience at Rathbones." },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Thank you, Sarah. This topic is the foundation of everything we do. Understanding what 'good client outcomes' actually means — not just as a regulatory requirement under Consumer Duty, but as a genuine commitment — is essential." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's start with the IM role itself. What does it actually look like day-to-day?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "The IM is the single point of accountability for each client relationship. You're responsible for understanding their financial goals, constructing and managing their bespoke portfolio, conducting regular reviews, and ensuring every recommendation is suitable. It's a blend of investment expertise and relationship management." },
    { speaker: "Sarah Chen", role: "Host", text: "And the fiduciary duty aspect?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "It's fundamental. You have a legal and ethical obligation to act in the client's best interests at all times. Under the FCA's Consumer Duty, that means delivering 'good outcomes' — fair value, products and services that meet their needs, clear communications, and appropriate support." },
    { speaker: "Sarah Chen", role: "Host", text: "How do we measure whether we're achieving good outcomes?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Through multiple lenses. Portfolio performance relative to the client's objectives and risk profile, client satisfaction surveys, complaint analysis, suitability review outcomes, and increasingly through data-driven monitoring. It's not just about returns — it's about whether the whole experience is fair and appropriate." },
    { speaker: "Sarah Chen", role: "Host", text: "What should new IMs focus on to get this right from day one?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Three things: deeply understand each client's individual circumstances, document everything meticulously, and always ask yourself — 'Is this recommendation genuinely in this client's best interest?' If you can answer yes with confidence and evidence, you're on the right track." },
  ],

  "m-rb2": [
    { speaker: "Sarah Chen", role: "Host", text: "Today we're discussing how to lead client relationships with confidence. I'm joined by Andrew Blackwell, who manages a book of over 120 client relationships." },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Thanks, Sarah. Client relationships are the lifeblood of what we do at Rathbones. Getting them right is the difference between a good IM and a great one." },
    { speaker: "Sarah Chen", role: "Host", text: "What does 'leading' a client relationship actually mean?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "It means being proactive, not reactive. You're not waiting for clients to call you with concerns — you're anticipating their needs, reaching out before market events impact them, and continuously demonstrating that you're thinking about their wealth. It's about being their trusted adviser, not just their portfolio manager." },
    { speaker: "Sarah Chen", role: "Host", text: "Building rapport — how do you do that authentically?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Listen more than you talk. Ask about their family, their business, their concerns beyond just investments. Remember personal details. Follow up on things they've mentioned. Clients want to feel known, not processed. And be honest — if performance has been disappointing, acknowledge it and explain the context." },
    { speaker: "Sarah Chen", role: "Host", text: "How do you handle difficult conversations — like underperformance or fee discussions?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "With transparency and confidence. Never dodge a difficult conversation. If the portfolio has underperformed, explain why, what you've learned, and what you're doing about it. For fees, be clear about what they're paying for and the value they're receiving. Clients respect honesty far more than evasion." },
    { speaker: "Sarah Chen", role: "Host", text: "Any advice for new IMs building their first client relationships?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Prepare thoroughly for every meeting. Know the client's portfolio inside out, anticipate their questions, and always end with clear next steps. And remember — the relationship starts before the first meeting. How you introduce yourself, how promptly you respond, how organised you appear — it all builds or erodes trust." },
  ],

  "m-rb3": [
    { speaker: "Sarah Chen", role: "Host", text: "Welcome to our session on suitability, documentation, and client fairness. I'm joined by Rachel Harrington, our Head of Compliance." },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Thank you, Sarah. This topic might not sound glamorous, but it's absolutely critical. Suitability is the regulatory and ethical backbone of everything an Investment Manager does." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's start with the basics. What is a suitability assessment?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "A suitability assessment is the process of ensuring that every investment recommendation you make is appropriate for the specific client. It considers their financial situation, investment objectives, risk tolerance, capacity for loss, knowledge and experience, and time horizon. Under MiFID II and Consumer Duty, this isn't optional — it's mandatory for every recommendation." },
    { speaker: "Sarah Chen", role: "Host", text: "And documentation — why is that so important?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "If it isn't documented, it didn't happen. From a regulatory perspective, you must be able to evidence that you assessed suitability, considered the client's circumstances, and that your recommendation was appropriate. Good documentation protects the client, protects you, and protects the firm. It should be clear, contemporaneous, and comprehensive." },
    { speaker: "Sarah Chen", role: "Host", text: "What does 'client fairness' mean in practice?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Under Consumer Duty, it means ensuring clients receive fair value for our services, that we don't create foreseeable harm, and that our communications are clear and not misleading. It also means treating vulnerable clients with particular care and ensuring that all clients can understand the products and services they're receiving." },
    { speaker: "Sarah Chen", role: "Host", text: "Common pitfalls new IMs should avoid?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Three big ones: first, assuming you know the client's risk appetite without properly assessing it. Second, inadequate documentation — brief notes that don't capture the rationale. Third, not revisiting suitability when circumstances change. A client's situation evolves, and your recommendations must evolve with it." },
  ],

  "m-rb4": [
    { speaker: "Sarah Chen", role: "Host", text: "Today we're looking at internal collaboration — working with Financial Planning, Portfolio Management, and Client Support. Joining me are James Cartwright and Helen Park." },
    { speaker: "James Cartwright", role: "Senior Financial Planner", text: "Hi Sarah. Internal collaboration is what turns good advice into excellent outcomes. An IM working in isolation will always deliver less than one who leverages the full depth of Rathbones' expertise." },
    { speaker: "Helen Park", role: "Portfolio Manager", text: "Agreed. And from the portfolio management side, we're here to help you implement the Investment Committee's views effectively and manage the operational complexity of bespoke portfolios." },
    { speaker: "Sarah Chen", role: "Host", text: "James, when should an IM engage Financial Planning?" },
    { speaker: "James Cartwright", role: "Senior Financial Planner", text: "Whenever a client has complex financial needs beyond just investment management. Pension drawdown, inheritance tax planning, trust structures, property sales, divorce settlements — these all require specialist financial planning input. The earlier you involve us, the better the outcome." },
    { speaker: "Sarah Chen", role: "Host", text: "Helen, what does the IM-Portfolio Manager relationship look like?" },
    { speaker: "Helen Park", role: "Portfolio Manager", text: "Think of it as a partnership. The IM sets the strategic direction based on the client's objectives and the house view. I help execute that efficiently — managing rebalancing, implementing tactical changes, and flagging any operational issues. I need clear, concise briefs from IMs, and I expect them to understand the constraints and costs of implementation." },
    { speaker: "Sarah Chen", role: "Host", text: "And Client Support — often underestimated?" },
    { speaker: "James Cartwright", role: "Senior Financial Planner", text: "Absolutely. The client support team handles the day-to-day operational queries — withdrawals, transfers, tax certificates, change of address. If they're not kept informed about the client's circumstances, things fall through the cracks. A good IM keeps a strong communication channel with client support." },
    { speaker: "Sarah Chen", role: "Host", text: "Key takeaway for new IMs?" },
    { speaker: "Helen Park", role: "Portfolio Manager", text: "You're not alone. Use the full depth of Rathbones' expertise. The best IMs are the ones who collaborate proactively, brief clearly, and make it easy for specialists to add value." },
  ],

  "m-rb5": [
    { speaker: "Sarah Chen", role: "Host", text: "Today's topic is investment process and portfolio alignment. Eleanor Webb from the Investment Committee joins me again." },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Thank you, Sarah. Understanding our investment process is fundamental for any IM. It's the framework within which you'll construct and manage every client portfolio." },
    { speaker: "Sarah Chen", role: "Host", text: "Walk us through the process from house view to individual portfolio." },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "It starts with the IC forming a strategic asset allocation view — how much in equities, fixed income, alternatives, cash, and within each, regional and sector preferences. That view is informed by macro analysis, valuations, and our outlook. The IM then takes that framework and applies it to each client's specific mandate — their risk profile, income needs, ethical preferences, and tax situation." },
    { speaker: "Sarah Chen", role: "Host", text: "How should IMs think about portfolio alignment?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Alignment means ensuring the portfolio's risk characteristics and asset allocation are consistent with the client's agreed mandate. If the IC shifts its view — say, reducing equity exposure — each IM needs to consider how that applies to their individual clients. Not every client portfolio should move the same way, because not every client has the same objectives." },
    { speaker: "Sarah Chen", role: "Host", text: "What about tactical versus strategic changes?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Strategic asset allocation is the long-term framework — it changes slowly based on fundamental shifts. Tactical changes are shorter-term adjustments based on market opportunities or risks. For example, we might tactically increase cash if we see elevated short-term risk, but strategically maintain our equity allocation. IMs need to understand this distinction and communicate it clearly to clients." },
    { speaker: "Sarah Chen", role: "Host", text: "Anything else new IMs should bear in mind?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Stay connected to the research output. Read the IC notes, attend the briefings, and challenge where appropriate. The process works best when IMs are active participants, not passive recipients." },
  ],

  "m-rb6": [
    { speaker: "Sarah Chen", role: "Host", text: "Today's focus is on communicating clearly — with clients and internal partners. I'm joined by Catherine Lloyd, our Head of Client Communications." },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Thank you, Sarah. Communication is the single most important skill for an Investment Manager. You can have the best investment ideas in the world, but if you can't communicate them clearly and confidently, they don't land." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's start with client communication. What does excellence look like?" },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Plain language, always. Avoid jargon unless you're sure the client understands it. Structure your communications — whether verbal or written — with the key message first, then the supporting detail. And always end with clear next steps." },
    { speaker: "Sarah Chen", role: "Host", text: "Written versus verbal — any differences in approach?" },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Written communication needs more care because the client can't ask clarifying questions in real-time. Be precise, proofread, and consider how the words might be read by someone who isn't an investment professional. For verbal communication, pace yourself, check for understanding, and use visual aids when explaining complex concepts like asset allocation." },
    { speaker: "Sarah Chen", role: "Host", text: "Internal communication — often overlooked?" },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Very much so. When you're briefing Financial Planning, Portfolio Management, or Compliance, be concise and structured. Lead with the ask, provide the relevant context, and specify what you need by when. Vague emails like 'Can you look at this client?' waste everyone's time." },
    { speaker: "Sarah Chen", role: "Host", text: "Difficult messages — market downturns, underperformance, fee changes?" },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Lead with empathy, follow with facts. Acknowledge the client's concerns before diving into the data. Never be defensive. Use data to provide context and perspective, and always end with what you're doing about it. Proactive communication during difficult periods builds trust; silence erodes it." },
  ],

  "m-rb7": [
    { speaker: "Sarah Chen", role: "Host", text: "Our final foundations topic is professional integrity, attention to detail, and ownership. Dr. Fiona Marchetti, our Ethics and Conduct Advisor, joins me." },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "Thank you, Sarah. These three qualities — integrity, attention to detail, and ownership — might sound like corporate values on a wall, but at Rathbones they have very tangible, everyday implications for how you conduct yourself as an Investment Manager." },
    { speaker: "Sarah Chen", role: "Host", text: "Let's start with integrity. What does it mean in practice?" },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "It means always doing the right thing, even when no one is watching. Disclosing conflicts of interest, being transparent about fees and performance, never misrepresenting information to a client or colleague, and raising concerns when you see something that isn't right. The FCA's conduct rules demand this, but at Rathbones we expect it because it's who we are." },
    { speaker: "Sarah Chen", role: "Host", text: "Attention to detail — why is it so critical in this role?" },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "Because small errors can have large consequences. A mistake in a trade, an incorrect tax reference, a misquoted fee — these can cause financial harm, regulatory issues, and destroy client trust. In wealth management, the stakes are high. Checking your work, double-reading your correspondence, and verifying data before acting on it isn't pedantry — it's professionalism." },
    { speaker: "Sarah Chen", role: "Host", text: "And ownership — what does that look like for a new IM?" },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "Ownership means not passing the buck. If something goes wrong in your client relationship, you own the resolution. If a client has a complaint, you engage with it rather than hiding behind compliance. If you see a process that could be improved, you raise it. It's about taking personal responsibility for the quality of your work and the outcomes for your clients." },
    { speaker: "Sarah Chen", role: "Host", text: "Any final thoughts for new joiners?" },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "Your reputation is your most valuable asset. Build it through consistent integrity, meticulous attention to detail, and genuine ownership of your work. These aren't just career success factors — they're what makes you worthy of clients' trust." },
  ],

  /* ═══ RATHBONES ST2 MODULES (RAT-LM-*) ═══ */

  "RAT-LM-001": [
    { speaker: "Sarah Chen", role: "Host", text: "Today we're covering the Rathbones investment proposition and how it drives client outcomes. Victoria Palmer joins me again." },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "The investment proposition is essentially the promise we make to clients — that we'll manage their wealth with a bespoke, discretionary approach that's aligned to their individual goals. Everything flows from that." },
    { speaker: "Sarah Chen", role: "Host", text: "How does an IM translate the proposition into actual client outcomes?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "By understanding the client deeply — their objectives, their risk tolerance, their life circumstances — and then constructing a portfolio that genuinely reflects all of that. Good outcomes aren't just returns; they're about the client feeling heard, understood, and fairly treated." },
    { speaker: "Sarah Chen", role: "Host", text: "And how does Consumer Duty fit into this?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Consumer Duty codifies what we should already be doing. It requires us to deliver fair value, provide appropriate products, communicate clearly, and offer proper support. For IMs, it means every recommendation must be evidenced as suitable, and every client interaction must contribute to a good outcome." },
  ],

  "RAT-LM-002": [
    { speaker: "Sarah Chen", role: "Host", text: "Suitability, risk profiling, and documentation — the regulatory backbone of our work. Rachel Harrington joins me." },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Suitability is where the rubber meets the road. Every recommendation you make must be demonstrably suitable for that specific client. And the only way to prove that is through thorough, contemporaneous documentation." },
    { speaker: "Sarah Chen", role: "Host", text: "Walk us through the risk profiling process." },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "We assess three dimensions: risk tolerance — how comfortable is the client with volatility; capacity for loss — how much can they afford to lose without impacting their lifestyle; and the need to take risk — what returns do they need to meet their objectives? These three together determine the appropriate risk profile." },
    { speaker: "Sarah Chen", role: "Host", text: "Documentation standards — what does good look like?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Clear, contemporaneous notes that capture what was discussed, what was recommended, why it was suitable, and what the client agreed to. Include the client's stated objectives, any constraints, the rationale for asset allocation decisions, and confirmation that the client understood the risks involved." },
  ],

  "RAT-LM-003": [
    { speaker: "Sarah Chen", role: "Host", text: "Portfolio construction and asset allocation — let's get practical. Eleanor Webb is back with us." },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "This is where theory meets practice. Portfolio construction is the art and science of building a portfolio that meets the client's objectives while managing risk appropriately." },
    { speaker: "Sarah Chen", role: "Host", text: "What's the process for constructing a new client portfolio?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Start with the client's mandate — their objectives, risk profile, and any constraints like ethical preferences or existing holdings. Then apply the IC's strategic asset allocation framework to determine the broad mix. Finally, select individual securities and funds that implement that strategy effectively, considering diversification, liquidity, and cost." },
    { speaker: "Sarah Chen", role: "Host", text: "Diversification — how much is enough?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "There's no magic number, but the principle is to avoid concentrated risk. Diversify across asset classes, geographies, sectors, and individual holdings. The goal is that no single position should be able to significantly damage the overall portfolio. For most clients, that means a well-diversified equity allocation alongside appropriate fixed income and possibly alternatives." },
  ],

  "RAT-LM-004": [
    { speaker: "Sarah Chen", role: "Host", text: "Client communication and relationship management — the practical skills that make or break an IM's career. Andrew Blackwell joins me." },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "I can't stress enough how important communication is. Investment expertise gets you in the door, but communication quality determines whether clients stay, refer others, and trust your judgment during difficult markets." },
    { speaker: "Sarah Chen", role: "Host", text: "Client review meetings — how do you structure them?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Always prepare thoroughly. Review the portfolio's performance relative to objectives, note any changes in the client's circumstances, prepare talking points on market outlook, and identify any actions needed. Start by asking about them — their life, any changes — before diving into numbers. End with clear, documented next steps." },
    { speaker: "Sarah Chen", role: "Host", text: "Handling the client who wants to time the market?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Common scenario. Acknowledge their concern, explain why market timing consistently fails — the data is clear on that — and redirect to their long-term plan. Use historical examples to show that staying invested through volatility typically produces better outcomes than trying to jump in and out. But always listen to why they're anxious." },
  ],

  "RAT-LM-005": [
    { speaker: "Sarah Chen", role: "Host", text: "Internal collaboration with Financial Planning and Portfolio Management. James and Helen are back." },
    { speaker: "James Cartwright", role: "Senior Financial Planner", text: "Every complex client case benefits from collaboration. The IM who tries to do everything alone misses opportunities and creates risk." },
    { speaker: "Helen Park", role: "Portfolio Manager", text: "And from an implementation perspective, clear communication between IMs and Portfolio Managers ensures that strategic intentions are translated into efficient execution." },
    { speaker: "Sarah Chen", role: "Host", text: "Give us a practical example of effective collaboration." },
    { speaker: "James Cartwright", role: "Senior Financial Planner", text: "A client inheriting £500k while drawing down their pension. The IM engages Financial Planning to model the optimal integration strategy — should the inheritance go into a GIA, ISA, or pension? What are the IHT implications? Meanwhile, Portfolio Management helps execute the investment strategy for the new assets, considering the existing portfolio's composition." },
    { speaker: "Helen Park", role: "Portfolio Manager", text: "The key is a clear brief. Tell us what the client needs, what the constraints are, and what timeline we're working to. Don't just send a vague email asking for 'some help with a client.'" },
  ],

  "RAT-LM-006": [
    { speaker: "Sarah Chen", role: "Host", text: "Professional standards, integrity, and ownership in practice. Dr. Fiona Marchetti returns." },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "These aren't abstract concepts — they show up in daily decisions. How you handle a compliance alert, how you respond when a client asks a question you're not sure about, whether you flag an error you've made or hope no one notices." },
    { speaker: "Sarah Chen", role: "Host", text: "Conflicts of interest — how should IMs handle them?" },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "Disclose, manage, and if necessary, avoid. If you have a personal holding in a stock you're recommending to clients, that's a conflict. If a family member works at a company whose bonds you're considering, that's a conflict. The rules are clear — disclose everything, and err on the side of caution." },
    { speaker: "Sarah Chen", role: "Host", text: "Ownership when things go wrong?" },
    { speaker: "Fiona Marchetti", role: "Ethics and Conduct Advisor", text: "Own it immediately. If you've made a trade error, report it through the proper channels straight away. If a client complaint comes in, engage with it constructively. The worst thing you can do is try to hide or minimise an error. Our culture supports raising issues — what we don't support is concealment." },
  ],

  "RAT-LM-007": [
    { speaker: "Sarah Chen", role: "Host", text: "Clear communication with clients and internal partners, part two. Catherine Lloyd is here for a deeper dive." },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Building on our earlier session, I want to focus on the practical techniques that separate adequate communication from excellent communication." },
    { speaker: "Sarah Chen", role: "Host", text: "Written reports and valuations — best practices?" },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Lead with the headline — how has the portfolio performed relative to objectives? Then provide context — market conditions, strategic decisions, changes made. Avoid burying key information in dense paragraphs. Use bullet points, clear headings, and plain English. And always proofread — typos in a client report undermine credibility." },
    { speaker: "Sarah Chen", role: "Host", text: "Internal briefing notes?" },
    { speaker: "Catherine Lloyd", role: "Head of Client Communications", text: "Structure them as: Background, Issue, Recommendation, Next Steps. Keep them concise — your colleagues are busy. If you need a decision, say so explicitly. If you need information, specify exactly what. Vague internal communications create delays and misunderstandings." },
  ],

  "RAT-LM-008": [
    { speaker: "Sarah Chen", role: "Host", text: "Documenting investment decisions and rationale. Rachel Harrington returns for this important topic." },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Good documentation is your protection and your client's protection. It demonstrates that decisions were made thoughtfully, with proper consideration of suitability and market conditions." },
    { speaker: "Sarah Chen", role: "Host", text: "What should an investment decision record include?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "The client's current objectives and risk profile, the market context for the decision, what you're recommending and why, how it fits within the overall portfolio, any alternatives considered, and the expected impact. Time-stamp everything and include any relevant IC guidance you're implementing." },
    { speaker: "Sarah Chen", role: "Host", text: "Common documentation failures?" },
    { speaker: "Rachel Harrington", role: "Head of Compliance", text: "Retrospective documentation — writing notes days after the decision. Vague rationale like 'client requested' without capturing whether you assessed suitability. And inconsistency between what was discussed verbally and what's recorded. Make documentation a habit, not an afterthought." },
  ],

  "RAT-LM-009": [
    { speaker: "Sarah Chen", role: "Host", text: "Fee structures, costs, and value assessment. A topic that directly impacts client trust. Victoria Palmer joins me." },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Fee transparency is a cornerstone of Consumer Duty and client trust. Clients have every right to understand exactly what they're paying and what value they're receiving." },
    { speaker: "Sarah Chen", role: "Host", text: "Walk us through Rathbones' fee structure." },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "We charge an annual management fee based on a percentage of assets under management, typically tiered so larger portfolios attract a lower percentage. There are also underlying fund costs for any collective investments held, and dealing charges for trades. The key is total cost of ownership — clients should understand the all-in cost." },
    { speaker: "Sarah Chen", role: "Host", text: "Value assessment — how do we demonstrate value?" },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Value isn't just performance. It's the quality of the relationship, the bespoke nature of the service, the depth of financial planning support, the peace of mind from institutional-grade risk management, and the ongoing proactive advice. When clients ask whether fees are justified, we need to articulate all of these dimensions, not just returns." },
  ],

  "RAT-LM-010": [
    { speaker: "Sarah Chen", role: "Host", text: "Handling market volatility conversations with clients. Andrew Blackwell, this is your area of expertise." },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Absolutely. Market volatility is when your relationship with the client is truly tested. How you communicate during these periods can make or break the trust you've built." },
    { speaker: "Sarah Chen", role: "Host", text: "The client calls in a panic. Markets have dropped 10%. What's your approach?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "First, listen. Let them express their anxiety. Then acknowledge it — 'I completely understand why this is concerning.' Next, provide context — historical perspective on market corrections, how the portfolio is positioned to weather volatility, and what we've already done or plan to do. Finally, reaffirm their long-term plan. But never dismiss their feelings." },
    { speaker: "Sarah Chen", role: "Host", text: "Should IMs proactively reach out during volatile periods?" },
    { speaker: "Andrew Blackwell", role: "Senior Investment Manager", text: "Absolutely, and ideally before the client contacts you. A brief, reassuring note or call that says 'I'm watching this, here's our position, here's what we're doing' is enormously valuable. Silence during market turmoil is interpreted as indifference." },
  ],

  /* ═══ RATHBONES BRIDGE MODULES (RAT-BR-*) ═══ */

  "RAT-BR-001": [
    { speaker: "Sarah Chen", role: "Host", text: "Welcome to the Domain Bridge series. Today — transitioning from financial services to wealth management. I'm joined by Michael Hennessy, who made exactly this transition five years ago." },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "Thanks, Sarah. I came from corporate banking, and the transition to wealth management was both exciting and humbling. The vocabulary, the client expectations, and the pace of work are all different." },
    { speaker: "Sarah Chen", role: "Host", text: "What was the biggest adjustment?" },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "The depth of the client relationship. In banking, I was transactional — processing applications, managing credit lines. Here, I'm genuinely embedded in clients' financial lives. I need to understand their families, their tax situations, their hopes and anxieties. It's much more personal." },
    { speaker: "Sarah Chen", role: "Host", text: "Core vocabulary differences?" },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "Terms like 'mandate,' 'suitability,' 'discretionary management,' 'asset allocation,' and 'risk profile' are used constantly and have very specific meanings. In banking, we talked about 'products' and 'rates.' Here, everything is about the client's objectives and how the portfolio serves them." },
  ],

  "RAT-BR-002": [
    { speaker: "Sarah Chen", role: "Host", text: "Rathbones' investment approach and portfolio philosophy — from the perspective of someone new to wealth management. Eleanor Webb joins me." },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Understanding our investment approach is crucial for domain-bridge joiners. Unlike banking or insurance, where products are standardised, everything we do is bespoke and client-specific." },
    { speaker: "Sarah Chen", role: "Host", text: "How should someone from banking or IFA background think about our approach?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "Think of it as moving from product distribution to solution crafting. You're not selling a fund or a policy — you're constructing a unique portfolio that reflects this specific client's entire financial life. The Investment Committee provides the strategic framework, but the IM applies it with full knowledge of the client's circumstances." },
    { speaker: "Sarah Chen", role: "Host", text: "What surprises domain-bridge joiners most?" },
    { speaker: "Eleanor Webb", role: "Investment Committee Member", text: "The autonomy and the responsibility. They often expect more prescriptive guidance — 'buy this fund for this type of client.' Instead, they find they're expected to make independent judgments within the IC framework. That's both empowering and initially daunting." },
  ],

  "RAT-BR-003": [
    { speaker: "Sarah Chen", role: "Host", text: "Translating your experience into client conversations. Michael Hennessy returns for this practical session." },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "This is about leveraging what you already know while adapting to the wealth management context. Your previous experience isn't wasted — it's a foundation to build on." },
    { speaker: "Sarah Chen", role: "Host", text: "How do you use banking experience in client conversations?" },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "I understand financial products, regulatory environments, and how institutions work. When a client asks about the relationship between interest rates and bond prices, I can explain it clearly because I lived that world. When they want to understand currency risk, I draw on my banking experience. The key is translating that knowledge into the wealth management vocabulary." },
    { speaker: "Sarah Chen", role: "Host", text: "Pitfalls to avoid?" },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "Don't use banking jargon with clients — they don't care about 'credit facilities' or 'counterparty risk' in banking terms. Also, don't assume your previous client relationship style translates directly. Wealth management relationships are deeper, longer-term, and more personal. Adapt your approach accordingly." },
  ],

  "RAT-BR-LM-004": [
    { speaker: "Sarah Chen", role: "Host", text: "The difference between adjacent financial experience and Investment Manager expectations. A candid conversation with Michael Hennessy and Victoria Palmer." },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "I think the biggest misconception domain-bridge joiners have is thinking they're already qualified because they've worked in finance. The truth is, investment management requires a specific skill set that's quite different from banking, insurance, or IFA work." },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "Exactly. You might understand financial products, but do you understand how to construct a diversified portfolio for a client with complex tax circumstances? You might be great at relationship management, but can you explain asset allocation decisions in a way that gives the client genuine confidence?" },
    { speaker: "Sarah Chen", role: "Host", text: "So what should domain-bridge joiners focus on?" },
    { speaker: "Michael Hennessy", role: "Investment Manager (Former Banking)", text: "Three things: investment knowledge — really understand asset classes, portfolio construction, and market dynamics; suitability and regulatory frameworks — they're more rigorous than what most banking roles require; and the depth of client engagement — learning to be a trusted long-term adviser rather than a product distributor." },
    { speaker: "Victoria Palmer", role: "Head of Client Experience", text: "And be humble. The best domain-bridge joiners are the ones who acknowledge what they don't know and actively seek to fill those gaps. Your previous experience is valuable, but it's a starting point, not the finish line." },
  ],

  /* ═══ GENERIC FALLBACK — used for Sales, Apple, CX modules ═══ */

  "m1": [
    { speaker: "Alex Rivera", role: "Host, Sales Training Lead", text: "Welcome to our deep dive on the LAER objection handling framework. Today I'm joined by Taylor Simmons, our top-performing enterprise AE." },
    { speaker: "Taylor Simmons", role: "Enterprise Account Executive", text: "Thanks Alex! LAER changed my approach completely. It stands for Listen, Acknowledge, Explore, and Respond — and the order matters." },
    { speaker: "Alex Rivera", role: "Host", text: "Walk us through each step with a real example." },
    { speaker: "Taylor Simmons", role: "Enterprise AE", text: "Sure. A prospect says 'Your product is too expensive.' Step one, Listen — let them finish, don't interrupt. Step two, Acknowledge — 'I completely understand that budget is a key consideration.' Step three, Explore — 'Can you help me understand what you're comparing us against, and what ROI you need to justify the investment?' Step four, Respond — now you address it with tailored value." },
    { speaker: "Alex Rivera", role: "Host", text: "What's the most common mistake people make?" },
    { speaker: "Taylor Simmons", role: "Enterprise AE", text: "Jumping straight to Respond. They hear the objection and immediately start defending. But if you haven't Explored the real concern, you're solving the wrong problem. Often the stated objection isn't the real one." },
  ],

  "m2": [
    { speaker: "Alex Rivera", role: "Host", text: "Advanced reframing techniques — how to help customers see their situation differently. Taylor, what's your favourite reframing technique?" },
    { speaker: "Taylor Simmons", role: "Enterprise AE", text: "The 'total cost of inaction' reframe. Instead of defending your price, you help the prospect calculate what it costs them NOT to solve their problem. Suddenly your product isn't an expense — it's an investment against a much larger cost." },
    { speaker: "Alex Rivera", role: "Host", text: "Other techniques?" },
    { speaker: "Taylor Simmons", role: "Enterprise AE", text: "The 'peer perspective' reframe — sharing how similar companies approached the same decision. The 'timeline reframe' — shifting from short-term cost to long-term value. And the 'risk reframe' — what happens if they choose wrong? Each one shifts the frame of reference in a way that naturally positions your solution." },
  ],
};

/**
 * Utility: get podcast transcript for a module, falling back via alias chains.
 */
export function getPodcastTranscript(moduleId: string): PodcastScript | null {
  // Direct match
  if (podcastTranscripts[moduleId]) return podcastTranscripts[moduleId];

  // Common alias mappings
  const aliases: Record<string, string> = {
    "m-rb-intro-heritage": "m-rb-intro-heritage",
    "RAT-INTRO-001": "m-rb-intro-heritage",
    "RAT-INTRO-LM-001": "m-rb-intro-heritage",
    "m-rb-intro-invest": "m-rb-intro-invest",
    "RAT-INTRO-002": "m-rb-intro-invest",
    "RAT-INTRO-LM-002": "m-rb-intro-invest",
    "m-rb-intro-90days": "m-rb-intro-90days",
    "RAT-INTRO-003": "m-rb-intro-90days",
    "RAT-INTRO-LM-003": "m-rb-intro-90days",
    "RAT-LM-001": "RAT-LM-001",
    "RAT-LM-002": "RAT-LM-002",
    "RAT-LM-003": "RAT-LM-003",
    "RAT-LM-004": "RAT-LM-004",
    "RAT-LM-005": "RAT-LM-005",
    "RAT-LM-006": "RAT-LM-006",
    "RAT-LM-007": "RAT-LM-007",
    "RAT-LM-008": "RAT-LM-008",
    "RAT-LM-009": "RAT-LM-009",
    "RAT-LM-010": "RAT-LM-010",
    "RAT-BR-001": "RAT-BR-001",
    "RAT-BR-LM-001": "RAT-BR-001",
    "RAT-BR-002": "RAT-BR-002",
    "RAT-BR-LM-002": "RAT-BR-002",
    "RAT-BR-003": "RAT-BR-003",
    "RAT-BR-LM-003": "RAT-BR-003",
    "RAT-BR-LM-004": "RAT-BR-LM-004",
    "m-rb1": "m-rb1",
    "m-rb2": "m-rb2",
    "m-rb3": "m-rb3",
    "m-rb4": "m-rb4",
    "m-rb5": "m-rb5",
    "m-rb6": "m-rb6",
    "m-rb7": "m-rb7",
  };

  const canonical = aliases[moduleId];
  if (canonical && podcastTranscripts[canonical]) return podcastTranscripts[canonical];

  return null;
}
