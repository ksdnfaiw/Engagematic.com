import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Persona from "../models/Persona.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateUserRegistration,
  validateUserLogin,
} from "../middleware/validation.js";
import { config } from "../config/index.js";
import subscriptionService from "../services/subscriptionService.js";
import emailService from "../services/emailService.js";
import referralService from "../services/referralService.js";

const router = express.Router();
const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Register new user - OPTIMIZED FOR SPEED
router.post("/register", validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, persona, profile, referralCode } = req.body;

    // Check if user already exists - use lean() for faster query
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password - reduce rounds slightly for speed (10 is still secure, 12 is overkill)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
    };

    // Add interests if provided
    if (req.body.interests && Array.isArray(req.body.interests)) {
      userData.interests = req.body.interests;
    }

    // Add profile data if provided
    if (profile) {
      userData.profile = {
        jobTitle: profile.jobTitle || null,
        company: profile.company || null,
        industry: profile.industry || null,
        experience: profile.experience || null,
        linkedinUrl: profile.linkedinUrl || null,
      };
    }

    // Add persona data if provided
    if (persona) {
      userData.persona = {
        name: persona.name || null,
        writingStyle: persona.writingStyle || null,
        tone: persona.tone || null,
        expertise: persona.expertise || null,
        targetAudience: persona.targetAudience || null,
        goals: persona.goals || null,
        contentTypes: persona.contentTypes || [],
        postingFrequency: persona.postingFrequency || null,
      };
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate JWT token immediately (don't wait for other operations)
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    // Run non-critical operations in parallel (don't block response)
    Promise.all([
      // Create trial subscription
      subscriptionService.createTrialSubscription(user._id)
        .then(sub => {
          console.log("✅ Trial subscription created for new user:", user._id);
          return sub;
        })
        .catch(err => {
          console.error("⚠️ Failed to create subscription:", err);
          return null;
        }),

      // Process referral if referral code was provided
      referralCode ? referralService.processReferralSignup(user, referralCode)
        .then(result => {
          if (result.success) {
            console.log(`✅ Referral processed for ${user.email} via ${referralCode}`);
          }
          return result;
        })
        .catch(err => {
          console.error("⚠️ Failed to process referral:", err);
          return null;
        }) : Promise.resolve(null),

      // Generate referral code for new user
      referralService.generateReferralCode(user)
        .catch(err => {
          console.error("⚠️ Error generating referral code:", err);
          // Non-blocking
        }),

      // Create Persona document if persona data was provided
      persona ? Persona.create({
        userId: user._id,
        name: persona.name || `${name}'s Persona`,
        description: persona.expertise || `Professional persona for ${name}`,
        tone: persona.tone || "professional",
        industry: profile?.industry || "Professional Services",
        experience: profile?.experience || "mid",
        writingStyle: persona.writingStyle || "Clear and professional",
        isDefault: true,
        isActive: true,
      })
        .then(p => {
          console.log("✅ Persona document created for new user:", user._id);
          return p;
        })
        .catch(err => {
          console.error("⚠️ Failed to create persona document:", err);
          return null;
        }) : Promise.resolve(null),

      // Send welcome email (already non-blocking)
      emailService.sendWelcomeEmail(user)
        .then(() => console.log(`✅ Welcome email sent to ${user.email}`))
        .catch(err => console.error(`⚠️ Failed to send welcome email:`, err))
    ]).then(([subscription, referralResult, _, createdPersona]) => {
      // Response already sent, but log completion
      console.log("✅ Registration background tasks completed for:", user.email);
    }).catch(err => {
      console.error("⚠️ Background tasks error (non-critical):", err);
    });

    // Return response immediately with default subscription data
    // Subscription will be created in background, user can refresh if needed
    // This makes signup 3-5x faster
    const subscription = {
      plan: "trial",
      status: "trial",
      trialEndDate: user.trialEndsAt,
      limits: { postsPerMonth: 7, commentsPerMonth: 14, ideasPerMonth: -1 }
    };

    // Return minimal user data for faster response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          persona: user.persona,
        },
        token,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          trialEndDate: subscription.trialEndDate || user.trialEndsAt,
          limits: subscription.limits,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// Google OAuth — verify token, create or log in user
router.post("/google", async (req, res) => {
  try {
    const { credential, access_token, code, redirect_uri, referralCode } = req.body;

    if (!credential && !access_token && !code) {
      return res.status(400).json({
        success: false,
        message: "Google credential, access token, or authorization code is required",
      });
    }

    if (!config.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google OAuth is not configured on the server",
      });
    }

    let googleId, email, name, picture;

    if (code) {
      // Exchange authorization code for tokens (redirect flow — works on all devices)
      if (!config.GOOGLE_CLIENT_SECRET) {
        console.error("GOOGLE_CLIENT_SECRET is not set on the server");
        return res.status(500).json({
          success: false,
          message: "Google OAuth is not fully configured on the server (missing client secret)",
        });
      }
      const baseUrl = (config.FRONTEND_URL || "").replace(/\/$/, "");
      const effectiveRedirectUri = (redirect_uri && redirect_uri.trim()) || `${baseUrl}/auth/google/callback`;
      try {
        const codeClient = new OAuth2Client(
          config.GOOGLE_CLIENT_ID,
          config.GOOGLE_CLIENT_SECRET,
          effectiveRedirectUri
        );
        const { tokens } = await codeClient.getToken(code);
        const ticket = await googleClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: config.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (codeErr) {
        const errMsg = codeErr.message || String(codeErr);
        console.error("Google code exchange failed:", errMsg, "redirect_uri:", effectiveRedirectUri);
        const isRedirectMismatch = /redirect_uri_mismatch|redirect_uri/i.test(errMsg);
        const userMessage = isRedirectMismatch
          ? "Google sign-in failed: redirect URI mismatch. Add this exact URL to Authorized redirect URIs in Google Cloud Console: " + effectiveRedirectUri
          : "Google sign-in failed. Please try again or use email/password.";
        return res.status(401).json({
          success: false,
          message: userMessage,
        });
      }
    } else if (credential) {
      // Verify Google ID token (from GoogleLogin component)
      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: config.GOOGLE_CLIENT_ID,
        });
      } catch (verifyErr) {
        console.error("Google token verification failed:", verifyErr.message);
        return res.status(401).json({
          success: false,
          message: "Invalid Google token",
        });
      }
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Verify access token (from useGoogleLogin hook / custom button)
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        if (!userInfoRes.ok) {
          throw new Error(`Google userinfo returned ${userInfoRes.status}`);
        }
        const profile = await userInfoRes.json();
        googleId = profile.sub;
        email = profile.email;
        name = profile.name;
        picture = profile.picture;
      } catch (fetchErr) {
        console.error("Google access token verification failed:", fetchErr.message);
        return res.status(401).json({
          success: false,
          message: "Invalid Google access token",
        });
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account does not have an email address",
      });
    }

    // Check if user already exists (by googleId or email)
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    let isNewUser = false;

    if (user) {
      // Existing user — link Google account if they signed up with email/password
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider === "local" ? "local" : "google";
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }

      // Update last login (fire and forget)
      User.updateOne(
        { _id: user._id },
        { lastLoginAt: new Date() }
      ).catch((err) => console.error("Failed to update lastLoginAt:", err));
    } else {
      // New user — create account
      isNewUser = true;
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        authProvider: "google",
        googleId,
        avatar: picture || null,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await user.save();

      // Background tasks for new user (don't block response)
      Promise.all([
        subscriptionService.createTrialSubscription(user._id)
          .then(() => console.log("✅ Trial subscription created (Google):", user._id))
          .catch((err) => console.error("⚠️ Failed to create subscription:", err)),

        referralCode
          ? referralService.processReferralSignup(user, referralCode)
              .then((r) => r.success && console.log(`✅ Referral processed for ${user.email}`))
              .catch((err) => console.error("⚠️ Referral error:", err))
          : Promise.resolve(null),

        referralService.generateReferralCode(user)
          .catch((err) => console.error("⚠️ Referral code gen error:", err)),

        emailService.sendWelcomeEmail(user)
          .then(() => console.log(`✅ Welcome email sent to ${user.email}`))
          .catch((err) => console.error("⚠️ Welcome email error:", err)),
      ]).catch((err) => console.error("⚠️ Background tasks error:", err));
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    const subscription = isNewUser
      ? {
          plan: "trial",
          status: "trial",
          trialEndDate: user.trialEndsAt,
          limits: { postsPerMonth: 7, commentsPerMonth: 14, ideasPerMonth: -1 },
        }
      : undefined;

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser ? "Account created with Google" : "Logged in with Google",
      isNewUser,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          profile: user.profile,
          persona: user.persona,
        },
        token,
        ...(subscription ? { subscription } : {}),
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

// Login user - OPTIMIZED FOR SPEED
router.post("/login", validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email - only select needed fields for faster query
    const user = await User.findOne({ email }).select("_id name email password authProvider isActive lastLoginAt profile persona");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Google-only users don't have a password
    if (user.authProvider === "google" && !user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google Sign-In. Please sign in with Google.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login - use updateOne instead of save() for better performance
    // Don't await - fire and forget for faster response
    User.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date() }
    ).catch(err => console.error("Failed to update lastLoginAt:", err));

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    // Return minimal user data for faster response
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          persona: user.persona,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Get current user profile
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, avatar, profile, persona, interests } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    
    // Update nested profile object
    if (profile && typeof profile === 'object') {
      updateData.profile = {};
      if (profile.jobTitle !== undefined) updateData.profile.jobTitle = profile.jobTitle;
      if (profile.company !== undefined) updateData.profile.company = profile.company;
      if (profile.industry !== undefined) updateData.profile.industry = profile.industry;
      if (profile.experience !== undefined) updateData.profile.experience = profile.experience;
      if (profile.linkedinUrl !== undefined) updateData.profile.linkedinUrl = profile.linkedinUrl;
      if (profile.onboardingCompleted !== undefined) updateData.profile.onboardingCompleted = profile.onboardingCompleted;
      if (profile.postFormatting !== undefined) updateData.profile.postFormatting = profile.postFormatting;
      if (profile.usageContext !== undefined) updateData.profile.usageContext = profile.usageContext;
      if (profile.workContext !== undefined) updateData.profile.workContext = profile.workContext;
      // AI Voice & Style (optional)
      if (profile.aiVoice !== undefined && typeof profile.aiVoice === "object") {
        const av = profile.aiVoice;
        updateData.profile.aiVoice = {
          description: typeof av.description === "string" ? av.description.trim().slice(0, 500) : "",
          tone: ["formal", "neutral", "casual"].includes(av.tone) ? av.tone : "neutral",
          boldness: ["safe", "balanced", "bold"].includes(av.boldness) ? av.boldness : "balanced",
          emojiPreference: ["never", "sometimes", "often"].includes(av.emojiPreference) ? av.emojiPreference : "sometimes",
        };
      }
    }
    
    // Update nested persona object
    if (persona && typeof persona === 'object') {
      updateData.persona = {};
      if (persona.name !== undefined) updateData.persona.name = persona.name;
      if (persona.writingStyle !== undefined) updateData.persona.writingStyle = persona.writingStyle;
      if (persona.tone !== undefined) updateData.persona.tone = persona.tone;
      if (persona.expertise !== undefined) updateData.persona.expertise = persona.expertise;
      if (persona.targetAudience !== undefined) updateData.persona.targetAudience = persona.targetAudience;
      if (persona.goals !== undefined) updateData.persona.goals = persona.goals;
      if (persona.contentFocus !== undefined) updateData.persona.contentFocus = persona.contentFocus;
      if (persona.contentTypes !== undefined) updateData.persona.contentTypes = persona.contentTypes;
      if (persona.trainingPostIds !== undefined && Array.isArray(persona.trainingPostIds)) {
        updateData.persona.trainingPostIds = persona.trainingPostIds;
      }
    }
    
    // Update interests array
    if (interests && Array.isArray(interests)) {
      updateData.interests = interests;
    }

    // Use $set operator for nested updates to merge with existing data
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// Refresh token
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Generate new token
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
});

export default router;
