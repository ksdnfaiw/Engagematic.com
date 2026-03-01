import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      // Allow 'custom' as a plan value to reflect credit-based purchases
      enum: ["starter", "pro", "elite", "custom"],
      default: "starter",
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "cancelled", "trial"],
      default: "trial",
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    // Referral System
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referredByCode: {
      type: String,
      uppercase: true,
      default: null,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    referralRewards: {
      freeMonthsEarned: {
        type: Number,
        default: 0,
      },
      freeMonthsUsed: {
        type: Number,
        default: 0,
      },
      extendedTrial: {
        type: Boolean,
        default: false,
      },
    },
    // Professional Profile Information
    profile: {
      jobTitle: {
        type: String,
        default: null,
      },
      company: {
        type: String,
        default: null,
      },
      industry: {
        type: String,
        default: null,
      },
      experience: {
        type: String,
        default: null,
      },
      linkedinUrl: {
        type: String,
        default: null,
      },
      bio: {
        type: String,
        default: null,
      },
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },
      postFormatting: {
        type: String,
        enum: ["plain", "bold", "italic", "emoji"],
        default: "plain",
      },
      usageContext: {
        type: String,
        default: null,
      },
      workContext: {
        type: String,
        default: null,
      },
      // Custom AI Voice & Style (optional)
      aiVoice: {
        description: { type: String, default: "", maxlength: 500 },
        tone: {
          type: String,
          enum: ["formal", "neutral", "casual"],
          default: "neutral",
        },
        boldness: {
          type: String,
          enum: ["safe", "balanced", "bold"],
          default: "balanced",
        },
        emojiPreference: {
          type: String,
          enum: ["never", "sometimes", "often"],
          default: "sometimes",
        },
      },
    },
    // User interests/topics
    interests: [
      {
        type: String,
      },
    ],
    // AI Persona Information
    persona: {
      name: {
        type: String,
        default: null,
      },
      writingStyle: {
        type: String,
        default: null,
      },
      tone: {
        type: String,
        default: null,
      },
      expertise: {
        type: String,
        default: null,
      },
      targetAudience: {
        type: String,
        default: null,
      },
      goals: {
        type: String,
        default: null,
      },
      contentFocus: {
        type: String,
        default: null,
      },
      contentTypes: [
        {
          type: String,
        },
      ],
      postingFrequency: {
        type: String,
        default: null,
      },
      trainingPostIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Content",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: email index is already created by unique: true
userSchema.index({ subscriptionId: 1 });
userSchema.index({ email: 1, isActive: 1 }); // Compound index for login queries
userSchema.index({ isActive: 1 }); // For filtering active users
userSchema.index({ createdAt: -1 }); // Email scheduler: onboarding queries
userSchema.index({ subscriptionStatus: 1, trialEndsAt: 1 }); // Email scheduler: trial expiry queries
userSchema.index({ lastLoginAt: 1, isActive: 1 }); // Email scheduler: re-engagement queries

const User = mongoose.model("User", userSchema);

export default User;
