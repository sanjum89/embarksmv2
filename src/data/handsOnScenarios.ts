/**
 * Hands-on mode scenario-based QnA for each module.
 * Each module has 2-3 decision-point scenarios with feedback.
 */

export interface ScenarioOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface Scenario {
  title: string;
  context: string;
  options: ScenarioOption[];
}

export interface ModuleHandsOn {
  intro: string;
  scenarios: Scenario[];
  rolePlayIds: string[]; // IDs linking to mockRolePlayBank entries
}

export const handsOnScenarios: Record<string, ModuleHandsOn> = {
  /* ═══ RATHBONES INTRO ═══ */

  "m-rb-intro-heritage": {
    intro: "Test your understanding of Rathbones' heritage and how our values guide everyday decisions.",
    scenarios: [
      {
        title: "Client First Impressions",
        context: "A prospective HNW client asks what makes Rathbones different from a large bank's wealth management division. How do you respond?",
        options: [
          { text: "Emphasise the firm's 280+ year heritage of independent, client-focused stewardship", correct: true, feedback: "Correct! Our heritage of independence, bespoke service, and client-centricity is our key differentiator against bank-owned wealth managers." },
          { text: "Focus primarily on recent investment performance numbers", correct: false, feedback: "Performance matters, but it's not our primary differentiator. Our heritage, independence, and bespoke approach are what truly set us apart." },
          { text: "Offer to match any competitor's fee structure", correct: false, feedback: "Competing on price alone undermines our value proposition. We differentiate through quality of service and personalisation, not fees." },
          { text: "Suggest they compare online reviews of different firms", correct: false, feedback: "While reviews can be helpful, a direct conversation about our values and approach is far more impactful for a prospective client." },
        ],
      },
      {
        title: "Ethical Dilemma",
        context: "A colleague suggests cutting corners on KYC documentation to onboard a lucrative client faster. What do you do?",
        options: [
          { text: "Follow the proper compliance process — integrity is a core value", correct: true, feedback: "Correct! Integrity is non-negotiable at Rathbones. Proper KYC processes protect the client, the firm, and you personally." },
          { text: "Complete the abbreviated process since the client is well-known", correct: false, feedback: "Even for well-known clients, full KYC is legally required. Shortcuts expose the firm to regulatory risk and undermine our integrity." },
          { text: "Ask the client to provide documentation later", correct: false, feedback: "Onboarding without proper documentation is a regulatory breach. All KYC must be completed before account opening." },
          { text: "Escalate to your manager before making any decision", correct: false, feedback: "While escalating concerns is good practice, the answer here is clear — follow the process. There's no ambiguity about compliance requirements." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb-heritage"],
  },

  "m-rb-intro-invest": {
    intro: "Apply your understanding of Rathbones' bespoke investment philosophy to practical client scenarios.",
    scenarios: [
      {
        title: "Portfolio Recommendation",
        context: "A new client wants to invest their entire portfolio in a single high-growth technology stock. How do you advise them?",
        options: [
          { text: "Explain the importance of diversification and propose a balanced portfolio aligned with their risk profile", correct: true, feedback: "Correct! Our bespoke approach means constructing a diversified portfolio that reflects the client's specific objectives and risk tolerance, not concentrated bets." },
          { text: "Execute the trade as the client requested", correct: false, feedback: "As a discretionary manager, we have a duty to provide suitable recommendations. A single-stock portfolio would rarely be suitable." },
          { text: "Suggest splitting between two technology stocks instead", correct: false, feedback: "Two tech stocks is still concentrated risk in one sector. True diversification requires spreading across asset classes, geographies, and sectors." },
          { text: "Decline the instruction and escalate to compliance", correct: false, feedback: "While the concern is valid, the first step is a constructive conversation about suitability and our investment approach, not immediate escalation." },
        ],
      },
      {
        title: "Model vs Bespoke",
        context: "A prospect asks why they shouldn't just use a model portfolio service that charges lower fees. What's your response?",
        options: [
          { text: "Explain that bespoke portfolios account for their unique tax situation, income needs, ethical preferences, and existing holdings — something models can't do", correct: true, feedback: "Correct! Our bespoke approach captures nuances that model portfolios miss, leading to better-aligned outcomes for the individual client." },
          { text: "Acknowledge that model portfolios are probably fine for most people", correct: false, feedback: "This undermines our value proposition. For HNW clients with complex needs, bespoke management genuinely delivers better outcomes." },
          { text: "Focus on our historical outperformance versus tracker funds", correct: false, feedback: "Performance comparisons alone don't capture the full value. The bespoke service, tax efficiency, and personalisation are equally important." },
          { text: "Suggest they try a model portfolio first and come back if unsatisfied", correct: false, feedback: "This risks losing the client entirely. Better to clearly articulate the value of our approach from the outset." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb2"],
  },

  "m-rb-intro-90days": {
    intro: "Navigate the key decisions and priorities you'll face during your first 90 days at Rathbones.",
    scenarios: [
      {
        title: "Building Your Network",
        context: "It's your second week. You've been focused on completing mandatory compliance training and getting your systems set up. A colleague suggests you should be spending more time meeting people across departments. What do you prioritise?",
        options: [
          { text: "Balance both — complete mandatory training while proactively scheduling introductory meetings across departments", correct: true, feedback: "Correct! Both are important. Mandatory training must be completed on time, but building internal relationships is equally vital for long-term success." },
          { text: "Focus exclusively on compliance training — networking can wait", correct: false, feedback: "While compliance training is mandatory, delaying relationship-building means missing early opportunities to learn and integrate." },
          { text: "Skip some training to prioritise networking", correct: false, feedback: "Compliance training is mandatory and time-sensitive. You can't skip it, but you can fit networking around it." },
          { text: "Wait for your manager to introduce you to relevant people", correct: false, feedback: "Proactive networking is expected. Don't wait — take the initiative to schedule your own introductory meetings." },
        ],
      },
      {
        title: "Client Handover",
        context: "You're taking over a client book from a departing IM. The handover notes are brief and you have questions about several clients' circumstances. What's your approach?",
        options: [
          { text: "Schedule detailed handover sessions with the departing IM, review all client files thoroughly, and prepare specific questions", correct: true, feedback: "Correct! A thorough handover is essential. Review files meticulously and use the departing IM's availability while you can." },
          { text: "Rely on the handover notes and figure out the rest as you go", correct: false, feedback: "Brief notes won't capture the full picture. You need to understand each client's circumstances, preferences, and history in detail." },
          { text: "Contact all clients immediately to introduce yourself", correct: false, feedback: "Client introductions should happen after you've properly reviewed their files. Going in unprepared damages first impressions." },
          { text: "Ask your manager to handle the clients until you feel ready", correct: false, feedback: "Ownership is a core value. You should proactively prepare yourself rather than delegating responsibility upward." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb1"],
  },

  /* ═══ RATHBONES FOUNDATIONS (m-rb1 through m-rb7) ═══ */

  "m-rb1": {
    intro: "Apply your understanding of the IM role and good client outcomes to practical situations.",
    scenarios: [
      {
        title: "Client Outcome Assessment",
        context: "During a portfolio review, you notice a client's portfolio has returned 4% while their benchmark returned 6%. The client seems happy because they expected 3%. How do you handle this?",
        options: [
          { text: "Discuss the benchmark comparison transparently while acknowledging their satisfaction, and explore whether their expectations align with their stated objectives", correct: true, feedback: "Correct! Transparency is essential even when the client is happy. Ensuring their expectations align with their actual objectives and risk profile is good practice." },
          { text: "Don't mention the benchmark since the client is satisfied", correct: false, feedback: "Withholding material information isn't transparent. Consumer Duty requires clear communication about performance in context." },
          { text: "Recommend increasing risk to close the performance gap", correct: false, feedback: "Chasing benchmark returns by increasing risk may not be suitable. The focus should be on whether the portfolio meets the client's objectives." },
          { text: "Apologise for the underperformance and promise to do better", correct: false, feedback: "4% return may be perfectly appropriate for this client's risk profile. The conversation should focus on suitability, not apology." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb1"],
  },

  "m-rb2": {
    intro: "Practice the skills needed to build and lead strong client relationships at Rathbones.",
    scenarios: [
      {
        title: "First Meeting Preparation",
        context: "You're meeting a new client for the first time — a business owner who has just sold their company for £3M. They're cautious about financial advisers after a previous bad experience. How do you prepare?",
        options: [
          { text: "Research their background, prepare thoughtful questions about their goals and concerns, and plan to listen more than talk", correct: true, feedback: "Correct! A client with a previous bad experience needs to feel heard and understood before they'll trust your recommendations." },
          { text: "Prepare a detailed presentation about Rathbones' capabilities and performance", correct: false, feedback: "A cautious client needs rapport first, not a sales pitch. Leading with listening builds trust faster than leading with credentials." },
          { text: "Bring a pre-prepared portfolio recommendation to show them what you'd suggest", correct: false, feedback: "You can't recommend a portfolio without understanding their circumstances. This approach skips the suitability process entirely." },
          { text: "Ask a colleague to join the meeting for credibility", correct: false, feedback: "While peer support can help, the client needs to build trust with you as their primary relationship manager." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb5"],
  },

  "m-rb3": {
    intro: "Test your knowledge of suitability requirements and documentation standards.",
    scenarios: [
      {
        title: "Suitability Challenge",
        context: "A 72-year-old client insists they want 80% of their portfolio in equities because they read an article about long-term equity returns. Their stated objective is capital preservation with income. How do you handle this?",
        options: [
          { text: "Explain the mismatch between their stated objectives and requested allocation, discuss risk tolerance and capacity for loss, and document the conversation thoroughly", correct: true, feedback: "Correct! There's a clear mismatch between the client's objectives and their request. You must assess suitability properly and document everything." },
          { text: "Implement the 80% equity allocation since the client requested it", correct: false, feedback: "As a discretionary manager, you have a duty to ensure recommendations are suitable. A client's request doesn't override suitability requirements." },
          { text: "Refuse the request outright and insist on your recommendation", correct: false, feedback: "While the allocation likely isn't suitable, the approach should be collaborative — educate and discuss, don't dictate." },
          { text: "Compromise with a 50% equity allocation without further discussion", correct: false, feedback: "A compromise without proper suitability assessment doesn't meet regulatory requirements. The discussion must be thorough and documented." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb4"],
  },

  "m-rb4": {
    intro: "Practice collaborating effectively with internal partners on complex client cases.",
    scenarios: [
      {
        title: "Complex Case Briefing",
        context: "A client has inherited £500k, is drawing down their pension, and wants to sell a property. You need to engage Financial Planning. How do you brief them?",
        options: [
          { text: "Prepare a structured brief covering the client's current situation, the specific questions you need answered, relevant deadlines, and your initial thinking", correct: true, feedback: "Correct! A structured brief with clear questions and context allows Financial Planning to provide targeted, useful input quickly." },
          { text: "Send a brief email saying 'Client needs some financial planning help, can you take a look?'", correct: false, feedback: "Vague briefs waste everyone's time. Financial Planning need specific context and clear questions to provide useful guidance." },
          { text: "Try to handle the financial planning aspects yourself to save time", correct: false, feedback: "Complex tax and pension situations require specialist expertise. Attempting them yourself creates risk for the client and the firm." },
          { text: "Wait until the client asks about financial planning before engaging the team", correct: false, feedback: "Proactive collaboration delivers better outcomes. The client may not know they need financial planning input — that's your job to identify." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb3"],
  },

  "m-rb5": {
    intro: "Apply your understanding of the investment process to portfolio construction decisions.",
    scenarios: [
      {
        title: "IC View Implementation",
        context: "The Investment Committee has recommended reducing equity exposure by 5% across balanced portfolios due to elevated valuations. You have a client whose mandate is 'balanced' but who specifically asked for higher equity exposure to fund their retirement in 2 years. What do you do?",
        options: [
          { text: "Review the client's specific mandate and timeline, then decide whether the IC guidance applies given their unique circumstances, documenting your rationale either way", correct: true, feedback: "Correct! The IC provides guidance, but implementation must consider each client's specific mandate and circumstances. Document your rationale." },
          { text: "Automatically apply the 5% reduction to all balanced portfolios", correct: false, feedback: "Blanket application ignores individual client circumstances. The bespoke approach requires considering each mandate individually." },
          { text: "Ignore the IC guidance for this client since they requested higher equities", correct: false, feedback: "You shouldn't ignore IC guidance entirely. You need to consider it in the context of the client's mandate and document your decision." },
          { text: "Call the client and ask them what they'd prefer", correct: false, feedback: "As a discretionary manager, this is your professional judgment to make within the agreed mandate. You should inform, not delegate the decision." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb2"],
  },

  "m-rb6": {
    intro: "Practice communicating clearly in different professional contexts.",
    scenarios: [
      {
        title: "Market Downturn Communication",
        context: "Markets have fallen 12% over two weeks. You need to communicate with your client base. What's your approach?",
        options: [
          { text: "Send a proactive, personalised communication that acknowledges concerns, provides market context, explains your portfolio positioning, and reaffirms the long-term strategy", correct: true, feedback: "Correct! Proactive, contextual communication during volatile periods builds trust. Silence erodes it." },
          { text: "Wait for clients to contact you — no point causing panic", correct: false, feedback: "Silence during market turmoil is interpreted as indifference. Proactive communication is expected and valued." },
          { text: "Send a generic market commentary from the research team", correct: false, feedback: "While research commentary is useful context, clients expect a personal message from their IM about their specific portfolio." },
          { text: "Focus only on the clients who are likely to complain", correct: false, feedback: "All clients deserve communication during significant market events, not just the squeaky wheels. This is core to client-centricity." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb4"],
  },

  "m-rb7": {
    intro: "Navigate situations that test your professional integrity and ownership.",
    scenarios: [
      {
        title: "Trade Error",
        context: "You realise you've accidentally bought £50,000 of the wrong stock for a client. The stock has fallen 2% since the trade. What do you do?",
        options: [
          { text: "Report the error immediately through the proper channels, arrange for correction, and inform the client transparently", correct: true, feedback: "Correct! Immediate reporting, correction, and transparent client communication demonstrate integrity and ownership. Errors happen — concealment is what causes real damage." },
          { text: "Sell the incorrect stock quickly and hope the client doesn't notice", correct: false, feedback: "Concealing errors is a serious conduct breach. It damages trust if discovered and violates both regulatory requirements and our values." },
          { text: "Wait to see if the stock recovers before deciding what to do", correct: false, feedback: "Delaying compounds the error. Timely reporting is both a regulatory requirement and an ethical obligation." },
          { text: "Ask a colleague to help you fix it quietly", correct: false, feedback: "This involves another person in concealment. The proper route is formal error reporting through established channels." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb-integrity"],
  },

  /* ═══ RAT-LM-* MODULES ═══ */

  "RAT-LM-001": {
    intro: "Apply Rathbones' investment proposition to real client outcome scenarios.",
    scenarios: [
      {
        title: "Value Articulation",
        context: "A prospect asks: 'Why should I pay your fees when I can buy a Vanguard LifeStrategy fund for 0.22%?' How do you respond?",
        options: [
          { text: "Articulate the full value — bespoke portfolio construction, direct relationship, tax-efficient management, holistic financial planning access, and ongoing proactive advice", correct: true, feedback: "Correct! Our value extends far beyond investment returns. The bespoke service, tax efficiency, and holistic approach justify the fee differential." },
          { text: "Acknowledge that passive funds are cheaper and suggest a hybrid approach", correct: false, feedback: "While transparency is good, conceding without articulating value undermines the proposition. Lead with what we offer that passive can't." },
          { text: "Point to our historical outperformance versus passive benchmarks", correct: false, feedback: "Past performance isn't guaranteed and may not always favour active management. The value proposition is broader than returns alone." },
          { text: "Explain that our fees are competitive within the wealth management sector", correct: false, feedback: "Competing on relative cost avoids the real question. The prospect wants to understand what value they receive for the fee." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb4"],
  },

  "RAT-LM-002": {
    intro: "Practice suitability assessment and risk profiling in realistic scenarios.",
    scenarios: [
      {
        title: "Risk Profile Mismatch",
        context: "During a review, a client mentions they've been losing sleep over portfolio volatility, despite having agreed to a 'balanced' risk profile six months ago. What's your approach?",
        options: [
          { text: "Revisit the risk profiling process — their risk tolerance may have changed or wasn't accurately captured initially. Adjust the mandate if needed and document the reassessment", correct: true, feedback: "Correct! Risk tolerance can change, and behavioural signals like sleep loss indicate a genuine issue. Reassessment is appropriate and required." },
          { text: "Reassure them that balanced portfolios experience normal volatility and it will pass", correct: false, feedback: "While factually true, dismissing their emotional reaction doesn't address the underlying suitability concern." },
          { text: "Immediately reduce equity exposure without reassessing the risk profile formally", correct: false, feedback: "Any portfolio change should follow a formal reassessment of suitability, not a knee-jerk reaction." },
          { text: "Suggest they stop checking their portfolio so frequently", correct: false, feedback: "This dismisses a legitimate concern. The client's discomfort is a signal that suitability may need review." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb4"],
  },

  "RAT-LM-003": {
    intro: "Apply portfolio construction principles to practical allocation decisions.",
    scenarios: [
      {
        title: "Concentrated Position",
        context: "A new client brings a portfolio that is 45% invested in a single FTSE 100 stock — shares they received as a retirement gift from their former employer. They have an emotional attachment to the holding. How do you approach this?",
        options: [
          { text: "Acknowledge the emotional significance, explain the concentration risk clearly, and propose a phased diversification plan that respects their attachment while improving risk management", correct: true, feedback: "Correct! Respecting the client's attachment while professionally advising on concentration risk is the ideal balance. A phased approach is often more palatable." },
          { text: "Recommend selling the entire position immediately and reinvesting", correct: false, feedback: "While diversification is important, an abrupt sale ignores the client's emotional attachment and may also have tax implications." },
          { text: "Leave the position as is since the client is comfortable with it", correct: false, feedback: "As a professional adviser, you have a duty to flag concentration risk even when the client is comfortable. Ignoring it is a suitability failure." },
          { text: "Hedge the position with options to manage the risk", correct: false, feedback: "Options hedging adds complexity and cost. For most clients, phased diversification is simpler, more cost-effective, and easier to understand." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb2"],
  },

  "RAT-LM-004": {
    intro: "Practice client communication and relationship management in challenging situations.",
    scenarios: [
      {
        title: "Client Who Wants to Time the Market",
        context: "Your client calls after seeing negative headlines and wants to sell all equities and move to cash. They say: 'I'd rather miss the upside than lose everything.' How do you handle this?",
        options: [
          { text: "Acknowledge their anxiety, review their long-term objectives, use historical data to show the cost of market timing, and recommend staying the course within their risk mandate", correct: true, feedback: "Correct! Empathy first, then education with data. Market timing consistently fails, and the long-term plan should anchor the conversation." },
          { text: "Execute the instruction immediately — it's their money", correct: false, feedback: "While we respect client wishes, as discretionary managers we should first provide our professional view. Executing without discussion may not be in their best interest." },
          { text: "Tell them they're wrong and that selling now would be a mistake", correct: false, feedback: "Being blunt without empathy damages the relationship. You may be right, but the delivery matters as much as the content." },
          { text: "Suggest a compromise of reducing equities by 50%", correct: false, feedback: "A compromise without proper discussion of their objectives and the data isn't a professional approach. Have the full conversation first." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb-volatility"],
  },

  "RAT-LM-005": {
    intro: "Practice effective internal collaboration on complex client cases.",
    scenarios: [
      {
        title: "Multi-Team Coordination",
        context: "A client couple is going through divorce proceedings. One spouse will retain the existing portfolio; the other needs a new portfolio. Both remain clients. How do you coordinate internally?",
        options: [
          { text: "Engage Financial Planning for tax and pension implications, Compliance for conflict management, and Portfolio Management for restructuring — with clear briefs and a single coordination timeline", correct: true, feedback: "Correct! Divorce cases require multi-team coordination. Clear briefs, proactive engagement, and a structured approach ensure the best outcome for both clients." },
          { text: "Handle the portfolio split yourself and only involve other teams if specific issues arise", correct: false, feedback: "Divorce cases have complex legal, tax, and compliance implications. Failing to proactively engage specialists creates risk." },
          { text: "Suggest one spouse move to a different firm to avoid conflict", correct: false, feedback: "We should aim to retain both clients. Proper conflict management, potentially with different IMs, allows this." },
          { text: "Wait until the divorce is finalised before making any changes", correct: false, feedback: "Proactive preparation is essential. By the time the divorce is finalised, you need plans ready to implement immediately." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb3"],
  },

  "RAT-LM-006": {
    intro: "Navigate situations involving professional standards and ethical conduct.",
    scenarios: [
      {
        title: "Gift from a Client",
        context: "A grateful client sends you a bottle of fine wine worth approximately £200 after a successful year. Your compliance policy states gifts above £100 must be declared. What do you do?",
        options: [
          { text: "Declare the gift through the proper compliance channel, thank the client warmly, and follow whatever guidance compliance provides", correct: true, feedback: "Correct! Gifts above the threshold must always be declared. This protects you, the client relationship, and the firm. It's not about refusing generosity — it's about transparency." },
          { text: "Accept it graciously — it's just a bottle of wine", correct: false, feedback: "The value exceeds the declaration threshold. Failing to declare is a compliance breach regardless of the gift's nature." },
          { text: "Return it to the client to avoid any issues", correct: false, feedback: "Returning it without following the proper process could offend the client unnecessarily. Declare first, then follow guidance." },
          { text: "Share it with the team so it's not a personal benefit", correct: false, feedback: "Sharing doesn't change the compliance requirement. The gift must be declared regardless of who ultimately benefits." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb-integrity"],
  },

  "RAT-LM-007": {
    intro: "Practice clear communication techniques with clients and colleagues.",
    scenarios: [
      {
        title: "Simplifying Complexity",
        context: "You need to explain to a client why their portfolio includes a 15% allocation to alternative investments (infrastructure funds and absolute return strategies). The client has no financial background. How do you explain it?",
        options: [
          { text: "Use a simple analogy — like building a house with different materials for different purposes — explain what each alternative does for the portfolio (income, stability, diversification) without jargon", correct: true, feedback: "Correct! Analogies and plain language make complex concepts accessible. Focus on what the investments do for the client, not what they are technically." },
          { text: "Provide a detailed explanation of infrastructure fund structures and return profiles", correct: false, feedback: "Technical detail overwhelms clients without financial backgrounds. Focus on outcomes and purpose, not mechanics." },
          { text: "Tell them to trust your professional judgment and not worry about the details", correct: false, feedback: "Consumer Duty requires clients to understand what they're invested in. 'Just trust me' isn't acceptable." },
          { text: "Send them the Investment Committee's research note on alternatives", correct: false, feedback: "IC research is written for investment professionals. A client with no financial background needs a translated, personal explanation." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb4"],
  },

  "RAT-LM-008": {
    intro: "Practice documenting investment decisions with proper rationale.",
    scenarios: [
      {
        title: "Documentation Under Pressure",
        context: "Markets are moving fast and you've made three tactical trades across different client portfolios this morning. It's now lunchtime and you haven't documented any of them yet. A colleague asks if you want to grab lunch. What do you do?",
        options: [
          { text: "Document all three trades first — contemporaneous documentation is essential, and memories fade quickly", correct: true, feedback: "Correct! Documentation must be contemporaneous to be credible. Three undocumented trades is a compliance risk that grows with every passing hour." },
          { text: "Go to lunch and document them afterwards — you'll remember", correct: false, feedback: "Memories are less reliable than you think, especially under pressure. Delayed documentation risks inaccuracies and is a compliance concern." },
          { text: "Write brief notes now and flesh them out later in the week", correct: false, feedback: "Brief notes are better than nothing, but the rationale and context should be captured fully while fresh. Fleshing out later often doesn't happen." },
          { text: "The trades were straightforward so minimal documentation is fine", correct: false, feedback: "All investment decisions require proper documentation regardless of complexity. 'Straightforward' is subjective and doesn't reduce the regulatory requirement." },
        ],
      },
    ],
    rolePlayIds: [],
  },

  "RAT-LM-009": {
    intro: "Handle fee discussions and value articulation with confidence.",
    scenarios: [
      {
        title: "Fee Challenge at Review",
        context: "During an annual review, a long-standing client says: 'I've been reading about robo-advisers. They charge 0.25%. You charge nearly 1%. Am I getting four times the value?' How do you respond?",
        options: [
          { text: "Acknowledge the fair question, then walk through the specific value they receive — bespoke construction, tax-efficient rebalancing, proactive advice, financial planning access, and the direct personal relationship", correct: true, feedback: "Correct! Acknowledge, don't deflect. Then articulate the specific value dimensions that robo-advisers simply cannot provide." },
          { text: "Explain that you get what you pay for in wealth management", correct: false, feedback: "This sounds dismissive. The client deserves a specific, evidence-based answer about what value they're receiving." },
          { text: "Offer to reduce your fees to be more competitive", correct: false, feedback: "Reducing fees without articulating value undermines the proposition. If the value is genuinely there, explain it confidently." },
          { text: "Suggest they try a robo-adviser for a portion of their wealth and compare", correct: false, feedback: "While not inherently wrong, this risks the client discovering they prefer the lower cost for a portion of their assets, reducing your AUM." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb4"],
  },

  "RAT-LM-010": {
    intro: "Practice handling market volatility conversations with anxious clients.",
    scenarios: [
      {
        title: "Panic Call During Market Crash",
        context: "Markets have dropped 15% in a week. A nervous client calls demanding you sell everything immediately. They say: 'I can't afford to lose any more. Sell everything now.' What's your approach?",
        options: [
          { text: "Acknowledge their fear, let them express their anxiety fully, then calmly review their long-term objectives, show historical recovery data, and advise against panic selling — while making clear you'll implement their wishes if they insist after full discussion", correct: true, feedback: "Correct! Empathy first, education second. Show that selling locks in losses, that markets historically recover, and that their long-term plan accounts for volatility. But respect their autonomy." },
          { text: "Immediately sell everything as instructed — it's their portfolio", correct: false, feedback: "While we respect client wishes, as discretionary managers we owe them our professional view first. Executing without discussion isn't good advice." },
          { text: "Tell them to stop panicking and that the market will recover", correct: false, feedback: "Dismissing their very real anxiety damages trust. They need empathy and data, not dismissal." },
          { text: "Suggest doubling down and buying more equities at lower prices", correct: false, feedback: "While 'buying the dip' can be sound, it's tone-deaf when a client is expressing genuine distress. Address their anxiety before discussing opportunities." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb-volatility"],
  },

  /* ═══ BRIDGE MODULES ═══ */

  "RAT-BR-001": {
    intro: "Navigate the transition from financial services to wealth management.",
    scenarios: [
      {
        title: "Vocabulary Translation",
        context: "In a team meeting, a colleague refers to a client's 'mandate' and 'capacity for loss.' You recognise these as wealth management-specific terms. From your banking background, what's the closest equivalent understanding?",
        options: [
          { text: "A 'mandate' is the agreed scope for managing the portfolio (similar to terms of engagement), and 'capacity for loss' is how much the client can afford to lose without impacting their lifestyle", correct: true, feedback: "Correct! Understanding these terms precisely is essential. A mandate isn't just a contract — it defines what you're authorised to do with the client's money." },
          { text: "A 'mandate' is like a credit limit and 'capacity for loss' is their credit score", correct: false, feedback: "These banking analogies are misleading. Wealth management terminology has specific regulatory meaning that's different from banking concepts." },
          { text: "These terms are interchangeable with banking equivalents", correct: false, feedback: "While there are parallels, the specific meanings in wealth management are distinct and carry regulatory weight. Precision matters." },
          { text: "You should ask the colleague to explain after the meeting", correct: false, feedback: "Asking is always fine, but as a domain-bridge joiner you should be building this vocabulary proactively through study, not just reactively." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb1"],
  },

  "RAT-BR-002": {
    intro: "Apply Rathbones' investment approach from a domain-bridge perspective.",
    scenarios: [
      {
        title: "Bespoke vs Product Distribution",
        context: "A former IFA colleague asks: 'Isn't wealth management just selling the same funds through a more expensive wrapper?' How do you explain the difference?",
        options: [
          { text: "Explain that we don't distribute products — we construct bespoke portfolios from individual securities and selected funds, tailored to each client's unique circumstances, managed discretionarily", correct: true, feedback: "Correct! The fundamental difference is bespoke construction versus product distribution. Each portfolio is unique to the client." },
          { text: "Agree that the underlying investments are often similar but the service is better", correct: false, feedback: "The investments themselves may differ significantly. Bespoke portfolios use individual securities, not just funds, and the construction process is fundamentally different." },
          { text: "Acknowledge the criticism and suggest the industry needs to change", correct: false, feedback: "The criticism is based on a misunderstanding. Bespoke wealth management is genuinely different from product distribution." },
          { text: "Focus on the higher returns that active management can deliver", correct: false, feedback: "Returns alone don't capture the difference. The bespoke approach, personal relationship, and holistic service are equally important differentiators." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb5"],
  },

  "RAT-BR-003": {
    intro: "Translate your previous experience into effective wealth management conversations.",
    scenarios: [
      {
        title: "Leveraging Banking Experience",
        context: "A client asks about the impact of rising interest rates on their bond holdings. Drawing on your banking background, how do you explain it?",
        options: [
          { text: "Use your understanding of rates from banking to explain simply: when rates rise, existing bond prices fall because new bonds offer better yields — then relate this to their portfolio's duration and how you're managing it", correct: true, feedback: "Correct! Your banking knowledge of interest rates gives you a strong foundation. Translate it into client-friendly language and connect it to their specific portfolio." },
          { text: "Provide a technical explanation using banking jargon like 'yield curves' and 'duration matching'", correct: false, feedback: "Banking jargon won't resonate with most wealth management clients. Translate your knowledge into plain language." },
          { text: "Direct them to the Investment Committee's latest research note on fixed income", correct: false, feedback: "While useful as supplementary reading, the client expects their IM to explain it personally and in context of their portfolio." },
          { text: "Admit this is outside your area of expertise and promise to follow up", correct: false, feedback: "Interest rates and bonds are fundamental to wealth management. Your banking background should actually make this easier to explain, not harder." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb1"],
  },

  "RAT-BR-LM-004": {
    intro: "Understand the gap between adjacent financial experience and IM expectations.",
    scenarios: [
      {
        title: "Recognising Your Gaps",
        context: "In your third week, a client asks you about the implications of the latest Investment Committee positioning change on their specific portfolio. You understand the IC note but aren't sure how to apply it to this particular mandate. What do you do?",
        options: [
          { text: "Be honest with the client that you want to consider it carefully, consult with an experienced colleague, and follow up with a thorough, considered response", correct: true, feedback: "Correct! Honesty about needing time to give a proper answer is far better than guessing. Seeking guidance from experienced colleagues is exactly what the domain-bridge programme is for." },
          { text: "Improvise an answer based on your general understanding", correct: false, feedback: "Improvising investment advice is risky. If you're unsure about a specific application, take the time to get it right." },
          { text: "Tell the client the IC change doesn't affect their portfolio", correct: false, feedback: "Without properly assessing the impact, you don't know this. Making unfounded assertions is a suitability and conduct risk." },
          { text: "Change the subject to something you're more comfortable discussing", correct: false, feedback: "Avoiding the question damages credibility. It's far better to acknowledge and follow up properly." },
        ],
      },
    ],
    rolePlayIds: ["rp-rb1"],
  },
};

/**
 * Utility: get hands-on scenarios for a module, with alias resolution.
 */
export function getHandsOnScenarios(moduleId: string): ModuleHandsOn | null {
  if (handsOnScenarios[moduleId]) return handsOnScenarios[moduleId];

  const aliases: Record<string, string> = {
    "RAT-INTRO-001": "m-rb-intro-heritage",
    "RAT-INTRO-LM-001": "m-rb-intro-heritage",
    "RAT-INTRO-002": "m-rb-intro-invest",
    "RAT-INTRO-LM-002": "m-rb-intro-invest",
    "RAT-INTRO-003": "m-rb-intro-90days",
    "RAT-INTRO-LM-003": "m-rb-intro-90days",
    "m-rb-intro-heritage": "m-rb-intro-heritage",
    "m-rb-intro-invest": "m-rb-intro-invest",
    "m-rb-intro-90days": "m-rb-intro-90days",
    "RAT-BR-LM-001": "RAT-BR-001",
    "RAT-BR-LM-002": "RAT-BR-002",
    "RAT-BR-LM-003": "RAT-BR-003",
  };

  const canonical = aliases[moduleId];
  if (canonical && handsOnScenarios[canonical]) return handsOnScenarios[canonical];

  return null;
}
