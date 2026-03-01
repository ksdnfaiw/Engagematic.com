import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

// Gemini 2.0 Flash (available in current API). Override with GEMINI_MODEL in .env.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash-lite";

function maskApiKey(key) {
  if (!key || key.length < 12) return "(too short to mask)";
  return key.slice(0, 8) + "..." + key.slice(-4);
}

class GoogleAIService {
  constructor() {
    // ── Multi-key rotation support ──
    // Set GOOGLE_AI_API_KEYS=key1,key2,key3 in .env for automatic rotation
    // Falls back to single GOOGLE_AI_API_KEY if GOOGLE_AI_API_KEYS is not set
    this.apiKeys = config.GOOGLE_AI_API_KEYS || [];
    if (this.apiKeys.length === 0) {
      throw new Error(
        "No Google AI API keys configured. Set GOOGLE_AI_API_KEY (or GOOGLE_AI_API_KEYS=key1,key2,...) in your .env\n" +
        "Get a free key at https://aistudio.google.com/apikey"
      );
    }

    this.currentKeyIndex = 0;
    // Track which keys are temporarily exhausted (keyIndex -> expiry timestamp)
    this.exhaustedKeys = new Map();

    console.log(`[Google AI] ${this.apiKeys.length} API key(s) loaded:`);
    this.apiKeys.forEach((key, i) => {
      console.log(`  Key #${i + 1}: ${maskApiKey(key)}`);
    });

    // Initialize with the first key
    this._initModels(this.apiKeys[0]);
    console.log(`[Google AI] Active key: #1 (${maskApiKey(this.apiKeys[0])})`);
    console.log(`[Google AI] Models: primary=${GEMINI_MODEL}, fallback=${GEMINI_FALLBACK_MODEL}`);
  }

  _initModels(apiKey) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });
    this.fallbackModel = this.genAI.getGenerativeModel({ model: GEMINI_FALLBACK_MODEL });
  }

  /**
   * Rotate to the next available API key.
   * Returns true if a fresh key was found, false if all keys are exhausted.
   */
  _rotateKey() {
    const now = Date.now();

    // Clean up expired exhaustion entries (keys that should be available again)
    for (const [idx, expiresAt] of this.exhaustedKeys) {
      if (now >= expiresAt) {
        this.exhaustedKeys.delete(idx);
      }
    }

    // Mark current key as exhausted for 60 seconds
    this.exhaustedKeys.set(this.currentKeyIndex, now + 60_000);

    // Find the next available key
    for (let i = 1; i <= this.apiKeys.length; i++) {
      const nextIdx = (this.currentKeyIndex + i) % this.apiKeys.length;
      if (!this.exhaustedKeys.has(nextIdx)) {
        this.currentKeyIndex = nextIdx;
        this._initModels(this.apiKeys[nextIdx]);
        console.log(`🔄 Rotated to API key #${nextIdx + 1} (${maskApiKey(this.apiKeys[nextIdx])})`);
        return true;
      }
    }

    console.error("❌ All API keys are exhausted. No keys available to rotate to.");
    return false;
  }

  _isModelNotFound(err) {
    const msg = err?.message || "";
    return msg.includes("404") || msg.includes("not found") || msg.includes("is not supported");
  }

  _isRateLimitError(err) {
    const msg = String(err?.message || "");
    return (
      err?.response?.status === 429 ||
      msg.includes("429") ||
      /quota|rate limit|resource exhausted|too many requests/i.test(msg)
    );
  }

  _isLeakedOrRevokedKeyError(err) {
    const msg = String(err?.message || "");
    return (
      err?.response?.status === 403 ||
      msg.includes("403") ||
      /leaked|revoked|invalid.*api.*key|api.*key.*invalid/i.test(msg)
    );
  }

  _isRotatableError(err) {
    return this._isRateLimitError(err) || this._isLeakedOrRevokedKeyError(err);
  }

  _isQuotaZeroError(err) {
    const msg = String(err?.message || "");
    return msg.includes("limit: 0") || msg.includes("limit:0");
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async _generateWithFallback(requestOptions, preferLiteFirst = false) {
    const maxRetries = 3;
    const baseDelayMs = 2000;
    // Track how many full key rotations we've attempted
    let keyRotationAttempts = 0;
    const maxKeyRotations = this.apiKeys.length;

    const tryModel = async (modelInstance, modelName) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await modelInstance.generateContent(requestOptions);
          return { result, model: modelName };
        } catch (err) {
          const isRetryable = this._isRateLimitError(err) || err?.response?.status === 503;

          // If key is leaked/revoked (403), skip retries and rotate immediately
          if (this._isLeakedOrRevokedKeyError(err) && this.apiKeys.length > 1) {
            console.warn(`⚠️ Key #${this.currentKeyIndex + 1} leaked/revoked (403), rotating immediately...`);
            throw err;
          }

          // If quota is completely zero, don't waste time retrying - rotate key immediately
          if (this._isQuotaZeroError(err) && this.apiKeys.length > 1) {
            console.warn(`⚠️ Key #${this.currentKeyIndex + 1} quota=0, rotating immediately...`);
            throw err;
          }

          if (isRetryable && attempt < maxRetries) {
            const delayMs = baseDelayMs * Math.pow(2, attempt);
            console.warn(
              `⚠️ AI rate limit/overload (${modelName}), retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`
            );
            await this._delay(delayMs);
            continue;
          }
          throw err;
        }
      }
    };

    const tryWithCurrentKey = async () => {
      const tryPrimaryThenFallback = async () => {
        try {
          return await tryModel(this.model, GEMINI_MODEL);
        } catch (err) {
          // For leaked/revoked keys, both models share the same key — bubble up to rotate
          if (this._isLeakedOrRevokedKeyError(err)) throw err;
          if (this._isModelNotFound(err)) {
            console.warn("⚠️ Primary model unavailable, trying fallback:", GEMINI_FALLBACK_MODEL);
            return await tryModel(this.fallbackModel, GEMINI_FALLBACK_MODEL);
          }
          if (this._isRateLimitError(err)) {
            console.warn("⚠️ Primary model rate limited, trying fallback:", GEMINI_FALLBACK_MODEL);
            return await tryModel(this.fallbackModel, GEMINI_FALLBACK_MODEL);
          }
          throw err;
        }
      };

      const tryLiteThenPrimary = async () => {
        try {
          return await tryModel(this.fallbackModel, GEMINI_FALLBACK_MODEL);
        } catch (err) {
          // For leaked/revoked keys, both models share the same key — bubble up to rotate
          if (this._isLeakedOrRevokedKeyError(err)) throw err;
          if (this._isRateLimitError(err)) {
            console.warn("⚠️ Lite model rate limited, trying primary:", GEMINI_MODEL);
            return await tryModel(this.model, GEMINI_MODEL);
          }
          throw err;
        }
      };

      return preferLiteFirst ? tryLiteThenPrimary() : tryPrimaryThenFallback();
    };

    // Main loop: try current key, rotate on quota exhaustion or leaked key
    while (keyRotationAttempts <= maxKeyRotations) {
      try {
        return await tryWithCurrentKey();
      } catch (err) {
        if (this._isRotatableError(err) && keyRotationAttempts < maxKeyRotations) {
          const rotated = this._rotateKey();
          if (rotated) {
            keyRotationAttempts++;
            const reason = this._isLeakedOrRevokedKeyError(err) ? "leaked/revoked" : "rate limited";
            console.log(`🔄 Key rotation attempt ${keyRotationAttempts}/${maxKeyRotations} (${reason}), trying next key...`);
            continue;
          }
        }
        throw err;
      }
    }
  }

  /**
   * Safely get text from Gemini response. Throws with a clear message if blocked or empty.
   */
  _getResponseText(result) {
    const response = result.response;
    if (!response) {
      throw new Error("No response from AI");
    }
    const candidate = response.candidates?.[0];
    const promptFeedback = response.promptFeedback;
    if (promptFeedback?.blockReason) {
      throw new Error(
        `Prompt was blocked (${promptFeedback.blockReason}). Try rephrasing your input.`
      );
    }
    if (!candidate?.content?.parts?.length) {
      const reason = candidate?.finishReason || "unknown";
      throw new Error(
        `AI response was blocked or empty (finishReason: ${reason}). Please try again.`
      );
    }
    try {
      return response.text();
    } catch (e) {
      throw new Error(
        "AI returned no usable text. The response may have been blocked. Please try again."
      );
    }
  }

  async generatePost(
    topic,
    hook,
    persona,
    linkedinInsights = null,
    profileInsights = null,
    userProfile = null,
    postFormatting = "plain",
    trainingPosts = [],
    options = {}
  ) {
    const preferLiteFirst = !!options.preferLiteFirst;
    try {
      console.log("🤖 Generating post with Google AI...");
      console.log("Topic:", topic);
      console.log("Hook:", hook);
      console.log("Persona:", persona.name);
      console.log("Formatting:", postFormatting);
      console.log("Training posts:", trainingPosts.length);
      if (linkedinInsights) {
        console.log(
          "LinkedIn Insights:",
          linkedinInsights.industry,
          linkedinInsights.experienceLevel
        );
      }
      if (userProfile) {
        console.log("👤 User Profile:", userProfile);
      }
      const aiVoice = options.aiVoice || null;
      if (aiVoice) {
        console.log("🎙️ AI Voice:", aiVoice.tone, aiVoice.boldness, aiVoice.emojiPreference);
      }

      const prompt = this.buildPostPrompt(
        topic,
        hook,
        persona,
        linkedinInsights,
        profileInsights,
        userProfile,
        postFormatting,
        trainingPosts,
        aiVoice
      );

      const maxOutputTokens = options.maxOutputTokens ?? 2048;
      const { result } = await this._generateWithFallback(
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens,
          },
        },
        preferLiteFirst
      );

      console.log("✅ Google AI response received");
      const generatedText = this._getResponseText(result);
      const engagementScore = this.calculateEngagementScore(generatedText);
      const tokensUsed = result.response?.usageMetadata?.totalTokenCount || 150;

      console.log(
        "✅ Post generated successfully, length:",
        generatedText.length
      );

      return {
        content: generatedText,
        engagementScore,
        tokensUsed,
      };
    } catch (error) {
      console.error("❌ Google AI API Error:", {
        message: error.message,
        apiKey: this.apiKey ? "Set" : "Missing",
      });
      let hint = "";
      if (/403|404|leaked|revoked|not found|invalid/i.test(error.message)) {
        hint = " Create a new API key at https://aistudio.google.com/apikey and set GOOGLE_AI_API_KEY in backend/.env";
      } else if (/429|quota|rate limit|limit: 0/i.test(error.message)) {
        hint = this.apiKeys.length > 1
          ? " All API keys exhausted. Add more keys to GOOGLE_AI_API_KEYS in .env (create at https://aistudio.google.com/apikey with different Google accounts)"
          : " Gemini API quota exhausted. Add more API keys: set GOOGLE_AI_API_KEYS=key1,key2,key3 in .env (create keys with different Google accounts at https://aistudio.google.com/apikey)";
      }
      throw new Error("Failed to generate post content: " + error.message + hint);
    }
  }

  /**
   * Generate post from Content Planner context only (no persona).
   * Uses only the plan's audience, helpWith, platforms, promotion, goal.
   */
  async generatePostFromPlanContext(topic, hook, planContext) {
    try {
      const { audience, helpWith, platforms = [], promotion, goal } = planContext || {};
      const platformList = platforms.join(", ") || "LinkedIn";
      const prompt = this.buildPostPromptFromPlanContext(topic, hook, {
        audience: audience || "professionals",
        helpWith: helpWith || "their goals",
        platformList,
        promotion: promotion || "",
        goal: goal || "calls",
      });

      const { result } = await this._generateWithFallback({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const generatedText = this._getResponseText(result);
      const engagementScore = this.calculateEngagementScore(generatedText);
      const tokensUsed = result.response?.usageMetadata?.totalTokenCount || 150;
      return {
        content: generatedText,
        engagementScore,
        tokensUsed,
      };
    } catch (error) {
      console.error("❌ generatePostFromPlanContext error:", error.message);
      const hint = /403|404|leaked|revoked|not found|invalid/i.test(error.message)
        ? " Create a new API key at https://aistudio.google.com/apikey and set GOOGLE_AI_API_KEY in backend/.env"
        : "";
      throw new Error("Failed to generate post from plan: " + error.message + hint);
    }
  }

  buildPostPromptFromPlanContext(topic, hook, ctx) {
    // Use dynamic format selection for plan-context posts too
    const planPersona = { industry: "", tone: "professional", experience: "" };
    const planGoal = { description: ctx.goal || "engagement", objectives: [] };
    const dynamicFormat = this.selectDynamicPostFormat(topic, planPersona, planGoal, hook);

    return `You are a LinkedIn content creator. Write ONLY based on the following content plan context. Do NOT use any other persona or voice.

CONTENT PLAN CONTEXT (use this only):
- Audience: ${ctx.audience}
- What you help them with: ${ctx.helpWith}
- Platforms: ${ctx.platformList}
${ctx.promotion ? `- Promotion/offer: ${ctx.promotion}` : ""}
- Goal for content: ${ctx.goal === "calls" ? "Book more calls / DMs" : ctx.goal === "sell" ? "Sell product/service" : "Grow followers"}

Create a viral-worthy LinkedIn post about: "${topic}"
Start with this exact hook: "${hook}"

🎨 POST FORMAT: ${dynamicFormat.name}
${dynamicFormat.instructions}

FORMATTING:
${dynamicFormat.formattingRules}

RULES:
- Tone and purpose must match the audience (${ctx.audience}) and what you help them with (${ctx.helpWith}).
- Use ONE CTA only. No persona or user profile—only the plan context above.
- 200-300 words. Natural, conversational. No corporate jargon.
- Follow the ${dynamicFormat.name} structure above — DO NOT default to a generic list format.
- Generate only the post content, no explanations.`;
  }

  async generateText(prompt, options = {}) {
    try {
      const {
        temperature = 0.8,
        maxOutputTokens = 2048,
        topK = 40,
        topP = 0.95,
      } = options;

      console.log("🤖 Generating text with Google AI...");

      const { result } = await this._generateWithFallback({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          topK,
          topP,
          maxOutputTokens,
        },
      });

      console.log("✅ Google AI response received");
      const generatedText = this._getResponseText(result);
      const tokensUsed = result.response?.usageMetadata?.totalTokenCount || 150;
      return {
        text: generatedText,
        tokensUsed,
      };
    } catch (error) {
      console.error("❌ Google AI Text Generation Error:", {
        message: error.message,
        apiKey: this.apiKey ? "Set" : "Missing",
      });
      const hint = /403|404|leaked|revoked|not found|invalid/i.test(error.message)
        ? " Create a new API key at https://aistudio.google.com/apikey and set GOOGLE_AI_API_KEY in backend/.env"
        : "";
      throw new Error(`Google AI Error: ${error.message}` + hint);
    }
  }

  async generateComment(
    postContent,
    persona,
    profileInsights = null,
    commentType = "value_add",
    aiVoice = null
  ) {
    try {
      console.log("💬 Generating comments with Google AI...");
      console.log("Post content:", postContent.substring(0, 100) + "...");
      console.log("Persona:", persona.name);
      console.log("Comment type:", commentType);
      if (aiVoice) {
        console.log("🎙️ AI Voice:", aiVoice.tone, aiVoice.emojiPreference);
      }

      const prompt = this.buildCommentPrompt(
        postContent,
        persona,
        profileInsights,
        commentType,
        aiVoice
      );

      const { result } = await this._generateWithFallback({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const generatedText = this._getResponseText(result);
      const tokensUsed = result.response?.usageMetadata?.totalTokenCount || 0;

      console.log("AI comment response received");
      console.log("Generated text length:", generatedText.length);

      const comments = this.parseGeneratedComments(generatedText);

      return {
        content: comments,
        comments,
        tokensUsed,
      };
    } catch (error) {
      console.error("Google AI API Error:", error.message);
      const hint = /403|404|leaked|revoked|not found|invalid/i.test(error.message)
        ? " Create a new API key at https://aistudio.google.com/apikey and set GOOGLE_AI_API_KEY in backend/.env"
        : "";
      throw new Error("Failed to generate comment content: " + error.message + hint);
    }
  }

  /**
   * Dynamically select a post format/structure based on topic, persona, and goal.
   * Ensures every generated post feels unique and contextually appropriate.
   */
  selectDynamicPostFormat(topic, persona, engagementGoal, hookText) {
    const t = (topic || "").toLowerCase();
    const industry = (persona.industry || "").toLowerCase();
    const tone = (persona.tone || "professional").toLowerCase();
    const experience = (persona.experience || "").toLowerCase();
    const goalDesc = (engagementGoal?.description || "").toLowerCase();

    // ── 7 distinct post formats ──
    const formats = {

      // 1. STORYTELLING — personal narrative arc
      storytelling: {
        name: "Storytelling / Personal Narrative",
        formattingStyle: "Flowing narrative with line breaks between beats",
        instructions: `
**STRUCTURE — Tell a story, don't list tips:**

1. HOOK (the exact hook provided) — drop the reader into the middle of a moment
2. SETUP (2-3 lines): Paint the scene. Where were you? What was happening? Make it vivid and specific.
3. TENSION (2-3 lines): What went wrong, what was at stake, what surprised you?
4. TURNING POINT (1-2 lines): The insight, realization, or decision that changed things.
5. RESOLUTION (2-3 lines): What happened after. Use specific results if possible.
6. TAKEAWAY (1-2 lines): The lesson — stated simply, not preachily.
7. CLOSING QUESTION: One reflective question that invites the reader to share their own story.

**KEY RULES:**
- Write in FIRST PERSON — this is YOUR story (even if fictional, make it feel lived-in)
- Use sensory details and specific moments, not abstract summaries
- Show emotion — what you felt, not just what happened
- NO numbered lists, NO bullet points, NO frameworks — this is a narrative
- Vary line lengths: short punchy lines mixed with longer descriptive ones
- Use paragraph-style blocks (2-3 sentences) separated by blank lines
`,
        formattingRules: `
- Use line breaks between story beats (not after every sentence)
- **Bold** only the turning-point insight or the single most powerful line
- No bullet points or numbered lists — pure narrative flow
- Emojis: 0-2 max, only if they enhance emotional beats
- Sentence variety: mix 4-word punches with 20-word scene-setting
`
      },

      // 2. FRAMEWORK / LIST — structured, scannable
      framework: {
        name: "Framework / Actionable List",
        formattingStyle: "Numbered or bulleted list with bold key phrases",
        instructions: `
**STRUCTURE — Deliver a clear, actionable framework:**

1. HOOK (the exact hook provided) — promise a specific result or reveal
2. CONTEXT (1-2 lines): Why this matters NOW. Anchor it to a real problem.
3. FRAMEWORK (3-7 items): Each point follows this pattern:
   → **Bold key phrase** (3-5 words) — then explain in 1 line
   → Make each point independently valuable
   → Progress logically (first do X, then Y, then Z)
4. BONUS or PRO TIP (1 line): One unexpected insight that elevates the whole list
5. CTA: One specific question or call to action

**KEY RULES:**
- Each list item must be SPECIFIC and ACTIONABLE (not vague advice)
- Use → or numbered items, NOT generic bullet points (•)
- Bold the first phrase of each item for scannability
- Keep each point to 1-2 lines max — dense value, no padding
- Give the framework a memorable NAME if possible (e.g., "The 3R Method")
`,
        formattingRules: `
- Use → or 1. 2. 3. for list items
- **Bold** the key phrase that starts each point
- Short lines — max 70 chars per line for mobile readability
- White space between items
- Emojis: 2-4 max, use as bullet markers or emphasis (🎯, →, ⚡)
`
      },

      // 3. CONTRARIAN / HOT TAKE — challenges conventional wisdom
      contrarian: {
        name: "Contrarian / Hot Take",
        formattingStyle: "Bold opening, punchy lines, debate-inviting",
        instructions: `
**STRUCTURE — Challenge a common belief:**

1. HOOK (the exact hook provided) — state the contrarian position boldly
2. THE COMMON BELIEF (1-2 lines): What most people think / do / say
3. WHY IT'S WRONG (2-3 lines): Your counter-argument with evidence or experience
4. THE ALTERNATIVE (2-3 lines): What you do instead and why it works better
5. PROOF (1-2 lines): A specific result, number, or example that backs your take
6. THE NUANCE (1 line): Acknowledge when the common advice DOES work (shows intellectual honesty)
7. DEBATE PROMPT: Ask a polarizing question — "Agree or disagree?"

**KEY RULES:**
- Take a REAL stance — don't hedge with "it depends" in the opening
- Be respectful but direct — confident, not arrogant
- Use specific examples, not hypotheticals
- The goal is to make people STOP and THINK, then comment
- Show your receipts — numbers, timelines, outcomes
- End with genuine curiosity about opposing views
`,
        formattingRules: `
- Short, punchy lines — many under 40 characters for impact
- **Bold** the contrarian claim and the proof/result
- Use line breaks generously — each statement gets its own line
- No numbered lists — this is persuasive writing, not a tutorial
- Emojis: 0-2 max (this format relies on words, not decoration)
`
      },

      // 4. BEFORE/AFTER — transformation story with data
      beforeAfter: {
        name: "Before/After Transformation",
        formattingStyle: "Clear contrast between old and new states",
        instructions: `
**STRUCTURE — Show a transformation with proof:**

1. HOOK (the exact hook provided) — hint at the transformation
2. THE "BEFORE" (2-3 lines): Paint the pain. What was broken, slow, frustrating? Use specific details.
3. THE CATALYST (1-2 lines): What triggered the change? A moment, a realization, a tool, a mentor.
4. THE "AFTER" (2-3 lines): Show the new reality. Use numbers if possible.
5. THE HOW (2-4 lines): 2-3 key changes that made the difference — brief, specific
6. THE UNEXPECTED LESSON (1-2 lines): Something surprising you learned through the process
7. INVITATION: Ask readers about their own transformation or challenge

**KEY RULES:**
- Make the contrast STARK — before should feel painful, after should feel liberating
- Use specific metrics or timelines (not "things got better" but "revenue grew 40% in 3 months")
- The catalyst should feel relatable — something anyone could experience
- Be honest about what was HARD during the transition
- This format works for personal, team, company, or industry transformations
`,
        formattingRules: `
- Use clear visual separation between BEFORE and AFTER sections
- **Bold** the key metrics and transformation moments
- Mix short emotional lines with longer descriptive ones
- You can use → for the "how" steps
- Emojis: 1-3, strategically placed (📉→📈 works well for contrast)
`
      },

      // 5. MICRO-LESSON / QUICK INSIGHT — short, dense, high-value
      microLesson: {
        name: "Micro-Lesson / Quick Insight",
        formattingStyle: "Ultra-concise, every word counts",
        instructions: `
**STRUCTURE — Deliver ONE powerful insight in minimal words:**

1. HOOK (the exact hook provided) — drop the insight immediately
2. THE INSIGHT (2-3 lines): State the core idea clearly. No buildup needed.
3. WHY IT MATTERS (1-2 lines): Connect it to a real-world outcome
4. THE EXAMPLE (2-3 lines): One vivid, specific illustration
5. THE ONE-LINER (1 line): Distill the whole post into a quotable, shareable sentence
6. MICRO-CTA: A simple, direct question or save prompt

**KEY RULES:**
- This post should be UNDER 200 words — brevity IS the point
- ONE idea only — don't try to cover multiple concepts
- The quotable one-liner should be something people screenshot and share
- Think "fortune cookie meets TED talk" — profound but accessible
- No preamble, no "let me tell you about..." — get to the point
- Every sentence must justify its existence
`,
        formattingRules: `
- Very short lines — many under 30 characters
- **Bold** only the one-liner / quotable line
- Maximum white space — let the words breathe
- No lists, no bullets — just clean, spaced lines
- Emojis: 0-1 (less is more for this format)
`
      },

      // 6. DATA-DRIVEN / ANALYTICAL — numbers tell the story
      dataDriven: {
        name: "Data-Driven Insight",
        formattingStyle: "Numbers-forward, analytical yet accessible",
        instructions: `
**STRUCTURE — Let data tell the story:**

1. HOOK (the exact hook provided) — lead with a surprising number or stat
2. THE DATA POINT (1-2 lines): Present the key finding or observation
3. THE CONTEXT (2-3 lines): Why this number matters. What does it mean for the reader?
4. THE BREAKDOWN (3-5 lines): Analyze 2-3 specific aspects or implications
5. THE COUNTERINTUITIVE ANGLE (1-2 lines): Something the data reveals that surprises people
6. THE ACTIONABLE TAKEAWAY (1-2 lines): What should the reader DO with this information?
7. DISCUSSION PROMPT: Ask readers to share their own data/experience

**KEY RULES:**
- Use SPECIFIC numbers (not "most people" but "73% of professionals")
- Numbers can be from experience, observation, or general industry knowledge
- Make data HUMAN — don't just cite stats, explain what they mean for real people
- Compare and contrast: "While X grew by 40%, Y dropped by 15%"
- Credit sources when possible (adds credibility)
- Balance analytical tone with conversational accessibility
`,
        formattingRules: `
- **Bold** all key numbers and statistics
- Use line breaks to separate data points from analysis
- → or • for breakdown items
- Short analytical lines — not academic paragraphs
- Emojis: 2-3 data-relevant ones (📊 📈 💰 🔢)
`
      },

      // 7. CONVERSATIONAL / REFLECTIVE — authentic musing
      conversational: {
        name: "Conversational Reflection",
        formattingStyle: "Casual, flowing, like thinking out loud",
        instructions: `
**STRUCTURE — Think out loud with the reader:**

1. HOOK (the exact hook provided) — start mid-thought, like you're continuing a conversation
2. THE OBSERVATION (2-3 lines): Something you noticed, experienced, or realized recently
3. THE DEEPER LAYER (2-3 lines): Peel back WHY this matters. Get philosophical or practical.
4. THE PERSONAL CONNECTION (2-3 lines): How this connects to YOUR journey. Be real.
5. THE READER MIRROR (1-2 lines): Reflect it back — "Maybe you've felt this too..."
6. THE OPEN ENDING (1-2 lines): Don't wrap it up neatly. Leave it open. Invite continued thought.

**KEY RULES:**
- Write like you're TALKING, not writing — incomplete thoughts are okay
- Use rhetorical questions throughout (not just at the end)
- Show your thinking process — "I used to think X. Now I think Y."
- Be vulnerable — uncertainty and growth are engaging
- NO definitive advice — this is an exploration, not a lecture
- Let the reader draw their own conclusion
- Contractions, casual language, even one-word lines for emphasis
`,
        formattingRules: `
- Flowing paragraphs (2-3 sentences) with line breaks between them
- NO bold — or bold only ONE phrase in the entire post
- NO lists, NO frameworks — pure conversational flow
- Varied sentence lengths: some 3 words. Some 25.
- Emojis: 0-1 (this format is about raw words)
- Can use ... or — for natural pause effects
`
      }
    };

    // ── Smart format selection based on context signals ──

    // Topic-based signals
    const isStoryTopic = /mistake|learn|fail|journey|experience|reali[sz]|moment|happened|changed|my |i was|i did|when i|years ago|looking back/i.test(t);
    const isListTopic = /tips|steps|ways|strategies|how to|methods|rules|habits|practices|framework|checklist|playbook/i.test(t);
    const isContrarianTopic = /myth|wrong|stop|don't|overrated|unpopular|truth|actually|opposite|against|controversial|hot take|disagree|lie/i.test(t);
    const isTransformTopic = /before|after|transform|result|grew|increase|improv|went from|changed|scaled|doubled|tripled|boost/i.test(t);
    const isDataTopic = /data|stat|number|percent|research|study|survey|metric|analytics|trend|report|growth|decline|benchmark/i.test(t);
    const isReflectTopic = /think|wonder|question|realize|notice|feel|believe|lately|thought|reflect|curious|observ|pattern/i.test(t);
    const isQuickTopic = /one thing|single|simple|quick|reminder|note|truth|fact|reality|secret/i.test(t);

    // Score each format
    const scores = {
      storytelling: 0,
      framework: 0,
      contrarian: 0,
      beforeAfter: 0,
      microLesson: 0,
      dataDriven: 0,
      conversational: 0,
    };

    // Topic signals (strongest weight)
    if (isStoryTopic) scores.storytelling += 4;
    if (isListTopic) scores.framework += 4;
    if (isContrarianTopic) scores.contrarian += 4;
    if (isTransformTopic) scores.beforeAfter += 4;
    if (isDataTopic) scores.dataDriven += 4;
    if (isReflectTopic) scores.conversational += 3;
    if (isQuickTopic) scores.microLesson += 3;

    // Persona tone signals
    if (/storytell|narrative|personal|authentic|vulnerable/i.test(tone)) scores.storytelling += 2;
    if (/analytical|strategic|structured|methodical/i.test(tone)) { scores.framework += 2; scores.dataDriven += 1; }
    if (/bold|provocative|direct|edgy|blunt/i.test(tone)) scores.contrarian += 2;
    if (/casual|friendly|warm|conversational|relaxed/i.test(tone)) scores.conversational += 2;
    if (/concise|minimal|crisp|sharp/i.test(tone)) scores.microLesson += 2;
    if (/inspirational|motivational|empowering/i.test(tone)) { scores.storytelling += 1; scores.beforeAfter += 1; }

    // Experience-level signals
    if (/senior|executive|director|vp|chief|lead|head/i.test(experience)) {
      scores.storytelling += 1; scores.contrarian += 1; scores.conversational += 1;
    }
    if (/entry|junior|early|new|intern/i.test(experience)) {
      scores.microLesson += 1; scores.framework += 1;
    }

    // Goal signals
    if (/thought leader|authority|brand/i.test(goalDesc)) { scores.contrarian += 1; scores.dataDriven += 1; }
    if (/engage|comment|discuss/i.test(goalDesc)) { scores.conversational += 1; scores.contrarian += 1; }
    if (/educat|teach|train/i.test(goalDesc)) { scores.framework += 2; scores.dataDriven += 1; }
    if (/inspir|motivat/i.test(goalDesc)) { scores.storytelling += 1; scores.beforeAfter += 1; }

    // Add randomness to prevent same-topic-same-format predictability
    // Use a hash of the topic to get consistent-but-varied randomness
    const topicHash = [...t].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const formatKeys = Object.keys(scores);
    // Boost 2 random formats slightly based on topic hash
    scores[formatKeys[topicHash % formatKeys.length]] += 2;
    scores[formatKeys[(topicHash * 3 + 7) % formatKeys.length]] += 1;

    // Find the format with the highest score
    let bestFormat = "framework"; // default fallback
    let bestScore = -1;
    for (const [key, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestFormat = key;
      }
    }

    console.log("🎨 Dynamic format selection:", { bestFormat, scores });
    return formats[bestFormat];
  }

  buildPostPrompt(
    topic,
    hook,
    persona,
    linkedinInsights = null,
    profileInsights = null,
    userProfile = null,
    postFormatting = "plain",
    trainingPosts = [],
    aiVoice = null
  ) {
    const hookText =
      typeof hook === "string"
        ? hook
        : (hook?.text ?? hook?.title ?? "Here's what changed everything:");
    const p = persona || {};
    let basePrompt = `You are a LinkedIn content creator with the following persona:

Name: ${p.name || "Professional"}
Industry: ${p.industry || "Business"}
Experience Level: ${p.experience || "Mid-level"}
Tone: ${p.tone || "professional"}
Writing Style: ${p.writingStyle || "clear and engaging"}
Description: ${p.description || "Thought leader sharing actionable insights"}`;

    // Add user profile for DEEP personalization with contextual relevance
    if (
      userProfile &&
      (userProfile.jobTitle || userProfile.industry || userProfile.goals)
    ) {
      // Build contextual persona description
      let personaContext = "";
      if (userProfile.jobTitle && userProfile.industry) {
        personaContext = `a ${userProfile.experience || persona.experience || "professional"} ${userProfile.jobTitle} in ${userProfile.industry}`;
      } else if (userProfile.jobTitle) {
        personaContext = `a ${userProfile.jobTitle}`;
      } else if (userProfile.industry) {
        personaContext = `a professional in ${userProfile.industry}`;
      }

      basePrompt += `

🎯 USER PROFILE CONTEXT (CRITICAL - Inject this naturally throughout the post):
**Who you're writing as**: ${personaContext || "a professional"}
${userProfile.jobTitle ? `**Current Role**: ${userProfile.jobTitle}` : ""}
${userProfile.company ? `**Company**: ${userProfile.company}` : ""}
${userProfile.industry ? `**Industry**: ${userProfile.industry} - Use industry-specific examples, pain points, and terminology` : ""}
${userProfile.experience ? `**Experience Level**: ${userProfile.experience} - Write from this perspective (${userProfile.experience.includes("entry") || userProfile.experience.includes("junior") ? "learning, growing, asking questions" : userProfile.experience.includes("senior") || userProfile.experience.includes("executive") ? "leading, mentoring, sharing wisdom" : "experienced professional sharing insights"})` : ""}
${userProfile.goals ? `**Professional Goals**: ${userProfile.goals} - Every insight should align with achieving these goals` : ""}
${
  userProfile.targetAudience
    ? `**Target Audience**: ${userProfile.targetAudience} - Write TO these people, address their specific needs`
    : ""
}
${userProfile.expertise ? `**Areas of Expertise**: ${userProfile.expertise} - Reference these naturally, don't force them` : ""}
${userProfile.usageContext ? `**Usage Context**: ${userProfile.usageContext} - Write as if this is primarily for ${userProfile.usageContext.replace(/_/g, " ")}` : ""}
${userProfile.workContext ? `**Posting For**: ${userProfile.workContext} - Choose examples that match whose profile this appears on` : ""}
${userProfile.contentFocus ? `**Content Focus**: ${userProfile.contentFocus} - Prioritize this type of content in structure and examples` : ""}

**HOW TO USE THIS CONTEXT (Make it feel authentic, not forced):**
1. **Role-specific examples**: If they're a ${userProfile.jobTitle || "professional"}, use examples from their daily work
2. **Industry context**: Reference ${userProfile.industry || "industry"}-specific challenges, trends, or opportunities
3. **Experience-appropriate voice**: ${userProfile.experience?.includes("entry") ? "Write with curiosity and eagerness to learn" : userProfile.experience?.includes("senior") ? "Write with authority and wisdom from experience" : "Write with confidence and practical insights"}
4. **Goal alignment**: Every piece of advice should help them achieve: ${userProfile.goals || "their professional goals"}
5. **Audience targeting**: Write as if speaking directly to ${userProfile.targetAudience || "their target audience"}
6. **Natural integration**: Don't list these facts - weave them into stories, examples, and insights naturally
7. **Authenticity check**: Would a real ${userProfile.jobTitle || "professional"} in ${userProfile.industry || "this field"} actually say this? If not, rewrite it.`;
    }

    // Add LinkedIn insights if available
    if (linkedinInsights) {
      basePrompt += `

LinkedIn Profile Insights:
- Industry: ${linkedinInsights.industry}
- Experience Level: ${linkedinInsights.experienceLevel}
- Content Strategy Focus: ${linkedinInsights.contentStrategy?.focus}
- Recommended Tone: ${linkedinInsights.contentStrategy?.tone}
- Content Types: ${linkedinInsights.contentStrategy?.contentTypes?.join(", ")}
- Optimal Posting Times: ${linkedinInsights.optimalPostingTimes?.bestTimes?.join(
        ", "
      )}
- Industry Hashtags: ${linkedinInsights.hashtagSuggestions?.industry?.join(
        ", "
      )}`;
    }

    // Add profile analyzer insights if available (from Profile Analyzer tool)
    if (profileInsights) {
      basePrompt += `\n\n${profileInsights}`;
    }

    // Add user's custom AI Voice & Style when set (optional) — full context used for generation
    if (aiVoice && (aiVoice.description || aiVoice.tone || aiVoice.boldness || aiVoice.emojiPreference)) {
      basePrompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎙️ USER'S PREFERRED WRITING STYLE & CONTEXT (PRIORITY — use in full)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Read and apply the user's description below for all content generation. It may include company context, audience, tone, and preferences. Use this context completely; do not ignore or summarize it. If there is a conflict between generic defaults and these settings, prefer the user's voice.
${aiVoice.description ? `- User's style & context: ${aiVoice.description}` : ""}
- Tone: ${aiVoice.tone || "neutral"}
- Boldness: ${aiVoice.boldness || "balanced"}
- Emoji usage: ${aiVoice.emojiPreference || "sometimes"}`;
    }

    // Determine engagement goal based on user profile
    const engagementGoal = this.determineEngagementGoal(userProfile, persona);

    // Dynamically select post format based on topic, persona, and goal
    const dynamicFormat = this.selectDynamicPostFormat(topic, p, engagementGoal, hookText);
    
    basePrompt += `

Create a VIRAL-WORTHY, high-engagement LinkedIn post about: "${topic}"

Start with this exact hook: "${hookText}"

🎯 ENGAGEMENT GOAL: ${engagementGoal.description}
**Your post must achieve**: ${engagementGoal.objectives.join(", ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DYNAMIC POST FORMAT: ${dynamicFormat.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${dynamicFormat.instructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 FORMATTING STYLE: ${dynamicFormat.formattingStyle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${dynamicFormat.formattingRules}

**User formatting preference: ${postFormatting}**
${postFormatting === "bold" ? 
  "- Use **bold** extensively (8-10 KEY PHRASES) for emphasis\n- Make key insights and action items stand out with bold" : 
  postFormatting === "italic" ? 
  "- Use *italics* strategically for quotes, emphasis, and subtle highlights\n- Prefer italics over bold for a refined, elegant tone" : 
  postFormatting === "emoji" ? 
  "- Use emojis liberally (5-8 total) for visual energy\n- Place emojis after impactful statements and before key insights\n- Use context-specific emojis (🎯📊💰🔥⚡💡🚀) not generic ones" : 
  "- Use **bold** for 3-5 KEY PHRASES that deserve emphasis\n- Use emojis sparingly (1-3 max) only where they add value"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 AUTHENTICITY & VOICE RULES (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Voice & Persona:**
- Write in ${p.name}'s voice (${p.tone} tone, ${p.writingStyle} style)
- Match their career stage: ${p.experience || "professional"} speaks with appropriate authority
- Reflect ${p.industry || "their"} industry context — use real pain points, jargon, and scenarios

**Natural Language:**
- NEVER use AI-sounding phrases: "delve into", "in conclusion", "furthermore", "leverage", "paradigm shift"
- Use contractions naturally (I'm, you're, it's, don't, won't)
- Sound like a REAL person sharing over coffee, not writing a report
- Vary sentence length — mix punchy 5-word lines with 15-word observations
- Use "I" for personal experience, "you" when addressing the reader directly

**Engagement Triggers (weave in 3-4 naturally):**
- Emotional resonance (frustration, excitement, hope, relief)
- Relatability ("If you've ever...", "We've all been there...")
- Specificity (exact numbers, dates, scenarios — not vague claims)
- Vulnerability (real struggles, failures, learning moments)
- Value (insights people can use TODAY)

${trainingPosts.length > 0 ? `**PERSONA TRAINING — Learn from user's writing style:**\n${trainingPosts.map((post, idx) => `Example ${idx + 1}:\n${post.content?.substring(0, 200)}...`).join('\n\n')}\n\nMATCH the tone, structure, and voice from these examples. Learn their sentence rhythm, structure preferences, and CTA style.` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FINAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Goal-Driven CTA:**
${engagementGoal.ctaStrategy}
- Use ONE CTA or ONE question only — never stack multiple asks
- Make it feel natural, not salesy

**Length:** 200-300 words. Complete the ENTIRE post — never cut off mid-sentence.
**Output:** Copy-paste ready. Preserve **bold** formatting. No hashtags unless requested.
**Quality:** Every sentence earns its place. Zero fluff. Would someone save/bookmark this?

GENERATE A POST THAT:
- Gets saved (high value), shared (relatable), commented on (invites discussion), liked (emotional)
- Looks INDISTINGUISHABLE from a top 1% LinkedIn creator
- Follows the ${dynamicFormat.name} format above — DO NOT default to a generic list format
- Requires ZERO editing — ready to post immediately`;

    if (linkedinInsights?.contentStrategy?.contentTypes) {
      basePrompt += `
9. Focus on these content types: ${linkedinInsights.contentStrategy.contentTypes.join(
        ", "
      )}`;
    }

    if (linkedinInsights?.hashtagSuggestions?.industry) {
      basePrompt += `
10. Use these industry-specific hashtags: ${linkedinInsights.hashtagSuggestions.industry.join(
        ", "
      )}`;
    }

    basePrompt += `

Generate only the post content, no additional explanations.`;

    return basePrompt;
  }

  buildCommentPrompt(
    postContent,
    persona,
    profileInsights = null,
    commentType = "value_add",
    aiVoice = null
  ) {
    // Define comment type specific instructions
    const typeInstructions = {
      personal_story:
        "Share a brief personal story or experience (15-20 words max) that directly relates to the post. Make it authentic and relatable.",
      value_add:
        "Provide a quick actionable tip, insight, or framework (15-20 words max) that adds value to the discussion. Be specific and practical.",
      question:
        "Ask a thoughtful, engaging question (15-20 words max) that encourages discussion and shows genuine interest. Reference specific points from the post.",
      insight:
        "Offer a sharp, unique perspective or observation (15-20 words max) that makes people think. Be direct and insightful.",
      experience_share:
        "Share how you've experienced or applied this concept (15-20 words max) in your professional journey. Be specific and concise.",
      enthusiastic_support:
        "Show strong agreement with specific reasoning (15-20 words max). Explain WHY you agree, citing specific aspects from the post.",
    };

    const typeExamples = {
      personal_story:
        "This! We lost 6 months because we couldn't let go of the original vision. Ego is expensive. 💯",
      value_add:
        "Love this framework. We call it 'Strategic Refinement' - same concept, same results. 🎯",
      question:
        "The 'evolving without ego' part hit hard. Been there. How do you handle pushback from stakeholders?",
      insight:
        "Spot on. Momentum needs process, not just passion. Learned this the hard way!",
      experience_share:
        "Seen this play out 100 times. The daily grind > initial hype. Every. Single. Time.",
      enthusiastic_support:
        "This is gold. The 'evolving without ego' mindset separates good teams from great ones.",
    };

    let prompt = `You are writing HIGH-ENGAGEMENT LinkedIn comments as ${persona.name} (${
      persona.tone
    } tone, ${persona.writingStyle} style).
${aiVoice && (aiVoice.description || aiVoice.tone || aiVoice.emojiPreference) ? `
USER'S PREFERRED STYLE & CONTEXT (use in full): ${aiVoice.description || "N/A"}
Tone: ${aiVoice.tone || "neutral"}. Emoji usage: ${aiVoice.emojiPreference || "sometimes"}. Apply the user's context (company, audience, etc.) fully; prefer over generic defaults.
` : ""}

POST TO COMMENT ON:
"${postContent}"

🎯 COMMENT TYPE: "${commentType}"
${typeInstructions[commentType] || typeInstructions.value_add}

🔥 ENGAGEMENT STRATEGY FOR COMMENTS:
- Comments that get the most replies are: personal, specific, and add genuine value
- Reference EXACT points from the post (not generic agreement)
- Share a micro-story or specific example (15-20 words can still tell a story)
- Ask a follow-up question if appropriate for the comment type
- Show you actually READ the post, not just skimmed it

CRITICAL COMMENT REQUIREMENTS:
1. **ULTRA SHORT**: STRICT 15-20 words MAXIMUM (count every word - this is critical!)
2. **DIRECTLY ADDRESS THE POST**: Reference specific points, quotes, or ideas from the post content
3. **BE RELATABLE**: Share a quick personal insight, experience, or "me too" moment that connects
4. **NATURAL & CONVERSATIONAL**: Write like you're texting a colleague, not writing an essay
5. **ADD VALUE**: Give a quick tip, insight, framework, or perspective - but keep it SUPER BRIEF
6. **AUTHENTIC TONE**: Use ${
      persona.tone
    } tone naturally - no corporate buzzwords, no AI-sounding phrases
7. **NO FLUFF**: Cut ALL unnecessary words - get straight to the point
8. **HUMAN-LIKE**: Use contractions (I'm, you're, it's), casual language, real emotions
9. **EMOJIS**: Use 1 emoji MAX, and ONLY if it adds emphasis or emotion (🎯💯🔥👏). Don't force it!
10. **WORD LIMIT**: If over 20 words, CUT IT DOWN. Brevity is critical for LinkedIn comments!
11. **ENGAGEMENT TRIGGER**: Make the post author WANT to reply to you
12. **SPECIFICITY**: Use exact numbers, names, or scenarios when possible (not vague)

BAD EXAMPLE (too long):
"Absolutely spot on! The greatest killer of sustained growth is a leader or team clinging too tightly to the initial perfect vision. Your emphasis on 'evolving without ego' hits the nail..."

GOOD EXAMPLE for "${commentType}" style (15-20 words):
"${typeExamples[commentType] || typeExamples.value_add}"

MORE PERFECT EXAMPLES (15-20 words each, super short, emojis optional!):
- "This! Lost 6 months clinging to our vision. Ego is expensive. 💯" (11 words, 1 emoji)
- "The 'evolving without ego' part hit hard. How do you handle stakeholder pushback?" (13 words, no emoji)
- "Love this framework. We call it 'Strategic Refinement' - same results. 🎯" (11 words, 1 emoji)
- "Spot on. Momentum needs process, not passion. Learned this the hard way!" (12 words, no emoji)
- "This is gold. Daily grind beats initial hype. Every. Single. Time." (11 words, no emoji)
- "Been there! The pivot moment is terrifying but necessary. 🔥" (10 words, 1 emoji)

Generate 3 ULTRA SHORT, crisp "${commentType}" style comments (15-20 words each - COUNT THE WORDS!):

Return ONLY JSON (each comment MUST be 15-20 words):
[
  {
    "text": "Your 15-20 word ${commentType} comment - count words, keep it super short!",
    "engagementScore": 8.5,
    "type": "${commentType}"
  },
  {
    "text": "Another ultra-short ${commentType} comment - max 20 words, direct and valuable",
    "engagementScore": 9.0,
    "type": "${commentType}"
  },
  {
    "text": "Third brief ${commentType} comment - remember 15-20 word limit strictly!",
    "engagementScore": 8.8,
    "type": "${commentType}"
  }
]

Types: personal_story, value_add, question, insight, experience_share, enthusiastic_support
Scores: 7.5-9.5 (higher for more engaging)

JSON ONLY.`;

    return prompt;
  }

  parseGeneratedComments(generatedText) {
    try {
      console.log("🔍 Parsing comments from:", generatedText?.substring(0, 300));

      if (!generatedText || typeof generatedText !== "string" || generatedText.trim().length === 0) {
        throw new Error("Empty or invalid generated text");
      }

      // Remove markdown code blocks if present
      let cleanText = generatedText
        .replace(/```json\n?/gi, "")
        .replace(/```\n?/g, "")
        .trim();

      // Try to extract JSON array from the text
      const jsonMatch = cleanText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      console.log("🧹 Cleaned text:", cleanText?.substring(0, 200));

      // Parse JSON
      let comments;
      try {
        comments = JSON.parse(cleanText);
      } catch (jsonError) {
        // Try fixing common JSON issues
        let fixedText = cleanText
          .replace(/,\s*\]/g, "]") // Remove trailing commas
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/\n/g, " ") // Remove newlines
          .replace(/\t/g, " "); // Remove tabs
        
        // Try again with fixed text
        const retryMatch = fixedText.match(/\[[\s\S]*?\]/);
        if (retryMatch) {
          fixedText = retryMatch[0];
        }
        
        try {
          comments = JSON.parse(fixedText);
        } catch (retryError) {
          throw jsonError; // Throw original error
        }
      }

      if (!Array.isArray(comments)) {
        throw new Error("Parsed result is not an array");
      }

      // Validate and format comments with engagement scores
      const formattedComments = comments
        .map((comment) => {
          let commentText = "";
          let commentData = {};

          if (typeof comment === "string") {
            commentText = comment.trim();
            commentData = {
              engagementScore: this.calculateEngagementScore(comment),
              type: "general",
            };
          } else if (comment.text) {
            commentText = comment.text.trim();
            commentData = {
              engagementScore:
                comment.engagementScore ||
                this.calculateEngagementScore(comment.text),
              type: comment.type || "general",
            };
          } else {
            return null;
          }

          // Enforce 15-20 word limit
          const wordCount = commentText.split(/\s+/).length;
          if (wordCount > 20) {
            // Truncate to 20 words
            const words = commentText.split(/\s+/);
            commentText = words.slice(0, 20).join(" ") + "...";
            console.log(`⚠️ Comment truncated from ${wordCount} to 20 words`);
          }

          return {
            text: commentText,
            ...commentData,
          };
        })
        .filter((comment) => comment && comment.text.length > 0);

      console.log("✅ Parsed comments with scores:", formattedComments);
      return formattedComments;
    } catch (error) {
      console.error("❌ Failed to parse generated comments:", error.message);
      console.log("Raw text was:", generatedText);

      // Try to extract comments from natural language
      const lines = generatedText
        .split("\n")
        .filter(
          (line) =>
            line.trim().length > 0 &&
            (line.includes('"') || line.includes("'") || line.match(/^\d+\./))
        );

      if (lines.length > 0) {
        console.log("🔄 Trying to extract from natural language...");
        const extractedComments = lines
          .slice(0, 4)
          .map((line) => {
            // Clean up the line
            let text = line
              .replace(/^\d+\.\s*/, "")
              .replace(/^[-•]\s*/, "")
              .replace(/^["']|["']$/g, "")
              .trim();
            return text;
          })
          .filter((comment) => comment.length > 0);

        if (extractedComments.length > 0) {
          console.log(
            "✅ Extracted comments from natural language:",
            extractedComments
          );
          return extractedComments;
        }
      }

      throw new Error(
        "Could not parse generated comments. Please try again."
      );
    }
  }

  /**
   * Determine engagement goal based on user profile and persona
   * This helps tailor the prompt for maximum engagement
   */
  determineEngagementGoal(userProfile, persona) {
    // Default goal
    let goal = {
      description: "Drive meaningful engagement and profile visibility",
      objectives: ["Increase profile visits", "Attract quality connections", "Start meaningful conversations"],
      ctaStrategy: "- Ask questions that invite personal experiences\n- Encourage sharing of similar stories\n- Request actionable advice from the community"
    };

    // Analyze user profile for goal inference
    if (userProfile) {
      const goals = userProfile.goals?.toLowerCase() || "";
      const targetAudience = userProfile.targetAudience?.toLowerCase() || "";
      const experience = userProfile.experience?.toLowerCase() || persona?.experience?.toLowerCase() || "";

      // Job seeker / Entry level
      if (goals.includes("job") || goals.includes("career") || experience.includes("entry") || experience.includes("junior")) {
        goal = {
          description: "Attract recruiter attention and showcase expertise",
          objectives: ["Get noticed by recruiters", "Increase profile views from hiring managers", "Demonstrate value and skills"],
          ctaStrategy: "- Ask about industry experiences or career advice\n- Invite connections to share their journey\n- Request feedback on the topic from experienced professionals"
        };
      }
      // Networking / Connections
      else if (goals.includes("network") || goals.includes("connect") || targetAudience.includes("peer")) {
        goal = {
          description: "Build meaningful professional connections",
          objectives: ["Increase connection requests", "Start conversations with peers", "Build industry relationships"],
          ctaStrategy: "- Ask for opinions and experiences from the community\n- Invite people to share their perspectives\n- Create discussion around common challenges"
        };
      }
      // Thought leadership / Authority
      else if (goals.includes("authority") || goals.includes("thought leader") || experience.includes("senior") || experience.includes("executive")) {
        goal = {
          description: "Establish thought leadership and industry authority",
          objectives: ["Increase shares and saves", "Position as industry expert", "Drive meaningful discussions"],
          ctaStrategy: "- Pose thought-provoking questions that challenge assumptions\n- Invite debate and diverse perspectives\n- Ask for real-world applications of the insights shared"
        };
      }
      // Business / Client acquisition
      else if (goals.includes("client") || goals.includes("business") || goals.includes("sales") || targetAudience.includes("client")) {
        goal = {
          description: "Attract potential clients and business opportunities",
          objectives: ["Generate leads", "Showcase expertise to prospects", "Build trust with potential clients"],
          ctaStrategy: "- Ask about challenges they face in this area\n- Invite DMs for deeper conversations\n- Request examples of how they've applied similar strategies"
        };
      }
    }

    // Persona-based adjustments
    if (persona) {
      const personaName = persona.name?.toLowerCase() || "";
      const personaDesc = persona.description?.toLowerCase() || "";

      if (personaName.includes("marketer") || personaDesc.includes("marketing")) {
        goal.ctaStrategy += "\n- Ask about marketing challenges or successes\n- Invite sharing of campaign results";
      } else if (personaName.includes("developer") || personaDesc.includes("tech")) {
        goal.ctaStrategy += "\n- Ask about technical implementations\n- Invite code examples or technical insights";
      } else if (personaName.includes("founder") || personaDesc.includes("entrepreneur")) {
        goal.ctaStrategy += "\n- Ask about startup challenges\n- Invite sharing of entrepreneurial experiences";
      }
    }

    return goal;
  }

  calculateEngagementScore(content) {
    let score = 50; // Base score

    // Check for engagement elements
    if (content.includes("?")) score += 10; // Questions
    if (content.includes("!")) score += 5; // Excitement
    if (content.includes("→") || content.includes("•")) score += 5; // Structure
    if (content.match(/\d+/)) score += 5; // Numbers/statistics
    if (content.includes("story") || content.includes("experience"))
      score += 10; // Personal elements

    // Length bonus (optimal length)
    const wordCount = content.split(" ").length;
    if (wordCount >= 150 && wordCount <= 300) score += 10;

    // Ensure score is within bounds
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Analyze content for LinkedIn optimization insights using AI
   * Returns real-time, data-driven insights for virality, engagement, and optimal posting times
   */
  async analyzeContentOptimization(content, topic = null, audience = null) {
    try {
      console.log("🔍 Analyzing content for optimization insights...");

      const prompt = `You are a LinkedIn content optimization expert. Analyze the following LinkedIn post content and provide real, data-driven insights.

CONTENT TO ANALYZE:
${content}

${topic ? `TOPIC: ${topic}` : ''}
${audience ? `TARGET AUDIENCE: ${audience}` : ''}

Analyze this content and provide a JSON response with the following structure:
{
  "viralityScore": <number between 0-100>, // Based on: hook strength, engagement elements (questions, CTAs, numbers), personal storytelling, length optimization, emotional triggers
  "engagementPrediction": "<Very High|High|Medium|Low>", // Based on content quality and engagement elements
  "bestTimeToPost": "<Day HH:MM AM/PM>", // Calculate based on current day/time and optimal LinkedIn engagement patterns (Tuesday-Thursday, 8-10 AM or 12-1 PM are best)
  "optimalDay": "<Day of week>", // Best day for this type of content
  "peakHours": ["HH:MM AM/PM", "HH:MM AM/PM"], // Top 2 peak engagement hours
  "audienceActivity": "<description>", // When the target audience is most active
  "keyStrengths": ["strength1", "strength2"], // Top 2-3 content strengths
  "improvementAreas": ["area1", "area2"], // Areas for improvement
  "estimatedReach": "<High|Medium|Low>", // Estimated reach potential
  "recommendations": ["rec1", "rec2"] // 2-3 actionable recommendations
}

IMPORTANT:
- Calculate viralityScore based on REAL content analysis: hook quality (first sentence), question count, CTA presence, numbers/statistics, personal elements, optimal length (150-300 words), emotional impact
- For bestTimeToPost: Calculate the NEXT optimal time (Tuesday-Thursday 8-10 AM or 12-1 PM EST/PST). If current time is already optimal, suggest next window.
- Use current date/time context: Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.
- Be specific and data-driven, not generic.

Return ONLY valid JSON, no markdown formatting.`;

      const { result } = await this._generateWithFallback({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      });
      const responseText = this._getResponseText(result);

      // Extract JSON from response (handle markdown code blocks if present)
      let jsonStr = responseText.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const analysis = JSON.parse(jsonStr);

      // Calculate optimal posting time based on current time
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentHour = now.getHours();
      
      // Best days: Tuesday (2), Wednesday (3), Thursday (4)
      let optimalDay = "Tuesday";
      if (currentDay === 2 || currentDay === 3 || currentDay === 4) {
        optimalDay = ["Tuesday", "Wednesday", "Thursday"][currentDay - 2];
      } else if (currentDay < 2) {
        optimalDay = "Tuesday"; // If Sunday/Monday, suggest Tuesday
      } else {
        optimalDay = "Tuesday"; // If Friday/Saturday, suggest next Tuesday
      }

      // Best hours: 8-10 AM or 12-1 PM (in user's timezone)
      const bestHours = [8, 9, 12];
      let bestHour = 9;
      if (currentHour < 8) {
        bestHour = 9;
      } else if (currentHour < 10) {
        bestHour = 10;
      } else if (currentHour < 12) {
        bestHour = 12;
      } else if (currentHour < 13) {
        bestHour = 13;
      } else {
        bestHour = 9; // Next day
      }

      // Format time
      const formatTime = (hour) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:00 ${period}`;
      };

      // Override with AI-suggested values if present, otherwise use calculated
      const finalAnalysis = {
        viralityScore: analysis.viralityScore || this.calculateEngagementScore(content),
        engagementPrediction: analysis.engagementPrediction || "Medium",
        bestTimeToPost: analysis.bestTimeToPost || `${optimalDay} ${formatTime(bestHour)}`,
        optimalDay: analysis.optimalDay || optimalDay,
        peakHours: analysis.peakHours || [formatTime(9), formatTime(12)],
        audienceActivity: analysis.audienceActivity || (audience || "General professionals"),
        keyStrengths: analysis.keyStrengths || [],
        improvementAreas: analysis.improvementAreas || [],
        estimatedReach: analysis.estimatedReach || "Medium",
        recommendations: analysis.recommendations || []
      };

      console.log("✅ Content optimization analysis complete:", {
        viralityScore: finalAnalysis.viralityScore,
        engagementPrediction: finalAnalysis.engagementPrediction
      });

      return {
        success: true,
        data: finalAnalysis
      };
    } catch (error) {
      console.error("❌ Content optimization analysis error:", error);
      throw new Error("AI content analysis failed. Please try again.");
    }
  }
}

export default new GoogleAIService();
