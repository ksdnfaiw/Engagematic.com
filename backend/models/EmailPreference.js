import mongoose from "mongoose";

const emailPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    // Global unsubscribe
    unsubscribedAll: {
      type: Boolean,
      default: false,
    },
    unsubscribedAllAt: {
      type: Date,
    },
    // Specific email type preferences
    preferences: {
      marketing: {
        type: Boolean,
        default: true,
      },
      onboarding: {
        type: Boolean,
        default: true,
      },
      milestones: {
        type: Boolean,
        default: true,
      },
      trialReminders: {
        type: Boolean,
        default: true,
      },
      reengagement: {
        type: Boolean,
        default: true,
      },
      upgradePrompts: {
        type: Boolean,
        default: true,
      },
      transactional: {
        type: Boolean,
        default: true, // Always enabled - payment, security, etc.
      },
      featureUpdates: {
        type: Boolean,
        default: true,
      },
      plannerReminders: {
        enabled: { type: Boolean, default: false },
        time: { type: String, default: "09:00" }, // HH:mm format
        frequency: { type: String, enum: ["daily", "weekly", "weekdays"], default: "daily" },
        lastSentAt: { type: Date },
      },
    },
    // Unsubscribe token for secure links
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Track bounces
    bounceCount: {
      type: Number,
      default: 0,
    },
    lastBounceAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unsubscribe token before save
emailPreferenceSchema.pre("save", async function (next) {
  if (!this.unsubscribeToken) {
    const crypto = await import("crypto");
    this.unsubscribeToken = crypto.randomBytes(32).toString("hex");
  }
  next();
});

const EmailPreference = mongoose.model(
  "EmailPreference",
  emailPreferenceSchema
);

export default EmailPreference;

