import express from "express";
import Hook from "../models/Hook.js";
import Persona from "../models/Persona.js";
import { authenticateToken, checkPlanAccess } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validation.js";
import { body } from "express-validator";
import googleAIService from "../services/googleAI.js";
import { config } from "../config/index.js";

const router = express.Router();

// Get all available hooks
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;

    const hooks = await Hook.find(query).sort({
      usageCount: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      data: { hooks },
    });
  } catch (error) {
    console.error("Get hooks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get hooks",
    });
  }
});

// Get hook categories
router.get("/categories", async (req, res) => {
  try {
    const categories = [
      {
        value: "story",
        label: "Personal Story",
        description: "Share personal experiences and lessons",
      },
      {
        value: "question",
        label: "Engaging Question",
        description: "Ask thought-provoking questions",
      },
      {
        value: "statement",
        label: "Bold Statement",
        description: "Make confident declarations",
      },
      {
        value: "challenge",
        label: "Challenge",
        description: "Challenge conventional thinking",
      },
      {
        value: "insight",
        label: "Industry Insight",
        description: "Share professional insights",
      },
    ];

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Get hook categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get hook categories",
    });
  }
});

// Create custom hook (Pro users only)
router.post(
  "/",
  authenticateToken,
  checkPlanAccess("pro"),
  [
    body("text")
      .trim()
      .isLength({ min: 10, max: 100 })
      .withMessage("Hook text must be between 10 and 100 characters"),
    body("category")
      .isIn(["story", "question", "statement", "challenge", "insight"])
      .withMessage("Invalid category"),
  ],
  async (req, res) => {
    try {
      const { text, category } = req.body;
      const userId = req.user._id;

      // Check if hook already exists
      const existingHook = await Hook.findOne({
        text: { $regex: new RegExp(text, "i") },
      });
      if (existingHook) {
        return res.status(400).json({
          success: false,
          message: "A similar hook already exists",
        });
      }

      const hook = new Hook({
        text,
        category,
        isDefault: false,
        createdBy: userId,
      });

      await hook.save();

      res.status(201).json({
        success: true,
        message: "Custom hook created successfully",
        data: { hook },
      });
    } catch (error) {
      console.error("Create hook error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create hook",
      });
    }
  }
);

// Update custom hook (Pro users only)
router.put(
  "/:id",
  authenticateToken,
  checkPlanAccess("pro"),
  validateObjectId,
  [
    body("text")
      .trim()
      .isLength({ min: 10, max: 100 })
      .withMessage("Hook text must be between 10 and 100 characters"),
    body("category")
      .isIn(["story", "question", "statement", "challenge", "insight"])
      .withMessage("Invalid category"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { text, category } = req.body;
      const userId = req.user._id;

      const hook = await Hook.findOneAndUpdate(
        { _id: id, createdBy: userId, isDefault: false },
        { text, category },
        { new: true, runValidators: true }
      );

      if (!hook) {
        return res.status(404).json({
          success: false,
          message: "Hook not found or cannot be modified",
        });
      }

      res.json({
        success: true,
        message: "Hook updated successfully",
        data: { hook },
      });
    } catch (error) {
      console.error("Update hook error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update hook",
      });
    }
  }
);

// Delete custom hook (Pro users only)
router.delete(
  "/:id",
  authenticateToken,
  checkPlanAccess("pro"),
  validateObjectId,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const hook = await Hook.findOneAndUpdate(
        { _id: id, createdBy: userId, isDefault: false },
        { isActive: false },
        { new: true }
      );

      if (!hook) {
        return res.status(404).json({
          success: false,
          message: "Hook not found or cannot be deleted",
        });
      }

      res.json({
        success: true,
        message: "Hook deleted successfully",
      });
    } catch (error) {
      console.error("Delete hook error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete hook",
      });
    }
  }
);

// Get popular hooks
router.get("/popular", async (req, res) => {
  try {
    const hooks = await Hook.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { hooks },
    });
  } catch (error) {
    console.error("Get popular hooks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular hooks",
    });
  }
});

// Get trending hooks (AI-generated based on current trends) - PAID USERS ONLY
router.get(
  "/trending",
  authenticateToken,
  checkPlanAccess("starter"),
  async (req, res) => {
    try {
      const { topic, industry } = req.query;

      // Generate trending hooks using AI with variety
      const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Add timestamp to ensure different generations
      const timestamp = Date.now();

      // Add random seed for variety
      const randomSeed = Math.floor(Math.random() * 1000);

      const prompt = `Generate 10 fresh, unique, and trending LinkedIn post hooks for ${
        topic || "general professional content"
      } in ${
        industry || "various industries"
      }. Today is ${currentDate}. Current timestamp: ${timestamp}, seed: ${randomSeed}
    
    Requirements:
    - Each hook should be 10-80 characters
    - Mix of categories: story, question, statement, challenge, insight
    - Based on current trends and viral content patterns as of ${currentDate}
    - Professional but engaging
    - Include trending topics, buzzwords, and current events relevant to this week
    - Make each hook UNIQUE and different from previous generations
    - Avoid repeating the same hooks
    - Use creative variations and different angles
    - Consider different industries and perspectives
    
    Return as JSON array with format:
    [
      {
        "text": "hook text here",
        "category": "story|question|statement|challenge|insight",
        "trending": true
      }
    ]`;

      let aiResponse;
      try {
        aiResponse = await googleAIService.generateText(prompt, {
          temperature: 0.9,
          maxOutputTokens: 2000,
        });
      } catch (aiError) {
        console.error("❌ Google AI error during trending hooks generation:", {
          message: aiError.message,
          stack: aiError.stack,
          topic,
          industry,
        });
        // Fall through to fallback
        throw new Error(`AI service error: ${aiError.message}`);
      }

      if (!aiResponse || !aiResponse.text || !aiResponse.text.trim()) {
        throw new Error("AI response is empty");
      }

      const aiText = aiResponse.text;
      console.log("✅ AI response received for trending hooks, length:", aiText.length);

      // Parse AI response
      let trendingHooks;
      try {
        // Clean the response and extract JSON
        let cleanedResponse = aiText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        // Try to extract JSON array if wrapped in other text
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }

        trendingHooks = JSON.parse(cleanedResponse);

        // Validate parsed hooks structure
        if (!Array.isArray(trendingHooks)) {
          throw new Error("Parsed response is not an array");
        }

        // Validate each hook has required fields
        trendingHooks = trendingHooks
          .filter((hook) => hook && hook.text && hook.text.trim().length > 0)
          .map((hook) => ({
            text: hook.text.trim(),
            category: hook.category || ["story", "question", "statement", "challenge", "insight"][Math.floor(Math.random() * 5)],
            trending: true,
          }))
          .slice(0, 10); // Limit to 10 hooks

      } catch (parseError) {
        console.error("⚠️ Failed to parse AI response as JSON, trying text parsing:", parseError.message);
        // Fallback: create hooks from response text
        const lines = aiText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => {
            const cleaned = line.replace(/^\d+\.\s*/, "").replace(/^[-*•]\s*/, "").replace(/^["']|["']$/g, "");
            return cleaned.length >= 10 && cleaned.length <= 80;
          });

        if (lines.length === 0) {
          throw new Error("Could not extract hooks from AI response");
        }

        trendingHooks = lines.slice(0, 10).map((line, index) => {
          const cleaned = line
            .replace(/^\d+\.\s*/, "")
            .replace(/^[-*•]\s*/, "")
            .replace(/^["']|["']$/g, "")
            .trim();
          return {
            text: cleaned,
            category: ["story", "question", "statement", "challenge", "insight"][index % 5],
            trending: true,
          };
        });
      }

      // Ensure we have valid hooks
      if (!Array.isArray(trendingHooks) || trendingHooks.length === 0) {
        throw new Error("No valid hooks generated");
      }

      // Validate hook text length and filter invalid ones
      trendingHooks = trendingHooks
        .filter((hook) => {
          const text = hook.text || "";
          return text.length >= 10 && text.length <= 80;
        })
        .slice(0, 10);

      if (trendingHooks.length === 0) {
        throw new Error("All generated hooks were invalid");
      }

      // Add metadata
      const hooksTimestamp = Date.now();
      const hooksWithMetadata = trendingHooks.map((hook, index) => ({
        _id: `trending_${hooksTimestamp}_${index}`,
        text: hook.text,
        category: hook.category || "story",
        trending: true,
        generatedAt: new Date(),
        usageCount: 0,
        isDefault: false,
        isActive: true,
      }));

      console.log(`✅ Generated ${hooksWithMetadata.length} trending hooks successfully`);

      res.json({
        success: true,
        data: {
          hooks: hooksWithMetadata,
          generatedAt: new Date(),
          source: "ai-generated",
          count: hooksWithMetadata.length,
        },
      });
    } catch (error) {
      console.error("❌ Generate trending hooks error:", {
        message: error.message,
        stack: error.stack,
        topic,
        industry,
      });

      // Fallback to popular hooks if AI fails
      try {
        console.log("🔄 Attempting fallback to popular hooks...");
        const fallbackHooks = await Hook.find({ isActive: true })
          .sort({ usageCount: -1, createdAt: -1 })
          .limit(10)
          .lean(); // Use lean() for better performance

        if (fallbackHooks && fallbackHooks.length > 0) {
          console.log(`✅ Using ${fallbackHooks.length} fallback hooks`);
          res.json({
            success: true,
            data: {
              hooks: fallbackHooks,
              generatedAt: new Date(),
              source: "fallback-popular",
              count: fallbackHooks.length,
              warning: "AI generation failed, showing popular hooks instead",
            },
          });
          return;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError.message);
      }

      // Last resort: return error with helpful message
      res.status(500).json({
        success: false,
        message: "Failed to generate trending hooks. Please try again in a moment.",
        error: config.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Generate custom AI hooks based on user's topic - FREE FOR ALL USERS
router.post(
  "/generate",
  authenticateToken, // must be logged in, but NO plan check — free for all
  async (req, res) => {
    try {
      const { topic } = req.body;

      if (!topic || topic.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: "Please provide a topic with at least 5 characters.",
        });
      }

      const trimmedTopic = topic.trim().slice(0, 500); // safety cap

      const prompt = `You are a world-class LinkedIn copywriting expert. A user wants to write a LinkedIn post about the following topic:

"${trimmedTopic}"

Generate exactly 5 distinct, compelling opening hooks for this specific topic. Each hook must feel tailor-made for this exact topic — do NOT write generic hooks.

Use each of these 5 copywriting frameworks, one per hook:
1. contrarian  — Challenge a widely-held belief related to this topic.
2. story       — Start in the middle of a vivid, specific, personal scenario related to this topic.
3. question    — Ask a sharp, thought-provoking question that targets a precise pain point related to this topic.
4. insight     — Deliver a surprising, data-driven or counterintuitive observation about this topic.
5. challenge   — Call out a mistake or bad habit directly related to this topic.

Rules:
- Each hook must be 10–100 characters long.
- Each hook must stand on its own as the opening line of a post.
- No emojis.
- Do NOT include generic phrases like "Here's what nobody tells you" unless directly tied to the topic.
- Sound human, not like marketing copy.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  { "text": "hook text here", "category": "contrarian" },
  { "text": "hook text here", "category": "story" },
  { "text": "hook text here", "category": "question" },
  { "text": "hook text here", "category": "insight" },
  { "text": "hook text here", "category": "challenge" }
]`;

      let aiResponse;
      try {
        aiResponse = await googleAIService.generateText(prompt, {
          temperature: 0.85,
          maxOutputTokens: 1500,
        });
      } catch (aiError) {
        console.error("❌ AI error during custom hook generation:", aiError.message);
        throw new Error(`AI service error: ${aiError.message}`);
      }

      if (!aiResponse || !aiResponse.text || !aiResponse.text.trim()) {
        throw new Error("AI response was empty");
      }

      // Parse the AI response
      let generatedHooks;
      try {
        let cleaned = aiResponse.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) cleaned = jsonMatch[0];

        generatedHooks = JSON.parse(cleaned);

        if (!Array.isArray(generatedHooks)) throw new Error("Not an array");

        generatedHooks = generatedHooks
          .filter((h) => h && h.text && h.text.trim().length >= 5)
          .map((h, i) => ({
            _id: `custom_${Date.now()}_${i}`,
            text: h.text.trim(),
            category: h.category || "insight",
            isCustomGenerated: true,
            isDefault: false,
            isActive: true,
            usageCount: 0,
          }))
          .slice(0, 5);
      } catch (parseError) {
        console.error("⚠️ Parse error for custom hooks:", parseError.message);
        // Fallback: split lines
        const lines = aiResponse.text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length >= 10 && !l.startsWith("{") && !l.startsWith("["));

        if (lines.length === 0) throw new Error("Could not extract hooks from AI response");

        generatedHooks = lines.slice(0, 5).map((line, i) => ({
          _id: `custom_${Date.now()}_${i}`,
          text: line.replace(/^["'\d.\-*•]+\s*/, "").trim(),
          category: ["contrarian", "story", "question", "insight", "challenge"][i % 5],
          isCustomGenerated: true,
          isDefault: false,
          isActive: true,
          usageCount: 0,
        }));
      }

      if (!generatedHooks || generatedHooks.length === 0) {
        throw new Error("No valid hooks were generated");
      }

      console.log(`✅ Generated ${generatedHooks.length} custom hooks for topic: "${trimmedTopic.slice(0, 50)}"`);

      res.json({
        success: true,
        data: {
          hooks: generatedHooks,
          topic: trimmedTopic,
          generatedAt: new Date(),
          source: "ai-custom",
        },
      });
    } catch (error) {
      console.error("❌ Custom hook generation error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to generate custom hooks. Please try again.",
      });
    }
  }
);

export default router;
