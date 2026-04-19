import UserSubscription from "../models/UserSubscription.js";
import User from "../models/User.js";
import emailService from "./emailService.js";

class TrialService {
  constructor() {
    this.trialLimits = {
      posts: 7, // 1 post per day for 7 days
      comments: 14, // 2 comments per day for 7 days
      ideas: -1, // UNLIMITED ideas for all users
      transcripts: 3, // 3 transcripts for free users
    };
  }

  /**
   * Create trial subscription for new user
   */
  async createTrialSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check if user already has a subscription
      let subscription = await UserSubscription.findOne({ userId });

      if (!subscription) {
        subscription = new UserSubscription({
          userId,
          plan: "trial",
          status: "trial",
          limits: {
            postsPerMonth: this.trialLimits.posts,
            commentsPerMonth: this.trialLimits.comments,
            ideasPerMonth: this.trialLimits.ideas,
            templatesAccess: true,
            linkedinAnalysis: true,
            profileAnalyses: -1, // UNLIMITED profile analyses
            prioritySupport: false,
          },
          billing: {
            amount: 0,
            currency: "USD",
            interval: "monthly",
            nextBillingDate: null,
          },
          tokens: {
            total: this.calculateTokens(this.trialLimits),
            used: 0,
            remaining: this.calculateTokens(this.trialLimits),
          },
          trialEndDate: user.trialEndsAt,
        });

        await subscription.save();
        console.log(`✅ Created trial subscription for user: ${user.email}`);
      }

      return subscription;
    } catch (error) {
      console.error("Error creating trial subscription:", error);
      throw error;
    }
  }

  /**
   * Check if user can perform action during trial
   */
  async canPerformTrialAction(userId, action) {
    try {
      const subscription = await UserSubscription.findOne({ userId });
      if (!subscription) {
        return { allowed: false, reason: "No subscription found" };
      }

      // Check if trial is expired
      const now = new Date();
      if (subscription.status === "trial" && now > subscription.trialEndDate) {
        return { allowed: false, reason: "Trial expired", action: "upgrade" };
      }

      // Check usage limits
      switch (action) {
        case "generate_post":
          if (
            subscription.usage.postsGenerated >=
            subscription.limits.postsPerMonth
          ) {
            return {
              allowed: false,
              reason: "Trial post limit reached",
              action: "upgrade",
            };
          }
          break;

        case "generate_comment":
          if (
            subscription.usage.commentsGenerated >=
            subscription.limits.commentsPerMonth
          ) {
            return {
              allowed: false,
              reason: "Trial comment limit reached",
              action: "upgrade",
            };
          }
          break;

        case "generate_idea":
          if (
            subscription.limits.ideasPerMonth !== -1 &&
            subscription.usage.ideasGenerated >=
            subscription.limits.ideasPerMonth
          ) {
            return {
              allowed: false,
              reason: "Trial idea limit reached",
              action: "upgrade",
            };
          }
          break;

        case "generate_transcript":
          if (
            subscription.usage.transcriptsGenerated >=
            subscription.limits.transcriptsPerMonth
          ) {
            return {
              allowed: false,
              reason: "Trial transcription limit reached",
              action: "upgrade",
            };
          }
          break;
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error checking trial action:", error);
      return { allowed: false, reason: "System error" };
    }
  }

  /**
   * Handle trial expiry - convert to expired status
   */
  async handleTrialExpiry(userId) {
    try {
      const subscription = await UserSubscription.findOne({ userId });
      if (!subscription) {
        throw new Error("Subscription not found");
      }

      // Update subscription status
      subscription.status = "expired";
      subscription.plan = "expired";

      // Reset usage counters
      subscription.usage.postsGenerated = 0;
      subscription.usage.commentsGenerated = 0;
      subscription.usage.ideasGenerated = 0;
      subscription.usage.templatesUsed = 0;
      subscription.usage.linkedinAnalyses = 0;
      subscription.usage.profileAnalyses = 0;
      subscription.usage.transcriptsGenerated = 0;

      await subscription.save();

      // Update user status
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: "expired",
      });

      console.log(`✅ Trial expired for user: ${userId}`);
      return subscription;
    } catch (error) {
      console.error("Error handling trial expiry:", error);
      throw error;
    }
  }

  /**
   * Get trial status and remaining usage
   */
  async getTrialStatus(userId) {
    try {
      const subscription = await UserSubscription.findOne({ userId });
      if (!subscription) {
        return { error: "No subscription found" };
      }

      const now = new Date();
      const trialEndDate = subscription.trialEndDate;
      const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

      return {
        isTrial: subscription.status === "trial",
        daysLeft: Math.max(0, daysLeft),
        isExpired: now > trialEndDate,
        limits: {
          posts: subscription.limits.postsPerMonth,
          comments: subscription.limits.commentsPerMonth,
          ideas: subscription.limits.ideasPerMonth,
          transcripts: subscription.limits.transcriptsPerMonth,
        },
        usage: {
          posts: subscription.usage.postsGenerated,
          comments: subscription.usage.commentsGenerated,
          ideas: subscription.usage.ideasGenerated,
          transcripts: subscription.usage.transcriptsGenerated,
        },
        remaining: {
          posts: Math.max(
            0,
            subscription.limits.postsPerMonth -
              subscription.usage.postsGenerated
          ),
          comments: Math.max(
            0,
            subscription.limits.commentsPerMonth -
              subscription.usage.commentsGenerated
          ),
          ideas: subscription.limits.ideasPerMonth === -1
            ? -1
            : Math.max(0, subscription.limits.ideasPerMonth - subscription.usage.ideasGenerated),
          transcripts: Math.max(
            0,
            subscription.limits.transcriptsPerMonth -
              subscription.usage.transcriptsGenerated
          ),
        },
        trialEndDate: trialEndDate,
      };
    } catch (error) {
      console.error("Error getting trial status:", error);
      return { error: "Failed to get trial status" };
    }
  }

  /**
   * Send trial expiry reminder
   */
  async sendTrialReminder(userId, daysLeft) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      await emailService.sendTrialExpiryEmail(user, daysLeft);
      console.log(`✅ Sent trial reminder (${daysLeft} days) to ${user.email}`);

      return { success: true };
    } catch (error) {
      console.error("Error sending trial reminder:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate tokens for given limits
   */
  calculateTokens(limits) {
    const ideaTokens = limits.ideas === -1 ? 100 : limits.ideas * 4;
    return limits.posts * 5 + limits.comments * 3 + ideaTokens;
  }

  /**
   * Get trial limits
   */
  getTrialLimits() {
    return this.trialLimits;
  }

  /**
   * Check if user is on trial
   */
  async isUserOnTrial(userId) {
    try {
      const subscription = await UserSubscription.findOne({ userId });
      return subscription && subscription.status === "trial";
    } catch (error) {
      console.error("Error checking trial status:", error);
      return false;
    }
  }

  /**
   * Get trial conversion metrics
   */
  async getTrialMetrics() {
    try {
      const totalTrials = await UserSubscription.countDocuments({
        status: "trial",
      });
      const expiredTrials = await UserSubscription.countDocuments({
        status: "expired",
      });
      const convertedTrials = await UserSubscription.countDocuments({
        status: "active",
        plan: { $in: ["starter", "pro"] },
      });

      const conversionRate =
        totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

      return {
        totalTrials,
        expiredTrials,
        convertedTrials,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting trial metrics:", error);
      return { error: "Failed to get trial metrics" };
    }
  }
}

export default new TrialService();
