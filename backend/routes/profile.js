import express from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";
import { checkProfileCompletion } from "../middleware/profileCompletion.js";
import User from "../models/User.js";
import Persona from "../models/Persona.js";
import Payment from "../models/Payment.js";
import UserSubscription from "../models/UserSubscription.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const router = express.Router();

// Check profile completion status
router.get(
  "/status",
  authenticateToken,
  checkProfileCompletion,
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          isComplete: req.profileComplete,
          status: req.profileStatus,
        },
      });
    } catch (error) {
      console.error("Profile status check error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Complete basic profile information
router.post(
  "/complete-basic",
  authenticateToken,
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("linkedinUrl")
      .notEmpty()
      .withMessage("LinkedIn URL is required")
      .isURL()
      .withMessage("Please provide a valid LinkedIn URL"),
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

      const userId = req.user.userId;
      const { name, linkedinUrl } = req.body;

      // Update user profile
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          name: name.trim(),
          linkedinUrl: linkedinUrl.trim(),
        },
        { new: true }
      ).select("name email linkedinUrl");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Profile completion error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Get profile completion requirements
router.get(
  "/requirements",
  authenticateToken,
  checkProfileCompletion,
  async (req, res) => {
    try {
      const requirements = {
        basicProfile: {
          name: {
            required: true,
            description: "Your full name",
            completed:
              req.profileStatus.hasBasicProfile &&
              !req.profileStatus.missingFields.includes("name"),
          },
          email: {
            required: true,
            description: "Your email address",
            completed:
              req.profileStatus.hasBasicProfile &&
              !req.profileStatus.missingFields.includes("email"),
          },
          linkedinUrl: {
            required: true,
            description: "Your LinkedIn profile URL",
            completed:
              req.profileStatus.hasBasicProfile &&
              !req.profileStatus.missingFields.includes("linkedinUrl"),
          },
        },
        persona: {
          required: true,
          description: "At least one AI persona for content generation",
          completed: req.profileStatus.hasPersona,
          count: req.profileStatus.personaCount,
        },
      };

      res.json({
        success: true,
        data: {
          requirements,
          isComplete: req.profileComplete,
          nextStep: req.profileComplete
            ? null
            : req.profileStatus.hasBasicProfile
            ? "Create your first AI persona"
            : "Complete your basic profile information",
        },
      });
    } catch (error) {
      console.error("Profile requirements error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Update user profile information (merge profile fields so we don't overwrite)
router.put("/update", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const setOps = {};

    if (updates.name !== undefined) setOps.name = updates.name;

    if (updates.profile && typeof updates.profile === "object") {
      const p = updates.profile;
      if (p.jobTitle !== undefined) setOps["profile.jobTitle"] = p.jobTitle;
      if (p.company !== undefined) setOps["profile.company"] = p.company;
      if (p.bio !== undefined) setOps["profile.bio"] = p.bio;
      if (p.linkedinUrl !== undefined) setOps["profile.linkedinUrl"] = p.linkedinUrl;
      if (p.postFormatting !== undefined) setOps["profile.postFormatting"] = p.postFormatting;
      if (p.usageContext !== undefined) setOps["profile.usageContext"] = p.usageContext;
      if (p.workContext !== undefined) setOps["profile.workContext"] = p.workContext;
      if (p.industry !== undefined) setOps["profile.industry"] = p.industry;
      if (p.experience !== undefined) setOps["profile.experience"] = p.experience;
      if (p.onboardingCompleted !== undefined) setOps["profile.onboardingCompleted"] = p.onboardingCompleted;

      if (p.aiVoice !== undefined) {
        const av = typeof p.aiVoice === "object" ? p.aiVoice : {};
        setOps["profile.aiVoice"] = {
          description: typeof av.description === "string" ? av.description.trim().slice(0, 6000) : "",
          tone: ["formal", "neutral", "casual"].includes(av.tone) ? av.tone : "neutral",
          boldness: ["safe", "balanced", "bold"].includes(av.boldness) ? av.boldness : "balanced",
          emojiPreference: ["never", "sometimes", "often"].includes(av.emojiPreference) ? av.emojiPreference : "sometimes",
        };
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: setOps },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

// Change password
router.post(
  "/change-password",
  authenticateToken,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
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

      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
        error: error.message,
      });
    }
  }
);

// Update email preferences
router.put("/email-preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productEmails, marketingEmails, updatesEmails } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        emailPreferences: {
          product: productEmails !== undefined ? productEmails : true,
          marketing: marketingEmails !== undefined ? marketingEmails : true,
          updates: updatesEmails !== undefined ? updatesEmails : true,
        },
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Email preferences updated",
      data: updatedUser.emailPreferences,
    });
  } catch (error) {
    console.error("Email preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update email preferences",
      error: error.message,
    });
  }
});

// Get user data export
router.get("/export-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Collect all user data
    const [user, personas, payments, subscription, content] = await Promise.all(
      [
        User.findById(userId).select("-password"),
        Persona.find({ userId }),
        Payment.find({ userId }),
        UserSubscription.findOne({ userId }),
        // Add Content collection if needed
      ]
    );

    const exportData = {
      profile: user,
      personas,
      payments,
      subscription,
      exportedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error("Data export error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data",
      error: error.message,
    });
  }
});

// Delete account
router.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmation } = req.body;

    if (confirmation !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: "Please confirm account deletion by typing DELETE",
      });
    }

    // Delete user and related data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Persona.deleteMany({ userId }),
      Payment.deleteMany({ userId }),
      UserSubscription.findOneAndDelete({ userId }),
      // Add other related data cleanup
    ]);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
});

export default router;
