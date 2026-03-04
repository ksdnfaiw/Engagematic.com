import express from "express";
import Content from "../models/Content.js";
import Hook from "../models/Hook.js";
import Persona from "../models/Persona.js";
import googleAIService from "../services/googleAI.js";
import usageService from "../services/usageService.js";
import subscriptionService from "../services/subscriptionService.js";
import { authenticateToken, checkTrialStatus } from "../middleware/auth.js";
import {
  validatePostGeneration,
  validatePostGenerationWithoutHook,
  validateCommentGeneration,
  validateObjectId,
} from "../middleware/validation.js";
import { body, validationResult } from "express-validator";
import linkedinProfileService from "../services/linkedinProfileService.js";
import profileInsightsService from "../services/profileInsightsService.js";
import { config } from "../config/index.js";
import axios from "axios";
import * as cheerio from "cheerio";

const router = express.Router();

/**
 * Classify AI generation errors and return appropriate HTTP status + user-facing message.
 */
function classifyAIError(error, fallbackMessage = "Failed to generate content") {
  const msg = error?.message || "";
  const isQuota = /429|quota|rate limit|limit: 0|too many requests/i.test(msg);
  const isLeaked = /403|leaked|revoked|invalid.*api.*key/i.test(msg);
  const isBlocked = /blocked|safety|harmful/i.test(msg);
  const isHookMissing = /hook not found/i.test(msg);
  const isPersonaMissing = /persona not found/i.test(msg);
  const isParseFail = /parse|could not parse/i.test(msg);

  if (isLeaked) {
    return { status: 503, message: "AI service is temporarily unavailable. Please try again later." };
  }
  if (isQuota) {
    return { status: 429, message: "AI service is at capacity. Please try again in a minute." };
  }
  if (isBlocked) {
    return { status: 400, message: "Content was blocked by safety filters. Please rephrase your topic." };
  }
  if (isHookMissing) {
    return { status: 400, message: "Selected hook is no longer available. Please select another hook." };
  }
  if (isPersonaMissing) {
    return { status: 400, message: "Selected persona is no longer available. Please select another persona." };
  }
  if (isParseFail) {
    return { status: 500, message: "Could not parse AI response. Please try again." };
  }
  return {
    status: 500,
    message: config.NODE_ENV === "development" ? msg : fallbackMessage,
  };
}

// Log share clicks (for analytics)
router.post("/share-log", authenticateToken, async (req, res) => {
  try {
    const { contentId, platform } = req.body;

    console.log(
      `📤 Share logged: ${platform} - Content: ${contentId} - User: ${req.user._id}`
    );

    // You can expand this to store share analytics in the database if needed
    // For now, just log it

    res.json({
      success: true,
      message: "Share logged successfully",
    });
  } catch (error) {
    console.error("Share log error:", error);
    res.json({ success: true }); // Silent fail - don't break user experience
  }
});

// Generate LinkedIn post - SIMPLIFIED to accept persona data directly
router.post(
  "/posts/generate",
  authenticateToken,
  checkTrialStatus,
  validatePostGeneration,
  async (req, res) => {
    try {
      const { topic, hookId, personaId, persona: personaData } = req.body;
      const userId = req.user._id;

      // Log received data for debugging
      console.log("📥 Post generation request received:", {
        topic: topic?.substring(0, 50),
        hookId: hookId,
        hookIdType: typeof hookId,
        hasPersonaId: !!personaId,
        hasPersonaData: !!personaData,
      });

      // Check subscription and quota before generation
      const canGenerate = await subscriptionService.canPerformAction(
        userId,
        "generate_post"
      );
      if (!canGenerate.allowed) {
        return res.status(429).json({
          success: false,
          message: canGenerate.reason,
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        });
      }

      // Get hook - handle both database hooks and trending hooks
      let hook;
      // Ensure hookId is a string
      const hookIdStr = String(hookId || "");
      
      if (hookIdStr.startsWith("trending_")) {
        // This is a trending hook (AI-generated)
        // Try to find the hook data in the request or fetch from cache
        // For now, extract the text from the request body if available
        hook = {
          text: req.body.hookText || "Here's what changed everything:",
          category: "trending",
          isDefault: false,
        };
        console.log("✅ Using trending hook:", hook.text);
      } else {
        // Regular database hook
        hook = await Hook.findById(hookIdStr);
        if (!hook) {
          return res.status(404).json({
            success: false,
            message: "Hook not found",
          });
        }
      }

      // Get or use persona - SIMPLIFIED to accept direct persona data
      let persona;
      if (personaId) {
        // Use persona from database
        persona = await Persona.findById(personaId);
        if (!persona || persona.userId.toString() !== userId.toString()) {
          return res.status(404).json({
            success: false,
            message: "Persona not found or access denied",
          });
        }
      } else if (personaData) {
        // Use persona data directly (for sample personas)
        persona = personaData;
        console.log("✅ Using sample persona:", persona.name);
      } else {
        return res.status(400).json({
          success: false,
          message: "Either personaId or persona data is required",
        });
      }

      // Get user profile for personalization
      // Fetch full user to get formatting preference and training posts
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please log in again.",
        });
      }

      const userProfile = {
        jobTitle: user.profile?.jobTitle || null,
        company: user.profile?.company || null,
        industry: user.profile?.industry || null,
        experience: user.profile?.experience || null,
        goals: user.persona?.goals || null,
        targetAudience: user.persona?.targetAudience || null,
        expertise: user.persona?.expertise || null,
        usageContext: user.profile?.usageContext || null,
        workContext: user.profile?.workContext || null,
        contentFocus: user.persona?.contentFocus || null,
      };

      console.log("👤 User Profile for Personalization:", userProfile);

      // Generate content using Google AI with user profile
      console.log("📝 Calling Google AI service...");
      console.log("Data:", {
        topic,
        hookText: hook.text,
        personaName: persona.name,
        personaTone: persona.tone,
      });

      // Get profile insights for enhanced personalization (non-blocking)
      let profileInsights = null;
      try {
        profileInsights = await profileInsightsService.buildEnhancedContext(
          userId
        );
      } catch (insightsError) {
        console.warn("⚠️ Profile insights skipped (non-critical):", insightsError.message);
      }

      // Get user's formatting preference and training posts
      const postFormatting = user.profile?.postFormatting || "plain";
      let trainingPosts = [];
      try {
        if (user.persona?.trainingPostIds && user.persona.trainingPostIds.length > 0) {
          trainingPosts = await Content.find({
            _id: { $in: user.persona.trainingPostIds },
            userId: userId,
          }).select("content").limit(10); // Limit to 10 posts for prompt length
        }
      } catch (trainErr) {
        console.warn("⚠️ Training posts fetch skipped:", trainErr.message);
      }

      let aiResponse;
      try {
        aiResponse = await googleAIService.generatePost(
          topic,
          hook.text,
          persona,
          req.body.linkedinInsights || null,
          profileInsights,
          userProfile, // Pass user profile for deep personalization
          postFormatting, // User's formatting preference
          trainingPosts, // User's selected training posts (premium)
          { aiVoice: user.profile?.aiVoice || null }
        );
      } catch (aiError) {
        console.error("❌ Google AI error during post generation:", {
          message: aiError.message,
          stack: aiError.stack,
          topic: topic?.substring(0, 50),
        });
        throw new Error(`AI service error: ${aiError.message}`);
      }

      // Validate AI response
      if (!aiResponse || !aiResponse.content) {
        throw new Error("Invalid response from AI service - no content generated");
      }

      console.log("✅ AI response received:", {
        contentLength: aiResponse.content?.length,
        engagementScore: aiResponse.engagementScore,
        tokensUsed: aiResponse.tokensUsed,
      });

      // Save generated content
      let content;
      try {
        content = new Content({
          userId,
          type: "post",
          content: aiResponse.content,
          topic,
          hookId: hookIdStr,
          personaId: personaId || null, // May be null for sample personas
          engagementScore: aiResponse.engagementScore,
          tokensUsed: aiResponse.tokensUsed,
        });

        await content.save();
      } catch (saveError) {
        console.error("❌ Error saving content:", saveError);
        // Still return the content even if save fails
        content = {
          _id: `temp-${Date.now()}`,
          userId,
          type: "post",
          content: aiResponse.content,
          topic,
          hookId: hookIdStr,
          personaId: personaId || null,
          engagementScore: aiResponse.engagementScore,
          tokensUsed: aiResponse.tokensUsed,
          createdAt: new Date(),
        };
        console.warn("⚠️ Content not saved to database, but returning generated content");
      }

      // Increment usage (non-blocking)
      try {
        await usageService.incrementUsage(userId, "posts", aiResponse.tokensUsed);
        await subscriptionService.recordUsage(userId, "generate_post");
      } catch (usageError) {
        console.error("⚠️ Failed to track usage (non-critical):", usageError.message);
        // Don't fail the request if usage tracking fails
      }

      // Update hook usage count (skip for trending hooks - they're not in the database)
      if (!hookIdStr.startsWith("trending_")) {
        try {
          await Hook.findByIdAndUpdate(hookIdStr, { $inc: { usageCount: 1 } });
        } catch (hookError) {
          console.warn("⚠️ Failed to update hook usage count (non-critical):", hookError.message);
        }
      }

      // Get updated subscription info
      let subscription;
      try {
        subscription = await subscriptionService.getUserSubscription(userId);
      } catch (subError) {
        console.warn("⚠️ Failed to get subscription info (non-critical):", subError.message);
        subscription = { usage: {}, tokens: {}, limits: {} };
      }

      res.json({
        success: true,
        message: "Post generated successfully",
        data: {
          content: content,
          quota: await usageService.checkQuotaExceeded(userId, "posts").catch(() => ({ exceeded: false })),
          subscription: {
            usage: subscription.usage || {},
            tokens: subscription.tokens || {},
            limits: subscription.limits || {},
          },
        },
      });
    } catch (error) {
      const reqTopic = req.body?.topic;
      const reqUserId = req.user?._id;
      console.error("❌ Post generation error:", {
        message: error.message,
        stack: error.stack,
        userId: reqUserId,
        topic: reqTopic?.substring(0, 50),
      });

      const { status, message } = classifyAIError(error, "Failed to generate post. Please try again.");
      res.status(status).json({
        success: false,
        message,
        error: config.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Preview post with user's AI Voice (no quota deduction, no save)
router.post(
  "/posts/preview-voice",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const postIdea = (req.body.postIdea || "").toString().trim().slice(0, 300);
      if (!postIdea) {
        return res.status(400).json({
        success: false,
          message: "postIdea is required (short post idea or topic)",
        });
      }

      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId).select("profile.aiVoice persona").lean();
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const aiVoice = user.profile?.aiVoice || null;
      const minimalPersona = {
        name: user.persona?.name || "Professional",
        industry: "Business",
        experience: "Mid-level",
        tone: aiVoice?.tone || user.persona?.tone || "professional",
        writingStyle: "clear and engaging",
        description: "Thought leader sharing actionable insights",
      };
      const defaultHook = "Here's what I've been thinking about.";

      const aiResponse = await googleAIService.generatePost(
        postIdea,
        defaultHook,
        minimalPersona,
        null,
        null,
        null,
        "plain",
        [],
        { aiVoice, maxOutputTokens: 1024 }
      );

      if (!aiResponse || !aiResponse.content) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate preview",
        });
      }

      res.json({
        success: true,
        message: "Preview generated",
        data: { content: aiResponse.content },
      });
    } catch (error) {
      console.error("Preview voice error:", error?.message);
      const { status, message } = classifyAIError(error, "Failed to generate preview. Please try again.");
      res.status(status).json({
        success: false,
        message,
      });
    }
  }
);

// Generate LinkedIn post without hooks (for pro users with custom titles)
router.post(
  "/posts/generate-custom",
  authenticateToken,
  checkTrialStatus,
  validatePostGenerationWithoutHook,
  async (req, res) => {
    try {
      const {
        topic,
        title,
        category,
        personaId,
        persona: personaData,
      } = req.body;
      const userId = req.user._id;

      // Check subscription and quota before generation
      const canGenerate = await subscriptionService.canPerformAction(
        userId,
        "generate_post"
      );
      if (!canGenerate.allowed) {
        return res.status(429).json({
          success: false,
          message: canGenerate.reason,
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        });
      }

      // Create custom hook from title and category
      const hook = {
        text: title,
        category: category,
        isDefault: false,
      };

      // Get or use persona - SIMPLIFIED to accept direct persona data
      let persona;
      if (personaId) {
        // Use persona from database
        persona = await Persona.findById(personaId);
        if (!persona || persona.userId.toString() !== userId.toString()) {
          return res.status(404).json({
            success: false,
            message: "Persona not found or access denied",
          });
        }
      } else if (personaData) {
        // Use persona data directly (for sample personas)
        persona = personaData;
        console.log("✅ Using sample persona:", persona.name);
      } else {
        return res.status(400).json({
          success: false,
          message: "Either personaId or persona data is required",
        });
      }

      // Get user profile for personalization
      // Fetch full user to get formatting preference and training posts
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please log in again.",
        });
      }

      const userProfile = {
        jobTitle: user.profile?.jobTitle || null,
        company: user.profile?.company || null,
        industry: user.profile?.industry || null,
        experience: user.profile?.experience || null,
        goals: user.persona?.goals || null,
        targetAudience: user.persona?.targetAudience || null,
        expertise: user.persona?.expertise || null,
        usageContext: user.profile?.usageContext || null,
        workContext: user.profile?.workContext || null,
        contentFocus: user.persona?.contentFocus || null,
      };

      console.log("👤 User Profile for Personalization:", userProfile);

      // Generate content using Google AI with user profile
      console.log("📝 Calling Google AI service...");
      console.log("Data:", {
        topic,
        hookText: hook.text,
        personaName: persona.name,
        personaTone: persona.tone,
      });

      // Get profile insights for enhanced personalization (non-blocking)
      let profileInsights = null;
      try {
        profileInsights = await profileInsightsService.buildEnhancedContext(
          userId
        );
      } catch (insightsError) {
        console.warn("⚠️ Profile insights skipped (non-critical):", insightsError.message);
      }

      // Get user's formatting preference and training posts
      const postFormatting = user.profile?.postFormatting || "plain";
      let trainingPosts = [];
      try {
        if (user.persona?.trainingPostIds && user.persona.trainingPostIds.length > 0) {
          trainingPosts = await Content.find({
            _id: { $in: user.persona.trainingPostIds },
            userId: userId,
          }).select("content").limit(10); // Limit to 10 posts for prompt length
        }
      } catch (trainErr) {
        console.warn("⚠️ Training posts fetch skipped:", trainErr.message);
      }

      let aiResponse;
      try {
        aiResponse = await googleAIService.generatePost(
          topic,
          hook.text,
          persona,
          req.body.linkedinInsights || null,
          profileInsights,
          userProfile, // Pass user profile for deep personalization
          postFormatting, // User's formatting preference
          trainingPosts, // User's selected training posts (premium)
          { aiVoice: user.profile?.aiVoice || null }
        );
      } catch (aiError) {
        console.error("❌ Google AI error during custom post generation:", {
          message: aiError.message,
          stack: aiError.stack,
          topic: topic?.substring(0, 50),
        });
        throw new Error(`AI service error: ${aiError.message}`);
      }

      // Validate AI response
      if (!aiResponse || !aiResponse.content) {
        throw new Error("Invalid response from AI service - no content generated");
      }

      console.log("✅ AI response received:", {
        contentLength: aiResponse.content?.length,
        engagementScore: aiResponse.engagementScore,
        tokensUsed: aiResponse.tokensUsed,
      });

      // Save generated content (don't save hook since it's not from database)
      let content;
      try {
        content = new Content({
          userId,
          type: "post",
          content: aiResponse.content,
          topic,
          hookId: null, // No hook for custom posts
          personaId: personaId || null, // May be null for sample personas
          engagementScore: aiResponse.engagementScore,
          tokensUsed: aiResponse.tokensUsed,
        });

        await content.save();
      } catch (saveError) {
        console.error("❌ Error saving custom post content:", saveError);
        // Still return the content even if save fails
        content = {
          _id: `temp-${Date.now()}`,
          userId,
          type: "post",
          content: aiResponse.content,
          topic,
          hookId: null,
          personaId: personaId || null,
          engagementScore: aiResponse.engagementScore,
          tokensUsed: aiResponse.tokensUsed,
          createdAt: new Date(),
        };
        console.warn("⚠️ Custom post not saved to database, but returning generated content");
      }

      // Increment usage (non-blocking)
      try {
        await usageService.incrementUsage(userId, "posts", aiResponse.tokensUsed);
        await subscriptionService.recordUsage(userId, "generate_post");
      } catch (usageError) {
        console.error("⚠️ Failed to track usage for custom post (non-critical):", usageError.message);
      }

      // Get updated subscription info
      let subscription;
      try {
        subscription = await subscriptionService.getUserSubscription(userId);
      } catch (subError) {
        console.warn("⚠️ Failed to get subscription info (non-critical):", subError.message);
        subscription = { usage: {}, tokens: {}, limits: {} };
      }

      res.json({
        success: true,
        message: "Post generated successfully",
        data: {
          content: content,
          quota: await usageService.checkQuotaExceeded(userId, "posts").catch(() => ({ exceeded: false })),
          subscription: {
            usage: subscription.usage || {},
            tokens: subscription.tokens || {},
            limits: subscription.limits || {},
          },
        },
      });
    } catch (error) {
      console.error("❌ Custom post generation error:", {
        message: error.message,
        stack: error.stack,
      });

      const { status, message } = classifyAIError(error, "Failed to generate post. Please try again.");
      res.status(status).json({
        success: false,
        message,
        error: config.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Generate post from Content Planner context only (no persona)
router.post(
  "/posts/generate-from-plan",
  authenticateToken,
  checkTrialStatus,
  async (req, res) => {
    try {
      const { topic, title, category, planContext } = req.body;
      const userId = req.user._id;

      if (!topic || !planContext) {
        return res.status(400).json({
          success: false,
          message: "topic and planContext (audience, helpWith, platforms, promotion, goal) are required",
        });
      }

      const canGenerate = await subscriptionService.canPerformAction(
        userId,
        "generate_post"
      );
      if (!canGenerate.allowed) {
        return res.status(429).json({
          success: false,
          message: canGenerate.reason,
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        });
      }

      const hookText = title && title.length >= 5 ? title : topic.split("\n")[0]?.slice(0, 100) || topic.slice(0, 100);
      
      let aiResponse;
      try {
        aiResponse = await googleAIService.generatePostFromPlanContext(
          topic,
          hookText,
          planContext
        );
      } catch (aiError) {
        console.error("❌ Google AI error during plan post generation:", {
          message: aiError.message,
          topic: topic?.substring(0, 50),
        });
        throw new Error(`AI service error: ${aiError.message}`);
      }

      if (!aiResponse || !aiResponse.content) {
        throw new Error("Invalid response from AI service - no content generated");
      }

      let content;
      try {
        content = new Content({
          userId,
          type: "post",
          content: aiResponse.content,
          topic,
          hookId: null,
          personaId: null,
          engagementScore: aiResponse.engagementScore,
          tokensUsed: aiResponse.tokensUsed,
        });
        await content.save();
      } catch (saveError) {
        console.error("❌ Error saving plan post:", saveError);
        content = {
          _id: `temp-${Date.now()}`,
          userId,
          type: "post",
          content: aiResponse.content,
          topic,
          hookId: null,
          personaId: null,
          engagementScore: aiResponse.engagementScore,
          tokensUsed: aiResponse.tokensUsed,
          createdAt: new Date(),
        };
      }

      // Non-blocking usage tracking
      try {
        await usageService.incrementUsage(userId, "posts", aiResponse.tokensUsed);
        await subscriptionService.recordUsage(userId, "generate_post");
      } catch (usageError) {
        console.error("⚠️ Failed to track usage for plan post (non-critical):", usageError.message);
      }

      let subscription;
      try {
        subscription = await subscriptionService.getUserSubscription(userId);
      } catch (subError) {
        console.warn("⚠️ Failed to get subscription info (non-critical):", subError.message);
        subscription = { usage: {}, tokens: {}, limits: {} };
      }

      res.json({
        success: true,
        message: "Post generated from content plan",
        data: {
          content: content,
          quota: await usageService.checkQuotaExceeded(userId, "posts").catch(() => ({ exceeded: false })),
          subscription: {
            usage: subscription.usage || {},
            tokens: subscription.tokens || {},
            limits: subscription.limits || {},
          },
        },
      });
    } catch (error) {
      console.error("❌ Generate from plan error:", {
        message: error.message,
        stack: error.stack,
      });

      const { status, message } = classifyAIError(error, "Failed to generate post from plan. Please try again.");
      res.status(status).json({
        success: false,
        message,
        error: config.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Generate LinkedIn comment
router.post(
  "/comments/generate",
  authenticateToken,
  checkTrialStatus,
  validateCommentGeneration,
  async (req, res) => {
    try {
      const {
        postContent,
        personaId,
        persona: personaData,
        commentType,
      } = req.body;
      const userId = req.user._id;

      // Check subscription and quota before generation
      const canGenerate = await subscriptionService.canPerformAction(
        userId,
        "generate_comment"
      );
      if (!canGenerate.allowed) {
        return res.status(429).json({
          success: false,
          message: canGenerate.reason,
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        });
      }

      // Get or use persona - SIMPLIFIED to accept direct persona data
      let persona;
      if (personaId) {
        // Use persona from database
        persona = await Persona.findById(personaId);
        if (!persona || persona.userId.toString() !== userId.toString()) {
          return res.status(404).json({
            success: false,
            message: "Persona not found",
          });
        }
      } else if (personaData) {
        // Use persona data directly (for sample personas)
        persona = personaData;
        console.log(
          "✅ Using sample persona for comment generation:",
          persona.name
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "Either personaId or persona data is required",
        });
      }

      // Normalize and safely truncate post content for AI prompt
      const rawPost = (postContent || "").toString();
      const trimmedPost = rawPost.trim();
      const safePostContent =
        trimmedPost.length > 4000 ? trimmedPost.slice(0, 4000) : trimmedPost;

      // Generate content using Google AI
      console.log("💬 Calling Google AI for comment generation...");
      console.log("Data:", {
        postContent: safePostContent?.substring(0, 100) + "...",
        personaName: persona.name,
        personaTone: persona.tone,
        commentType: commentType || "value_add",
      });

      // Get profile insights for enhanced personalization (non-blocking)
      let profileInsights = null;
      try {
        profileInsights = await profileInsightsService.buildEnhancedContext(
          userId
        );
      } catch (insightsError) {
        console.warn("⚠️ Profile insights skipped for comment gen (non-critical):", insightsError.message);
      }

      // Get user's AI Voice settings for comment style
      let aiVoice = null;
      try {
        const User = (await import("../models/User.js")).default;
        const userForVoice = await User.findById(userId).select("profile.aiVoice").lean();
        aiVoice = userForVoice?.profile?.aiVoice || null;
      } catch (voiceErr) {
        console.warn("⚠️ AI voice fetch skipped for comment (non-critical):", voiceErr?.message);
      }

      let aiResponse;
      try {
        aiResponse = await googleAIService.generateComment(
          safePostContent,
          persona,
          profileInsights,
          commentType || "value_add",
          aiVoice
        );
      } catch (aiError) {
        console.error("❌ Google AI error during comment generation:", {
          message: aiError.message,
          stack: aiError.stack,
          postContentLength: postContent?.length,
        });
        throw new Error(`AI service error: ${aiError.message}`);
      }

      // Validate AI response
      if (!aiResponse) {
        throw new Error("Invalid response from AI service - no response returned");
      }

      // Extract comments - handle both array and single comment formats, preserve engagement scores
      let comments = [];
      if (aiResponse.comments && Array.isArray(aiResponse.comments)) {
        comments = aiResponse.comments.map((c) => {
          if (typeof c === "string") {
            return { text: c, engagementScore: 7.5, type: commentType || "value_add" };
          }
          return {
            text: c.text || String(c),
            engagementScore: c.engagementScore || 7.5,
            type: c.type || commentType || "value_add",
          };
        });
      } else if (aiResponse.content) {
        // Single comment response
        if (typeof aiResponse.content === "string") {
          comments = [{ text: aiResponse.content, engagementScore: 7.5, type: commentType || "value_add" }];
        } else if (Array.isArray(aiResponse.content)) {
          comments = aiResponse.content.map((c) => {
            if (typeof c === "string") {
              return { text: c, engagementScore: 7.5, type: commentType || "value_add" };
            }
            return {
              text: c.text || String(c),
              engagementScore: c.engagementScore || 7.5,
              type: c.type || commentType || "value_add",
            };
          });
        } else {
          comments = [{
            text: aiResponse.content.text || String(aiResponse.content),
            engagementScore: aiResponse.content.engagementScore || 7.5,
            type: aiResponse.content.type || commentType || "value_add",
          }];
        }
      }

      // Filter out empty comments
      comments = comments.filter((c) => c && c.text && c.text.trim().length > 0);

      if (comments.length === 0) {
        throw new Error("No comments were generated. Please try again.");
      }

      console.log("✅ AI comment response received:", {
        commentsCount: comments.length,
        tokensUsed: aiResponse.tokensUsed,
      });

      // Save generated content (save the first comment as the main content)
      const firstCommentText = typeof comments[0] === "string" ? comments[0] : comments[0]?.text || String(comments[0]);

      let content;
      try {
        content = new Content({
          userId,
          type: "comment",
          content: firstCommentText,
          originalPostContent: postContent,
          personaId: personaId || null, // May be null for sample personas
          tokensUsed: aiResponse.tokensUsed,
        });

        await content.save();
      } catch (saveError) {
        console.error("❌ Error saving comment content:", saveError);
        // Still return the content even if save fails
        content = {
          _id: `temp-${Date.now()}`,
          userId,
          type: "comment",
          content: firstCommentText,
          originalPostContent: postContent,
          personaId: personaId || null,
          tokensUsed: aiResponse.tokensUsed,
          createdAt: new Date(),
        };
        console.warn("⚠️ Comment not saved to database, but returning generated comments");
      }

      // Record usage in both systems (non-blocking)
      try {
        await usageService.incrementUsage(
          userId,
          "comments",
          aiResponse.tokensUsed
        );
        await subscriptionService.recordUsage(userId, "generate_comment");
      } catch (usageError) {
        console.error("⚠️ Failed to track usage (non-critical):", usageError.message);
        // Don't fail the request if usage tracking fails
      }

      // Get updated subscription info
      let subscription;
      try {
        subscription = await subscriptionService.getUserSubscription(userId);
      } catch (subError) {
        console.warn("⚠️ Failed to get subscription info (non-critical):", subError.message);
        subscription = { usage: {}, tokens: {}, limits: {} };
      }

      res.json({
        success: true,
        message: "Comments generated successfully",
        data: {
          comments: comments,
          content: content,
          quota: await usageService.checkQuotaExceeded(userId, "comments").catch(() => ({ exceeded: false })),
          subscription: {
            usage: subscription.usage || {},
            tokens: subscription.tokens || {},
            limits: subscription.limits || {},
          },
        },
      });
    } catch (error) {
      const reqUserId = req.user?._id;
      const reqPostContent = req.body?.postContent;
      console.error("❌ Comment generation error:", {
        message: error.message,
        stack: error.stack,
        userId: reqUserId,
        postContentLength: reqPostContent?.length,
      });
      
      const { status, message } = classifyAIError(error, "Failed to generate comments. Please try again.");
      res.status(status).json({
        success: false,
        message,
        error: config.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get content history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
      Content.find(query)
        .populate("personaId", "name tone")
        .populate("hookId", "text category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Content.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get content history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get content history",
    });
  }
});

// Save content to favorites
router.post(
  "/save/:id",
  authenticateToken,
  validateObjectId,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const content = await Content.findOneAndUpdate(
        { _id: id, userId },
        { isSaved: true },
        { new: true }
      );

      if (!content) {
        return res.status(404).json({
          success: false,
          message: "Content not found",
        });
      }

      res.json({
        success: true,
        message: "Content saved successfully",
        data: { content },
      });
    } catch (error) {
      console.error("Save content error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save content",
      });
    }
  }
);

// Get saved content
router.get("/saved", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
      Content.find({ userId, isSaved: true })
        .populate("personaId", "name tone")
        .populate("hookId", "text category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Content.countDocuments({ userId, isSaved: true }),
    ]);

    res.json({
      success: true,
      data: {
        content,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get saved content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get saved content",
    });
  }
});

// Delete content
router.delete("/:id", authenticateToken, validateObjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const content = await Content.findOneAndDelete({ _id: id, userId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    res.json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete content",
    });
  }
});

// Fetch LinkedIn post content from URL
router.post(
  "/fetch-linkedin-content",
  authenticateToken,
  [body("url").isURL().withMessage("Valid LinkedIn URL is required")],
  async (req, res) => {
    try {
      const { url } = req.body;

      // Validate LinkedIn URL
      if (!url.includes("linkedin.com/posts/")) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid LinkedIn post URL",
        });
      }

      console.log("🔗 Fetching LinkedIn content from:", url);

      try {
        // Fetch the LinkedIn post page
        const response = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
          timeout: 10000,
        });

        const $ = cheerio.load(response.data);

        // Try to extract post content from various possible selectors
        let postContent = "";
        let author = "";

        // Common LinkedIn post content selectors
        const contentSelectors = [
          ".feed-shared-text",
          ".feed-shared-text__text-view",
          ".attributed-text-segment-list__content",
          ".break-words",
          '[data-test-id="main-feed-activity-card"] .feed-shared-text',
          ".feed-shared-actor__description",
          ".feed-shared-text__text-view--white-space-pre-wrap",
        ];

        for (const selector of contentSelectors) {
          const content = $(selector).first().text().trim();
          if (content && content.length > 20) {
            postContent = content;
            break;
          }
        }

        // Try to extract author name
        const authorSelectors = [
          ".feed-shared-actor__name",
          ".feed-shared-actor__name--link",
          ".feed-shared-actor__description",
          ".feed-shared-actor__title",
        ];

        for (const selector of authorSelectors) {
          const authorText = $(selector).first().text().trim();
          if (authorText && authorText.length > 0) {
            author = authorText;
            break;
          }
        }

        // If we couldn't extract content, try to get any text content
        if (!postContent) {
          postContent = $("body").text().substring(0, 500).trim();
        }

        // Clean up and format the content
        postContent = postContent
          .replace(/\s+/g, " ")
          .replace(/\n+/g, "\n")
          .trim();

        // Format content based on type - add proper spacing and structure
        if (
          postContent.includes("🌍") ||
          postContent.includes("👋") ||
          postContent.includes("🚀")
        ) {
          // Emoji-heavy posts - add line breaks after emojis
          postContent = postContent
            .replace(/([🌍👋🚀💡🎯📈🔥💼🎉])/g, "\n$1")
            .replace(/\n+/g, "\n")
            .trim();
        } else if (postContent.includes("•") || postContent.includes("-")) {
          // List-style posts - add proper spacing
          postContent = postContent
            .replace(/([•-])\s*/g, "\n$1 ")
            .replace(/\n+/g, "\n")
            .trim();
        } else if (postContent.length > 200) {
          // Long posts - add paragraph breaks
          const sentences = postContent.split(/[.!?]+/);
          if (sentences.length > 3) {
            postContent = sentences
              .filter((s) => s.trim().length > 0)
              .map((sentence, index) => {
                const trimmed = sentence.trim();
                if (index > 0 && index % 2 === 0) {
                  return "\n" + trimmed;
                }
                return trimmed;
              })
              .join(". ")
              .replace(/\n+/g, "\n")
              .trim();
          }
        }

        if (postContent.length < 10) {
          throw new Error(
            "Could not extract meaningful content from the LinkedIn post"
          );
        }

        console.log("✅ Successfully extracted LinkedIn content:", {
          contentLength: postContent.length,
          author: author || "Unknown",
          url: url,
        });

        res.json({
          success: true,
          message: "LinkedIn content fetched successfully",
          data: {
            content: postContent,
            author: author || "LinkedIn User",
            title: `Post by ${author || "LinkedIn User"}`,
            url: url,
          },
        });
      } catch (scrapingError) {
        console.error("❌ LinkedIn scraping error:", scrapingError.message);

        // Fallback: Return a helpful message with the URL
        res.json({
          success: true,
          message: "LinkedIn content fetched (simplified)",
          data: {
            content: `LinkedIn Post Content from: ${url}\n\n📝 Note: Due to LinkedIn's restrictions, we couldn't extract the full content automatically.\n\n💡 Please copy and paste the post content manually for the best results.`,
            author: "LinkedIn User",
            title: "LinkedIn Post",
            url: url,
          },
        });
      }
    } catch (error) {
      console.error("LinkedIn content fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch LinkedIn content",
      });
    }
  }
);

// LinkedIn Profile Analysis endpoint - IMPROVED with real scraping
router.post(
  "/analyze-linkedin-profile",
  authenticateToken,
  [
    body("profileUrl")
      .isURL()
      .withMessage("Valid LinkedIn profile URL is required")
      .matches(/linkedin\.com/)
      .withMessage("Must be a valid LinkedIn URL"),
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { profileUrl } = req.body;
      const userId = req.user.userId;

      console.log("🔍 Analyzing LinkedIn profile for user:", userId);
      console.log("Profile URL:", profileUrl);

      // Subscription check (premium feature)
      const canUse = await subscriptionService.canPerformAction(
        userId,
        "analyze_linkedin"
      );
      if (!canUse.allowed) {
        return res.status(429).json({
          success: false,
          message:
            canUse.reason || "Upgrade to access LinkedIn Profile Analyzer",
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        });
      }

      // LinkedIn Profile Analyzer requires real data source integration
      // TODO: Integrate RapidAPI, ProxyCurl, or LinkedIn Official API
      return res.status(503).json({
        success: false,
        message: "LinkedIn Profile Analyzer is currently unavailable. Real-time profile analysis requires API integration (coming soon).",
        code: "FEATURE_UNAVAILABLE",
      });
    } catch (error) {
      console.error("❌ LinkedIn profile analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to analyze LinkedIn profile",
        error: error.message,
        details:
          "An unexpected error occurred. Please try again or contact support.",
      });
    }
  }
);

// Generate LinkedIn Post Ideas
router.post(
  "/generate-ideas",
  authenticateToken,
  checkTrialStatus,
  [
    body("topic")
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Topic must be between 10 and 1000 characters"),
    body("angle")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Content angle is required"),
    body("customAngle").optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array().map(e => e.msg).join(", "),
          errors: errors.array(),
        });
      }

      const {
        topic,
        angle,
        customAngle,
        tone = "professional",
        targetAudience = "general",
      } = req.body;
      const userId = req.user._id;

      console.log(`💡 Idea generation request from user ${userId}:`, {
        topic: topic?.substring(0, 50),
        angle,
        tone,
        targetAudience,
      });

      // Check subscription and quota for ideas
      let canGenerate;
      try {
        canGenerate = await subscriptionService.canPerformAction(
          userId,
          "generate_idea"
        );
      } catch (subError) {
        console.error("❌ Subscription check error:", subError.message);
        // Allow generation if subscription check fails (non-critical)
        canGenerate = { allowed: true };
      }
      if (!canGenerate.allowed) {
        return res.status(429).json({
          success: false,
          message: canGenerate.reason,
          code: "SUBSCRIPTION_LIMIT_EXCEEDED",
        });
      }

      // Validate known angles or custom angle
      const validAngles = [
        "all",
        "storytelling",
        "question",
        "listicle",
        "how-to",
        "observation",
        "humor",
      ];
      const isCustomAngle = !validAngles.includes(angle);

      if (isCustomAngle && !customAngle) {
        return res.status(400).json({
          success: false,
          message:
            "Custom angle description is required when using custom angle",
        });
      }

      console.log(`💡 Generating ideas for user ${userId}:`, {
        topic,
        angle: isCustomAngle ? "custom" : angle,
        customAngle: customAngle || "N/A",
        tone,
        targetAudience,
      });

      // Build the comprehensive prompt based on user's specifications
      const ideaPrompt = buildIdeaGenerationPrompt(
        topic,
        angle,
        tone,
        targetAudience,
        customAngle
      );

      // Generate ideas using Google AI
      let response;
      try {
        response = await googleAIService.generateText(ideaPrompt, {
          temperature: 0.9,
          maxOutputTokens: 3000,
        });
      } catch (aiError) {
        console.error("❌ Google AI error during idea generation:", {
          message: aiError.message,
          stack: aiError.stack,
        });
        throw new Error(`AI service error: ${aiError.message}`);
      }

      // Validate response
      if (!response || !response.text) {
        throw new Error("Invalid response from AI service");
      }

      // Parse the response into structured ideas
      let ideas;
      try {
        ideas = parseIdeasFromResponse(response.text, angle);
      } catch (parseError) {
        console.error("❌ Error parsing ideas from response:", parseError.message);
        console.error("Raw response text:", response.text?.substring(0, 500));
        
        // Fallback: try to extract ideas line by line
        try {
          const lines = response.text.split("\n").filter(l => l.trim().length > 10);
          if (lines.length >= 3) {
            ideas = lines.slice(0, 6).map((line, idx) => ({
              id: `idea-${Date.now()}-${idx}`,
              title: line.replace(/^[#*\-\d.]+\s*/, "").substring(0, 80),
              hook: line.replace(/^[#*\-\d.]+\s*/, "").substring(0, 50),
              angle: angle === "all" ? "mixed" : angle,
              framework: ["Opening context", "Main insight", "Actionable takeaway"],
              whyItWorks: "Relevant to your topic",
              developmentNotes: "Expand with personal examples",
              engagementPotential: "High",
              bestFor: "LinkedIn professionals",
            }));
            console.log(`✅ Fallback parsing: extracted ${ideas.length} ideas from raw text`);
          } else {
            throw new Error("Could not parse generated ideas. Please try again.");
          }
        } catch (fallbackError) {
          throw new Error("Could not parse generated ideas. Please try again.");
        }
      }

      if (!ideas || ideas.length === 0) {
        throw new Error("No ideas were generated. Please try a different topic or angle.");
      }

      // Track ideas usage separately
      try {
        await usageService.incrementUsage(
          userId,
          "ideas",
          response.tokensUsed || 150
        );
      } catch (usageError) {
        console.error("⚠️ Failed to track usage (non-critical):", usageError.message);
        // Don't fail the request if usage tracking fails
      }

      console.log(`✅ Generated ${ideas.length} ideas successfully`);

      res.json({
        success: true,
        message: `Generated ${ideas.length} post ideas`,
        data: { ideas },
      });
    } catch (error) {
      const reqTopic = req.body?.topic;
      const reqUserId = req.user?._id;
      console.error("❌ Idea generation error:", {
        message: error.message,
        stack: error.stack,
        userId: reqUserId,
        topic: reqTopic?.substring(0, 50),
      });
      
      const { status, message } = classifyAIError(error, "Failed to generate ideas. Please try again.");
      res.status(status).json({
        success: false,
        message,
        error: config.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Helper function to build idea generation prompt
function buildIdeaGenerationPrompt(
  topic,
  angle,
  tone,
  targetAudience,
  customAngle = null
) {
  // Check if this is a custom angle
  const validAngles = [
    "all",
    "storytelling",
    "question",
    "listicle",
    "how-to",
    "observation",
    "humor",
  ];
  const isCustomAngle = !validAngles.includes(angle);

  const angleInstructions = {
    storytelling: `Generate 5-6 story-driven post ideas about "${topic}". Each idea must:
- Include a SPECIFIC moment/scenario with details (numbers, names, exact moments)
- Follow a clear story arc: Setup → Challenge → Resolution → Lesson
- Make it vulnerable, surprising, or highly specific
- Include the EXACT opening hook (first 1-2 lines)

Story types to use:
1. Failure → Lesson → Success
2. Before I Knew → After I Learned (transformation)
3. Conversation That Changed Everything
4. The Day Everything Shifted
5. Mistake → Pivot → Breakthrough`,

    question: `Generate 5-6 thought-provoking question-based post ideas about "${topic}". Each must:
- Lead with a question that challenges common assumptions
- Create cognitive dissonance (makes people pause)
- Have multiple valid perspectives (no obvious answer)
- Include 2-3 follow-up questions to deepen discussion
- Include the EXACT opening question as the hook

Question types to use:
1. Paradox Questions (highlight contradictions)
2. Future Projection (force thinking ahead)
3. Devil's Advocate (challenge popular beliefs)
4. Trade-off Questions (no perfect answer)
5. Honest Reflection (invite vulnerability)`,

    listicle: `Generate 5-6 actionable list-based post ideas about "${topic}". Each must:
- Use specific numbers (3, 5, 7 for short; 10, 12 for longer)
- Each point must be actionable or insightful (no filler)
- Include one unexpected/contrarian item
- Use benefit-driven titles showing clear outcome
- Include the EXACT opening hook

List types to use:
1. Mistakes/Lessons: "X things I wish I knew before..."
2. Tactics/Hacks: "X ways to [achieve outcome]"
3. Signs/Red Flags: "X signs you're [situation]"
4. Frameworks: "X principles for [goal]"
5. Contrarian Takes: "X popular [practices] you should ignore"`,

    "how-to": `Generate 5-6 educational how-to post ideas about "${topic}". Each must:
- Break complex process into clear, sequential steps
- Include specific tools, frameworks, or templates
- Add time estimates when relevant
- Explain WHY each step matters, not just WHAT to do
- Make it actionable enough to implement immediately
- Include the EXACT opening hook

How-to types to use:
1. Process Breakdown: "How to [achieve outcome] in [number] steps"
2. Reverse Engineering: "I studied [X], here's what worked"
3. Framework Share: "The [Name] framework I use for [outcome]"
4. Template Walkthrough: "Copy this exact [thing] for [result]"
5. Before/After Transform: "How I went from [before] to [after]"`,

    observation: `Generate 5-6 insight-driven observation post ideas about "${topic}". Each must:
- Point out something obvious-in-hindsight but not noticed
- Use specific examples or data points
- Connect disparate concepts in non-obvious ways
- Make reader think "I never thought of it that way"
- Include the EXACT opening hook

Observation types:
1. Pattern Recognition: "I've noticed [X] always leads to [Y]"
2. Contradiction Spotting: "We say [X] but do [opposite]"
3. Trend Analysis: "Everyone's focused on [A], but [B] is the real shift"
4. Before/After Comparison: "Remember when [past]? Now [present]."
5. Cross-Domain Connection: "[Industry A] does [X]. Why doesn't [Industry B]?"`,

    humor: `Generate 5-6 relatable, professional humor post ideas about "${topic}". Each must:
- Use observational comedy about work/professional life
- Be self-deprecating but not undermining credibility
- Create "we've all been there" moments
- Balance: 70% relatable humor, 30% actionable insight
- Keep it professional (no offensive content)
- Include the EXACT opening hook

Humor types:
1. Expectation vs Reality
2. Industry Quirks
3. Relatable Struggles
4. Corporate Speak Translation
5. Self-Deprecating Wins`,

    all: `Generate 7-8 diverse post ideas about "${topic}" using MULTIPLE angles:
- 2 Story-based ideas (different story types)
- 2 Question-based ideas (different question types)
- 2 List-based ideas (different list types)
- 1 How-to idea
- 1 Observation or Humor idea

Ensure maximum variety and include the EXACT opening hook for each.`,
  };

  // If custom angle provided, create custom instructions
  let angleInstruction;
  if (isCustomAngle && customAngle) {
    angleInstruction = `Generate 5-6 post ideas about "${topic}" using the following CUSTOM CONTENT ANGLE:

**Custom Angle**: "${customAngle}"

For each idea:
- Interpret and apply the custom angle creatively
- Include a SPECIFIC, compelling hook that fits this angle
- Provide a clear content framework (3-5 points)
- Ensure ideas are unique and aligned with the custom approach
- Make the content engaging and authentic to the angle

Each idea should demonstrate a different way to apply this custom angle to the topic.`;
  } else {
    angleInstruction = angleInstructions[angle] || angleInstructions.all;
  }

  const basePrompt = `You are a LinkedIn Content Strategist AI specialized in generating high-performing post ideas.

**Topic**: ${topic}
**Content Angle**: ${isCustomAngle ? "Custom" : angle}
${isCustomAngle ? `**Custom Angle Description**: ${customAngle}` : ""}
**Tone**: ${tone}
**Target Audience**: ${targetAudience}

${angleInstruction}

**For EACH idea, provide:**

### Idea #{number}: {Short punchy title - MAX 35 CHARS}

**Hook**: "{Opening line - MAX 50 CHARS}"

**Angle**: {Story/Question/List/How-To/Observation/Humor}

**Content Framework**:
- {Point 1 - MAX 25 CHARS}
- {Point 2 - MAX 25 CHARS}
- {Point 3 - MAX 25 CHARS}

**Why This Works**: {Brief reason - MAX 40 CHARS}

**Engagement Potential**: {Low/Medium/High/Very High}

**Best For**: {Audience - MAX 20 CHARS}

---

**CRITICAL RULES:**
1. Hook must be SPECIFIC, not generic
2. No basic advice like "work hard" or "be consistent"
3. Ideas must be specific to the topic, not generic
4. Each idea must have a clear engagement trigger
5. Use specific numbers, details, and concrete examples
6. Make hooks that create curiosity, controversy, emotion, or utility

**HOOK ARCHITECTURE (NON-NEGOTIABLE — 80% of performance is the hook):**
- Treat the first 1–2 lines (the **Hook**) as 80% of the post's performance.
- Every idea MUST start from a strong hook that fits one or more of these 8 archetypes:

1. **Social Proof Hook**
   - Pattern: "I helped [X] do [Y]" / "We worked with [X clients] to..."
   - Examples:
     - "I helped a $50M ARR AI B2B SaaS go from X → Y..."
     - "We worked with 200+ YC-backed startups to learn this..."

2. **Credibility Hook**
   - Pattern: "I've generated [X] for [ICP]" / "I analyzed [X data points]..."
   - Examples:
     - "I've generated 40M impressions for B2B founders..."
     - "I analyzed 10,000 ad campaigns. Here's what actually works..."

3. **Story Hook**
   - Pattern: "I talked to [person] at [company]" / "I quit [company] and learned..."
   - Examples:
     - "I talked to the VP of Sales at a cybersec unicorn last week..."
     - "I quit my new job in 2 months. 5 things I wish I knew before..."

4. **Statistic Hook**
   - Pattern: "[Industry] is shifting. X% of [role] do Y / don't know Z."
   - Examples:
     - "98% of SDRs are still doing this in 2026."
     - "80% of CMOs chase the wrong metric. The top 1% do this instead..."

5. **Contrarian Hook**
   - Pattern: "[Common advice] is wrong" / "[Popular skill] is a waste of time."
   - Examples:
     - "'Post daily' is killing your growth."
     - "Learning copywriting the way everyone teaches it is a waste of time in 2026."

6. **Trend Hook**
   - Pattern: "[X is dead]" / "[Macro trend] is changing everything."
   - Examples:
     - "Cold email is dead for most teams."
     - "Big tech lost X% of its value. Here's what that means for operators."
     - "AI will replace your job if you don't do this in the next 12 months."

7. **Timeline Hook**
   - Pattern: short timeline beats: "Year: Situation" → "Year: Outcome"
   - Example:
     - "2020: Waiting tables at Denny’s\n2023: Launched a tiny agency\n2026: Crossed $1M ARR"

8. **Resource Hook**
   - Pattern: "I built/collected [resource]" / "Playbook / guide / list."
   - Examples:
     - "I built an exhaustive outbound playbook for technical founders."
     - "The 9-step system we used to triple demo bookings."
     - "30 LinkedIn creators worth following if you're a B2B founder."

- Frequently COMBINE 2–3 archetypes in a single hook (e.g., Social Proof + Credibility, Trend + Statistic, Story + Timeline, Resource + Credibility) while staying under the character limits.
- Hooks must feel concrete, believable, and tailored to the **Topic** and **Target Audience**, not generic templates.

**STRICT CHARACTER LIMITS (ENTIRE IDEA MUST BE UNDER 200 CHARS TOTAL):**
- Title: MAX 35 characters
- Hook: MAX 50 characters
- Framework Point 1: MAX 25 characters
- Framework Point 2: MAX 25 characters
- Framework Point 3: MAX 25 characters
- Why This Works: MAX 40 characters
- Best For: MAX 20 characters
TOTAL: Maximum 200 characters for the entire idea

ULTRA CONCISE. Use abbreviations if needed. No filler words. Maximum impact, minimum words.

Generate ${angle === "all" ? "7-8" : "5-6"} ideas now:`;

  return basePrompt;
}

// Helper function to parse AI response into structured ideas
function parseIdeasFromResponse(response, angle) {
  const ideas = [];

  // Split response by "### Idea #" markers
  const ideaSections = response
    .split(/###\s*Idea\s*#\d+:/i)
    .filter((s) => s.trim());

  ideaSections.forEach((section, index) => {
    try {
      const lines = section
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      // Extract title (first line)
      const title =
        lines[0]?.replace(/^[*_#]+\s*/, "").trim() || `Idea ${index + 1}`;

      // Extract hook (find line with "Hook:" or quoted text)
      const hookMatch =
        section.match(/\*\*Hook\*\*[:\s]*["""]([^"""]+)["""]/i) ||
        section.match(/Hook[:\s]*["""]([^"""]+)["""]/i) ||
        section.match(/Hook[:\s]*(.+?)(?:\n\*\*|$)/i);
      const hook = hookMatch ? hookMatch[1].trim() : title;

      // Extract angle
      const angleMatch =
        section.match(/\*\*Angle\*\*[:\s]*(.+?)(?:\n|$)/i) ||
        section.match(/Angle[:\s]*(.+?)(?:\n|$)/i);
      const ideaAngle = angleMatch ? angleMatch[1].trim() : angle;

      // Extract framework points
      const frameworkMatch =
        section.match(
          /\*\*Content Framework\*\*[:\s]*([\s\S]+?)(?:\n\*\*|$)/i
        ) || section.match(/Framework[:\s]*([\s\S]+?)(?:\n\*\*|$)/i);
      const frameworkText = frameworkMatch ? frameworkMatch[1] : "";
      const framework = frameworkText
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter((l) => l && l.length > 5)
        .slice(0, 5); // Limit to 5 points

      // Extract "Why This Works"
      const whyMatch =
        section.match(/\*\*Why This Works\*\*[:\s]*(.+?)(?:\n\*\*|$)/is) ||
        section.match(/Why This Works[:\s]*(.+?)(?:\n\*\*|$)/is);
      const whyItWorks = whyMatch
        ? whyMatch[1].trim()
        : "Creates engagement through relevance and actionability";

      // Extract Development Notes
      const notesMatch =
        section.match(/\*\*Development Notes\*\*[:\s]*(.+?)(?:\n\*\*|$)/is) ||
        section.match(/Development Notes[:\s]*(.+?)(?:\n\*\*|$)/is);
      const developmentNotes = notesMatch
        ? notesMatch[1].trim()
        : "Add personal examples and data to strengthen the post";

      // Extract Engagement Potential
      const engagementMatch =
        section.match(
          /\*\*Engagement Potential\*\*[:\s]*(Very High|High|Medium|Low)/i
        ) ||
        section.match(/Engagement Potential[:\s]*(Very High|High|Medium|Low)/i);
      const engagementPotential = engagementMatch
        ? engagementMatch[1].trim()
        : "High";

      // Extract Best For
      const bestForMatch =
        section.match(/\*\*Best For\*\*[:\s]*(.+?)(?:\n|$)/i) ||
        section.match(/Best For[:\s]*(.+?)(?:\n|$)/i);
      const bestFor = bestForMatch
        ? bestForMatch[1].trim()
        : "LinkedIn professionals";

      ideas.push({
        id: `idea-${Date.now()}-${index}`,
        title,
        hook,
        angle: ideaAngle,
        framework:
          framework.length > 0
            ? framework
            : [
                "Opening context and setup",
                "Main insight or lesson",
                "Supporting examples or data",
                "Actionable takeaway",
                "Closing question or call-to-action",
              ],
        whyItWorks,
        developmentNotes,
        engagementPotential,
        bestFor,
      });
    } catch (error) {
      console.error(`Error parsing idea ${index}:`, error);
    }
  });

  if (ideas.length === 0) {
    throw new Error("No ideas could be parsed from the response");
  }

  return ideas;
}

// Free post generation endpoint (no auth required) - for landing page "try before signup"
// Simple in-memory rate limiting (1 post per IP per 24 hours)
const freePostCache = new Map(); // IP -> timestamp
const FREE_POST_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper to get client IP
const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

// Smart hook selection based on context
const selectContextualHook = async (personaData, goal, topic, audience) => {
  try {
    // Analyze persona to determine preferred hook categories
    const personaName = (personaData?.name || "").toLowerCase();
    const personaIndustry = (personaData?.industry || "").toLowerCase();
    
    // Analyze goal
    const goalLower = (goal || "").toLowerCase();
    
    // Analyze topic for keywords
    const topicLower = (topic || "").toLowerCase();
    
    // Default categories to consider
    let preferredCategories = [];
    
    // Persona-based category preferences
    if (personaName.includes("founder") || personaName.includes("entrepreneur")) {
      preferredCategories = ["story", "insight", "challenge"];
    } else if (personaName.includes("marketer") || personaName.includes("marketing")) {
      preferredCategories = ["question", "statement", "insight"];
    } else if (personaName.includes("sales") || personaName.includes("recruiter")) {
      preferredCategories = ["question", "challenge", "statement"];
    } else if (personaName.includes("consultant") || personaName.includes("coach")) {
      preferredCategories = ["insight", "story", "question"];
    } else if (personaName.includes("student") || personaName.includes("job-seeker")) {
      preferredCategories = ["story", "question", "challenge"];
    } else if (personaName.includes("creator") || personaName.includes("content")) {
      preferredCategories = ["question", "statement", "insight"];
    } else {
      // Default mix
      preferredCategories = ["story", "question", "insight", "statement", "challenge"];
    }
    
    // Goal-based adjustments
    if (goalLower.includes("grow") || goalLower.includes("follower")) {
      preferredCategories = ["question", "challenge", ...preferredCategories.filter(c => c !== "question" && c !== "challenge")];
    } else if (goalLower.includes("lead") || goalLower.includes("sales")) {
      preferredCategories = ["question", "statement", ...preferredCategories.filter(c => c !== "question" && c !== "statement")];
    } else if (goalLower.includes("brand") || goalLower.includes("visibility")) {
      preferredCategories = ["story", "insight", ...preferredCategories.filter(c => c !== "story" && c !== "insight")];
    } else if (goalLower.includes("engagement") || goalLower.includes("interaction")) {
      preferredCategories = ["question", "challenge", ...preferredCategories.filter(c => c !== "question" && c !== "challenge")];
    }
    
    // Topic-based adjustments (keyword analysis)
    if (topicLower.includes("journey") || topicLower.includes("learned") || topicLower.includes("experience") || topicLower.includes("story")) {
      preferredCategories = ["story", ...preferredCategories.filter(c => c !== "story")];
    } else if (topicLower.includes("tip") || topicLower.includes("advice") || topicLower.includes("should") || topicLower.includes("mistake")) {
      preferredCategories = ["insight", "statement", ...preferredCategories.filter(c => c !== "insight" && c !== "statement")];
    } else if (topicLower.includes("why") || topicLower.includes("how") || topicLower.includes("what")) {
      preferredCategories = ["question", "insight", ...preferredCategories.filter(c => c !== "question" && c !== "insight")];
    }
    
    // Remove duplicates and prioritize
    preferredCategories = [...new Set(preferredCategories)];
    
    console.log("🎯 Contextual hook selection:", {
      persona: personaName,
      goal: goalLower,
      preferredCategories,
      topicKeywords: topicLower.substring(0, 50),
    });
    
    // Try to find hooks matching preferred categories
    for (const category of preferredCategories) {
      const hooks = await Hook.find({
        category: category,
        isActive: true,
      }).limit(20);
      
      if (hooks && hooks.length > 0) {
        // Select a random hook from the matched category (or one with lower usage for variety)
        const sortedHooks = hooks.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0));
        const selectedHook = sortedHooks[Math.floor(Math.random() * Math.min(5, sortedHooks.length))];
        
        console.log("✅ Selected contextual hook:", {
          text: selectedHook.text,
          category: selectedHook.category,
          usageCount: selectedHook.usageCount,
        });
        
        return {
          _id: selectedHook._id,
          text: selectedHook.text,
          category: selectedHook.category,
        };
      }
    }
    
    // Fallback: Get any active hook from DB (still real data)
    const fallbackHook = await Hook.findOne({ isActive: true });
    if (fallbackHook) {
      console.log("⚠️ Using fallback hook from DB:", fallbackHook.text);
      return {
        _id: fallbackHook._id,
        text: fallbackHook.text,
        category: fallbackHook.category,
      };
    }
    
    // No hooks in database at all - throw error instead of using fake default
    throw new Error("No hooks available in database. Please seed hooks first.");
  } catch (error) {
    console.error("Error selecting contextual hook:", error);
    throw error;
  }
};

// Free post generation - NO AUTH REQUIRED
router.post("/posts/generate-free", async (req, res) => {
  try {
    // Get client identifier (IP + User-Agent for better uniqueness)
    const ip = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";
    const identifier = `${ip}_${userAgent.substring(0, 50)}`;

    // Check if already used (simple in-memory cache with cleanup)
    const now = Date.now();
    const lastUsed = freePostCache.get(identifier);
    
    // Clean up old entries (older than 24 hours)
    if (lastUsed && now - lastUsed < FREE_POST_TTL) {
      return res.status(429).json({
        success: false,
        message: "You've already used your free post. Sign up to generate more!",
        code: "FREE_POST_ALREADY_USED",
      });
    }

    // Validate input
    const { topic, hookId, persona: personaData, audience, goal } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 10 || topic.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Topic must be between 10 and 500 characters",
      });
    }

    if (!personaData || !personaData.name) {
      return res.status(400).json({
        success: false,
        message: "Persona data is required",
      });
    }

    // Smart hook selection based on context (persona, goal, topic, audience)
    // Always select contextually for free posts to ensure variety and relevance
    let hook;
    if (hookId && hookId !== "default_free_hook" && hookId !== null && hookId !== undefined) {
      // Only use provided hookId if it's a valid database ID (for future flexibility)
      hook = await Hook.findById(hookId);
      if (!hook || !hook.isActive) {
        // If hook not found or inactive, select contextually
        hook = await selectContextualHook(personaData, goal, topic, audience);
      }
    } else {
      // No hookId provided or default hook - select contextually based on persona, goal, topic, and audience
      hook = await selectContextualHook(personaData, goal, topic, audience);
    }

    console.log("🆓 Free post generation:", {
      topic: topic.substring(0, 50),
      persona: personaData.name,
      hook: hook.text,
    });

    // Generate content using Google AI (same logic as authenticated users)
    // Build persona object from personaData
    const persona = {
      name: personaData.name || "Professional",
      tone: personaData.tone || "professional",
      writingStyle: personaData.writingStyle || personaData.description || "engaging",
      industry: personaData.industry || null,
      description: personaData.description || null,
    };

    // Add audience and goal context if provided
    const additionalContext = [];
    if (audience && audience.trim()) {
      additionalContext.push(`Target audience: ${audience.trim()}`);
    }
    if (goal && goal.trim()) {
      additionalContext.push(`Goal: ${goal.trim()}`);
    }

    // Generate post using Google AI service (free posts - no personalization)
    // Use lite model first to avoid rate limits on free tier
    const aiResponse = await googleAIService.generatePost(
      topic.trim(),
      hook.text,
      persona,
      null, // linkedinInsights
      null, // profileInsights
      null, // userProfile
      "plain", // Default formatting for free posts
      [], // No training posts for free users
      { preferLiteFirst: true, maxOutputTokens: 1024 }
    );

    // Track usage (store in cache with expiration)
    freePostCache.set(identifier, now);

    // Cleanup: Remove old entries periodically (simple cleanup on each request)
    if (freePostCache.size > 1000) {
      // If cache gets too large, clean up old entries
      for (const [key, timestamp] of freePostCache.entries()) {
        if (now - timestamp > FREE_POST_TTL) {
          freePostCache.delete(key);
        }
      }
    }

    // Save to database for analytics (optional)
    const content = new Content({
      type: "post",
      content: aiResponse.content,
      topic: topic.trim(),
      hookId: hook._id && hook._id !== "default_free_hook" ? hook._id : null,
      engagementScore: aiResponse.engagementScore,
      tokensUsed: aiResponse.tokensUsed,
      isFreePost: true,
      freePostIdentifier: identifier.substring(0, 100), // Store for analytics
    });

    await content.save().catch((err) => {
      console.error("Failed to save free post to database:", err);
      // Don't fail the request if DB save fails
    });

    console.log("✅ Free post generated successfully");

    res.json({
      success: true,
      message: "Post generated successfully",
      data: {
        content: {
          _id: content._id || `free_${Date.now()}`,
          content: aiResponse.content,
          engagementScore: aiResponse.engagementScore,
          topic: topic.trim(),
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Free post generation error:", error);
    const isQuota = /429|quota|rate limit|limit: 0/i.test(error.message);
    const isLeaked = /403|leaked|revoked/i.test(error.message);
    let message, status;
    if (isQuota) {
      message = "AI service is temporarily at capacity. Please try again in a minute.";
      status = 429;
    } else if (isLeaked) {
      message = "AI service configuration issue. The team has been notified. Please try again later.";
      status = 503;
    } else {
      message = error.message || "Failed to generate post";
      status = 500;
    }
    res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" && !isQuota && !isLeaked ? error.stack : undefined,
    });
  }
});

// Analyze content for LinkedIn optimization insights (REAL-TIME AI ANALYSIS)
router.post(
  "/analyze-optimization",
  authenticateToken,
  [
    body("content")
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 50 })
      .withMessage("Content must be at least 50 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { content, topic, audience } = req.body;
      const userId = req.user.userId;

      console.log("🔍 Analyzing content optimization for user:", userId);

      // Use AI service to analyze content
      const analysisResult = await googleAIService.analyzeContentOptimization(
        content,
        topic || null,
        audience || null
      );

      if (!analysisResult.success) {
        throw new Error("Failed to analyze content");
      }

      res.json({
        success: true,
        message: "Content analyzed successfully",
        data: analysisResult.data,
      });
    } catch (error) {
      console.error("Content optimization analysis error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to analyze content",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

export default router;
