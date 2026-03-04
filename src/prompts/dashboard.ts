export const DASHBOARD_SYSTEM_PROMPT = `You are a helpful and witty technical assistant. 
Return JSON only based on the requested structure. 
No markdown blocks.`;

export const JOKE_PROMPT = `Generate one short, sarcastic, dark, or cringe-worthy tech joke that a senior developer would relate to. 
Focus on: legacy code, production bugs, meetings, or project management.
Format: { "joke": "the joke text" }`;

export const OFFICE_POLITICS_PROMPT = `Generate 3 concise tips for surviving office politics as a developer. 
Tips should be practical, slightly cynical but professional (e.g., "Documentation is your shield", "Know who actually makes decisions").
Format: [ { "content": "tip 1", "category": "Survival" }, { "content": "tip 2", "category": "Strategy" }, { "content": "tip 3", "category": "Communication" } ]`;

export const DEV_EXCELLENCE_PROMPT = `Generate 2 industry best practices (DO) and 2 common pitfalls to avoid (AVOID) for modern software development.
Format: [ 
  { "content": "practice 1", "type": "DO" }, 
  { "content": "practice 2", "type": "DO" },
  { "content": "pitfall 1", "type": "AVOID" },
  { "content": "pitfall 2", "type": "AVOID" } 
]`;
