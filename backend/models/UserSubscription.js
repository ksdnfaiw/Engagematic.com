import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Subscription details
    plan: {
      type: String,
      // Added 'custom' to support credit-based custom plans
      enum: ["trial", "starter", "pro", "elite", "custom"],
      default: "trial",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "trial", "expired", "cancelled", "paused"],
      default: "trial",
      required: true,
    },

    // Trial period
    trialStartDate: {
      type: Date,
      default: Date.now,
    },

    trialEndDate: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      },
    },

    // Subscription period
    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    // Token tracking
    tokens: {
      total: {
        type: Number,
        default: 0,
      },
      used: {
        type: Number,
        default: 0,
      },
      remaining: {
        type: Number,
        default: 0,
      },
      resetDate: {
        type: Date,
        default: function () {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1); // First day of next month
          return nextMonth;
        },
      },
    },

    // Plan limits
    limits: {
      postsPerMonth: {
        type: Number,
        default: 7, // Trial: 1 post per day for 7 days
      },
      commentsPerMonth: {
        type: Number,
        default: 14, // Trial: 2 comments per day for 7 days
      },
      ideasPerMonth: {
        type: Number,
        default: 14, // Trial: 2 ideas per day for 7 days
      },
      templatesAccess: {
        type: Boolean,
        default: true,
      },
      linkedinAnalysis: {
        type: Boolean,
        default: true,
      },
      profileAnalyses: {
        type: Number,
        default: -1, // UNLIMITED profile analyses
      },
      transcriptsPerMonth: {
        type: Number,
        default: 3, // Trial: 3 per month
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
    },

    // Billing
    billing: {
      amount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
      interval: {
        type: String,
        enum: ["monthly", "yearly", "one-time"],
        default: "monthly",
      },
      nextBillingDate: {
        type: Date,
        default: null,
      },
      paymentMethod: {
        type: String,
        default: null,
      },
    },

    // Usage tracking
    usage: {
      postsGenerated: {
        type: Number,
        default: 0,
      },
      commentsGenerated: {
        type: Number,
        default: 0,
      },
      ideasGenerated: {
        type: Number,
        default: 0,
      },
      templatesUsed: {
        type: Number,
        default: 0,
      },
      linkedinAnalyses: {
        type: Number,
        default: 0,
      },
      profileAnalyses: {
        type: Number,
        default: 0,
      },
      transcriptsGenerated: {
        type: Number,
        default: 0,
      },
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update limits based on plan
userSubscriptionSchema.pre("save", function (next) {
  if (this.isModified("plan")) {
    switch (this.plan) {
      case "trial":
        this.limits.postsPerMonth = 3; // 3 posts for free trial
        this.limits.commentsPerMonth = 10; // 10 comments for free trial
        this.limits.ideasPerMonth = -1; // UNLIMITED ideas for all users
        this.limits.templatesAccess = true;
        this.limits.linkedinAnalysis = true;
        this.limits.profileAnalyses = 1; // 1 profile analysis for free trial
        this.limits.transcriptsPerMonth = 3; // 3 transcripts for free trial
        this.limits.prioritySupport = false;
        this.billing.amount = 0;
        break;

      case "starter":
        this.limits.postsPerMonth = 15; // 15 posts per month
        this.limits.commentsPerMonth = 30; // 30 comments per month
        this.limits.ideasPerMonth = -1; // UNLIMITED ideas per month
        this.limits.templatesAccess = true;
        this.limits.linkedinAnalysis = true;
        this.limits.profileAnalyses = 5; // 5 profile analyses per month
        this.limits.transcriptsPerMonth = 5; // 5 transcripts per month
        this.limits.prioritySupport = false;
        this.billing.amount = 199; // ₹199/month (INR)
        break;

      case "pro":
        this.limits.postsPerMonth = 60; // 60 posts per month
        this.limits.commentsPerMonth = 80; // 80 comments per month
        this.limits.ideasPerMonth = -1; // UNLIMITED ideas per month
        this.limits.templatesAccess = true;
        this.limits.linkedinAnalysis = true;
        this.limits.profileAnalyses = 10; // 10 profile analyses per month
        this.limits.transcriptsPerMonth = 30; // 30 transcripts per month
        this.limits.prioritySupport = true;
        this.billing.amount = 449; // ₹449/month (INR)
        break;

      case "elite":
        this.limits.postsPerMonth = 200; // High volume for agencies
        this.limits.commentsPerMonth = 300; // High engagement capacity
        this.limits.ideasPerMonth = 200; // Plenty of content ideas
        this.limits.templatesAccess = true;
        this.limits.linkedinAnalysis = true;
        this.limits.profileAnalyses = -1; // UNLIMITED profile analyses
        this.limits.transcriptsPerMonth = 100; // 100 transcripts per month
        this.limits.prioritySupport = true; // Dedicated manager
        this.billing.amount = 49; // $49/month
        break;
    }
  }

  // Calculate remaining tokens
  this.tokens.remaining = this.tokens.total - this.tokens.used;

  next();
});

// Method to check if user can perform action
userSubscriptionSchema.methods.canPerformAction = function (action) {
  const now = new Date();

  // Check if trial is expired
  if (this.status === "trial" && now > this.trialEndDate) {
    return { allowed: false, reason: "Trial expired" };
  }

  // Check if subscription is active
  if (this.status === "expired" || this.status === "cancelled") {
    return { allowed: false, reason: "Subscription expired or cancelled" };
  }

  // Check usage limits
  switch (action) {
    case "generate_post":
      if (this.usage.postsGenerated >= this.limits.postsPerMonth) {
        return { allowed: false, reason: "Monthly post limit reached" };
      }
      break;

    case "generate_comment":
      if (this.usage.commentsGenerated >= this.limits.commentsPerMonth) {
        return { allowed: false, reason: "Monthly comment limit reached" };
      }
      break;

    case "generate_idea":
      // -1 means unlimited
      if (this.limits.ideasPerMonth !== -1 && this.usage.ideasGenerated >= this.limits.ideasPerMonth) {
        return { allowed: false, reason: "Monthly idea limit reached" };
      }
      break;

    case "use_template":
      if (!this.limits.templatesAccess) {
        return {
          allowed: false,
          reason: "Templates not available in current plan",
        };
      }
      break;

    case "analyze_linkedin":
      if (!this.limits.linkedinAnalysis) {
        return {
          allowed: false,
          reason: "LinkedIn analysis not available in current plan",
        };
      }
      break;

    case "analyze_profile":
      // Check if feature is available
      if (this.limits.profileAnalyses === 0) {
        return {
          allowed: false,
          reason:
            "Profile analysis not available in your plan. Please upgrade.",
          code: "FEATURE_NOT_AVAILABLE",
        };
      }
      // Check usage limit (unlimited = -1)
      if (
        this.limits.profileAnalyses !== -1 &&
        this.usage.profileAnalyses >= this.limits.profileAnalyses
      ) {
        return {
          allowed: false,
          reason: `Profile analysis limit (${this.limits.profileAnalyses}) reached. Upgrade for more analyses.`,
          code: "ANALYSIS_LIMIT_EXCEEDED",
          current: this.usage.profileAnalyses,
          limit: this.limits.profileAnalyses,
        };
      }
      break;

    case "generate_transcript":
      if (
        this.limits.transcriptsPerMonth !== -1 &&
        this.usage.transcriptsGenerated >= this.limits.transcriptsPerMonth
      ) {
        return {
          allowed: false,
          reason: `Transcription limit (${this.limits.transcriptsPerMonth}) reached. Upgrade for more transcriptions.`,
          code: "TRANSCRIPT_LIMIT_EXCEEDED",
          current: this.usage.transcriptsGenerated,
          limit: this.limits.transcriptsPerMonth,
        };
      }
      break;
  }

  return { allowed: true };
};

// Method to record usage
userSubscriptionSchema.methods.recordUsage = function (action) {
  switch (action) {
    case "generate_post":
      this.usage.postsGenerated += 1;
      this.tokens.used += 5; // 5 tokens per post (increased from 1)
      break;

    case "generate_comment":
      this.usage.commentsGenerated += 1;
      this.tokens.used += 3; // 3 tokens per comment (increased from 1)
      break;

    case "generate_idea":
      this.usage.ideasGenerated += 1;
      this.tokens.used += 4; // 4 tokens per idea generation
      break;

    case "analyze_profile":
      this.usage.profileAnalyses += 1;
      this.tokens.used += 10; // 10 tokens per profile analysis
      break;

    case "use_template":
      this.usage.templatesUsed += 1;
      this.tokens.used += 2; // 2 tokens per template use
      break;

    case "analyze_linkedin":
      this.usage.linkedinAnalyses += 1;
      this.tokens.used += 8; // 8 tokens per LinkedIn analysis
      break;

    case "generate_transcript":
      this.usage.transcriptsGenerated += 1;
      this.tokens.used += 10; // 10 tokens per transcript
      break;
  }

  this.tokens.remaining = this.tokens.total - this.tokens.used;
  this.updatedAt = new Date();

  return this.save();
};

// Method to reset monthly usage
userSubscriptionSchema.methods.resetMonthlyUsage = function () {
  const now = new Date();

  if (now >= this.tokens.resetDate) {
    this.usage.postsGenerated = 0;
    this.usage.commentsGenerated = 0;
    this.usage.ideasGenerated = 0;
    this.usage.templatesUsed = 0;
    this.usage.linkedinAnalyses = 0;
    this.usage.profileAnalyses = 0; // Reset profile analyses count
    this.tokens.used = 0;
    this.tokens.remaining = this.tokens.total;

    // Set next reset date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    this.tokens.resetDate = nextMonth;

    this.updatedAt = new Date();
    return this.save();
  }

  return Promise.resolve(this);
};

// Method to upgrade plan
userSubscriptionSchema.methods.upgradePlan = function (newPlan) {
  this.plan = newPlan;
  this.status = "active";
  this.subscriptionStartDate = new Date();

  // Set subscription end date based on billing interval
  const endDate = new Date();
  if (this.billing.interval === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  this.subscriptionEndDate = endDate;
  this.nextBillingDate = endDate;

  return this.save();
};

// Static method to create trial subscription
userSubscriptionSchema.statics.createTrial = function (userId) {
  return this.create({
    userId,
    plan: "trial",
    status: "trial",
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    limits: {
      postsPerMonth: 3,
      commentsPerMonth: 10,
      ideasPerMonth: -1,
      templatesAccess: true,
      linkedinAnalysis: true,
      profileAnalyses: -1,
      transcriptsPerMonth: 3,
      prioritySupport: false,
    },
    tokens: {
      total: 95, // 3 posts * 5 + 10 comments * 3 + 10 ideas * 4 = 15 + 30 + 40 = 85
      used: 0,
      remaining: 95,
    },
  });
};

export default mongoose.model("UserSubscription", userSubscriptionSchema);
