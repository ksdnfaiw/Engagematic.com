import cron from "node-cron";
import emailService from "./emailService.js";
import User from "../models/User.js";
import Content from "../models/Content.js";
import EmailLog from "../models/EmailLog.js";

class EmailScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Start all scheduled email jobs
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️  Email scheduler is already running");
      return;
    }

    console.log("📧 Starting email scheduler...");

    // Initialize email service
    const initialized = await emailService.initialize();
    if (!initialized) {
      console.warn("⚠️  Email scheduler disabled - service not initialized");
      return;
    }

    // Schedule all jobs
    this.scheduleOnboardingEmails();
    this.scheduleTrialExpiryReminders();
    this.scheduleReengagementEmails();
    this.scheduleMilestoneChecks();
    this.schedulePaymentReminders();
    this.scheduleSubscriptionRenewalReminders();
    this.scheduleUsageLimitWarnings();
    this.scheduleChurnPrevention();
    this.scheduleContentPlannerReminders();


    this.isRunning = true;
    console.log("✅ Email scheduler started successfully");
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log("📧 Email scheduler stopped");
  }

  /**
   * Schedule onboarding email sequence (Days 1, 3, 5, 7)
   * Runs every 6 hours to catch users at different signup times
   */
  scheduleOnboardingEmails() {
    const job = cron.schedule("0 */6 * * *", async () => {
      console.log("🔄 Running onboarding email check...");

      try {
        const now = new Date();

        // Day 1 - Send 24 hours after signup
        await this.sendOnboardingDay(1, now);

        // Day 3 - Send 72 hours after signup
        await this.sendOnboardingDay(3, now);

        // Day 5 - Send 120 hours after signup
        await this.sendOnboardingDay(5, now);

        // Day 7 - Send 168 hours after signup
        await this.sendOnboardingDay(7, now);
      } catch (error) {
        console.error("Error in onboarding email job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Onboarding emails scheduled (every 6 hours)");
  }

  /**
   * Helper method to send onboarding emails for specific day
   */
  async sendOnboardingDay(day, now) {
    const hoursAgo = day * 24;
    const startTime = new Date(now.getTime() - (hoursAgo + 1) * 60 * 60 * 1000);
    const endTime = new Date(now.getTime() - (hoursAgo - 1) * 60 * 60 * 1000);

    const users = await User.find({
      createdAt: { $gte: startTime, $lte: endTime },
      isActive: true,
    });

    console.log(`Found ${users.length} users for Day ${day} onboarding`);

    for (const user of users) {
      try {
        await emailService.sendOnboardingEmail(user, day);
        console.log(`✅ Sent Day ${day} onboarding to ${user.email}`);
      } catch (error) {
        console.error(`Error sending Day ${day} onboarding to ${user.email}:`, error);
      }
    }
  }

  /**
   * Schedule trial expiry reminders (7, 3, 1 days before, and on expiry)
   * Runs daily at 9 AM
   */
  scheduleTrialExpiryReminders() {
    const job = cron.schedule("0 9 * * *", async () => {
      console.log("🔄 Running trial expiry reminder check...");

      try {
        const now = new Date();

        // 7 days before expiry
        await this.sendTrialExpiryReminder(7, now);

        // 3 days before expiry
        await this.sendTrialExpiryReminder(3, now);

        // 1 day before expiry
        await this.sendTrialExpiryReminder(1, now);

        // Trial expired today
        await this.sendTrialExpiryReminder(0, now);
      } catch (error) {
        console.error("Error in trial expiry reminder job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Trial expiry reminders scheduled (daily at 9 AM)");
  }

  /**
   * Helper method to send trial expiry reminders
   */
  async sendTrialExpiryReminder(daysLeft, now) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysLeft);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const users = await User.find({
      subscriptionStatus: "trial",
      trialEndsAt: { $gte: targetDate, $lt: nextDay },
      isActive: true,
    });

    console.log(`Found ${users.length} users with ${daysLeft} days left in trial`);

    for (const user of users) {
      try {
        await emailService.sendTrialExpiryEmail(user, daysLeft);
        console.log(`✅ Sent trial expiry (${daysLeft} days) reminder to ${user.email}`);
      } catch (error) {
        console.error(`Error sending trial expiry reminder to ${user.email}:`, error);
      }
    }
  }

  /**
   * Schedule re-engagement emails for inactive users (7, 14, 30 days)
   * Runs daily at 10 AM
   */
  scheduleReengagementEmails() {
    const job = cron.schedule("0 10 * * *", async () => {
      console.log("🔄 Running re-engagement email check...");

      try {
        const now = new Date();

        // 7 days inactive
        await this.sendReengagementEmail(7, now);

        // 14 days inactive
        await this.sendReengagementEmail(14, now);

        // 30 days inactive
        await this.sendReengagementEmail(30, now);
      } catch (error) {
        console.error("Error in re-engagement email job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Re-engagement emails scheduled (daily at 10 AM)");
  }

  /**
   * Helper method to send re-engagement emails
   */
  async sendReengagementEmail(daysInactive, now) {
    const lastActiveDate = new Date(now);
    lastActiveDate.setDate(lastActiveDate.getDate() - daysInactive);
    lastActiveDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(lastActiveDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const users = await User.find({
      lastLoginAt: { $gte: lastActiveDate, $lt: nextDay },
      isActive: true,
    });

    console.log(`Found ${users.length} users inactive for ${daysInactive} days`);

    for (const user of users) {
      try {
        // Check if user has created any content recently
        const recentContent = await Content.findOne({
          userId: user._id,
          createdAt: { $gte: lastActiveDate },
        });

        if (!recentContent) {
          await emailService.sendReengagementEmail(user, daysInactive);
          console.log(`✅ Sent ${daysInactive}-day re-engagement to ${user.email}`);
        }
      } catch (error) {
        console.error(`Error sending re-engagement email to ${user.email}:`, error);
      }
    }
  }

  /**
   * Schedule milestone celebration emails
   * Runs every 6 hours
   */
  scheduleMilestoneChecks() {
    const job = cron.schedule("0 */6 * * *", async () => {
      console.log("🔄 Running milestone check...");

      try {
        const milestones = [10, 50, 100];

        for (const milestone of milestones) {
          await this.checkAndSendMilestoneEmails(milestone);
        }
      } catch (error) {
        console.error("Error in milestone check job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Milestone checks scheduled (every 6 hours)");
  }

  /**
   * Helper method to check and send milestone emails
   */
  async checkAndSendMilestoneEmails(milestoneCount) {
    try {
      // Get users with exactly this many posts
      const usersWithMilestone = await Content.aggregate([
        {
          $group: {
            _id: "$userId",
            postCount: { $sum: 1 },
          },
        },
        {
          $match: {
            postCount: milestoneCount,
          },
        },
      ]);

      console.log(`Found ${usersWithMilestone.length} users at ${milestoneCount} posts milestone`);

      for (const userMilestone of usersWithMilestone) {
        try {
          const user = await User.findById(userMilestone._id);
          if (!user || !user.isActive) continue;

          // Check if milestone email already sent
          const milestoneType = `milestone_${milestoneCount}_posts`;
          const alreadySent = await EmailLog.findOne({
            userId: user._id,
            emailType: milestoneType,
            status: "sent",
          });

          if (!alreadySent) {
            await emailService.sendMilestoneEmail(user, milestoneCount);
            console.log(`✅ Sent ${milestoneCount}-post milestone email to ${user.email}`);
          }
        } catch (error) {
          console.error(`Error sending milestone email:`, error);
        }
      }
    } catch (error) {
      console.error(`Error checking ${milestoneCount} milestone:`, error);
    }
  }

  /**
   * Manual trigger methods for testing or manual execution
   */

  async sendWelcomeEmailToUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      await emailService.sendWelcomeEmail(user);
      console.log(`✅ Manually sent welcome email to ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending manual welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendUpgradePromptToUser(userId, reason = "value_based") {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      await emailService.sendUpgradePromptEmail(user, reason);
      console.log(`✅ Manually sent upgrade prompt to ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending manual upgrade prompt:", error);
      return { success: false, error: error.message };
    }
  }

  async sendFeatureUpdateToAllUsers(featureDetails) {
    try {
      const users = await User.find({ isActive: true });
      let successCount = 0;
      let failCount = 0;

      console.log(`📧 Sending feature update to ${users.length} users...`);

      for (const user of users) {
        try {
          await emailService.sendFeatureUpdateEmail(user, featureDetails);
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${user.email}:`, error.message);
          failCount++;
        }
      }

      console.log(`✅ Feature update sent: ${successCount} success, ${failCount} failed`);
      return { success: true, successCount, failCount };
    } catch (error) {
      console.error("Error sending feature update:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule payment reminders (7, 3, 1 days before due date, and overdue)
   * Runs daily at 8 AM
   */
  schedulePaymentReminders() {
    const job = cron.schedule("0 8 * * *", async () => {
      console.log("🔄 Running payment reminder check...");

      try {
        const UserSubscription = (await import("../models/UserSubscription.js")).default;
        const now = new Date();

        // Find subscriptions with upcoming payments
        const subscriptions = await UserSubscription.find({
          "billing.nextBillingDate": { $exists: true, $ne: null },
          status: { $in: ["active", "trial"] },
        }).populate("userId");

        for (const subscription of subscriptions) {
          if (!subscription.userId || !subscription.billing.nextBillingDate) continue;

          const daysUntilDue = Math.ceil(
            (subscription.billing.nextBillingDate - now) / (1000 * 60 * 60 * 24)
          );

          try {
            // 7 days before
            if (daysUntilDue === 7) {
              await emailService.sendPaymentReminderEmail(subscription.userId, {
                amount: subscription.billing.amount || "₹649",
                dueDate: subscription.billing.nextBillingDate.toLocaleDateString(),
                billingPeriod: subscription.billing.interval || "month",
              });
            }
            // 3 days before
            else if (daysUntilDue === 3) {
              await emailService.sendPaymentReminderEmail(subscription.userId, {
                amount: subscription.billing.amount || "₹649",
                dueDate: subscription.billing.nextBillingDate.toLocaleDateString(),
                billingPeriod: subscription.billing.interval || "month",
              });
            }
            // 1 day before
            else if (daysUntilDue === 1) {
              await emailService.sendPaymentReminderEmail(subscription.userId, {
                amount: subscription.billing.amount || "₹649",
                dueDate: subscription.billing.nextBillingDate.toLocaleDateString(),
                billingPeriod: subscription.billing.interval || "month",
              });
            }
            // Overdue (past due date)
            else if (daysUntilDue < 0 && daysUntilDue >= -7) {
              await emailService.sendPaymentOverdueEmail(subscription.userId, {
                amount: subscription.billing.amount || "₹649",
                overdueDate: subscription.billing.nextBillingDate.toLocaleDateString(),
              });
            }
          } catch (error) {
            console.error(
              `Error sending payment reminder to ${subscription.userId.email}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error("Error in payment reminder job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Payment reminders scheduled (daily at 8 AM)");
  }

  /**
   * Schedule subscription renewal reminders (7, 3, 1 days before renewal)
   * Runs daily at 9 AM
   */
  scheduleSubscriptionRenewalReminders() {
    const job = cron.schedule("0 9 * * *", async () => {
      console.log("🔄 Running subscription renewal reminder check...");

      try {
        const UserSubscription = (await import("../models/UserSubscription.js")).default;
        const now = new Date();

        const subscriptions = await UserSubscription.find({
          "billing.nextBillingDate": { $exists: true, $ne: null },
          status: "active",
        }).populate("userId");

        for (const subscription of subscriptions) {
          if (!subscription.userId || !subscription.billing.nextBillingDate) continue;

          const daysUntilRenewal = Math.ceil(
            (subscription.billing.nextBillingDate - now) / (1000 * 60 * 60 * 24)
          );

          // Send reminder 7, 3, or 1 day before renewal
          if ([7, 3, 1].includes(daysUntilRenewal)) {
            try {
              await emailService.sendSubscriptionRenewalReminderEmail(subscription.userId, {
                plan: subscription.plan,
                daysLeft: daysUntilRenewal,
                renewalDate: subscription.billing.nextBillingDate.toLocaleDateString(),
                amount: subscription.billing.amount || "₹649",
              });
            } catch (error) {
              console.error(
                `Error sending renewal reminder to ${subscription.userId.email}:`,
                error
              );
            }
          }
        }
      } catch (error) {
        console.error("Error in subscription renewal reminder job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Subscription renewal reminders scheduled (daily at 9 AM)");
  }

  /**
   * Schedule usage limit warnings (at 80% and 90% usage)
   * Runs daily at 11 AM
   */
  scheduleUsageLimitWarnings() {
    const job = cron.schedule("0 11 * * *", async () => {
      console.log("🔄 Running usage limit warning check...");

      try {
        const UserSubscription = (await import("../models/UserSubscription.js")).default;
        const Content = (await import("../models/Content.js")).default;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const subscriptions = await UserSubscription.find({
          status: { $in: ["active", "trial"] },
        }).populate("userId");

        for (const subscription of subscriptions) {
          if (!subscription.userId) continue;

          try {
            // Get usage for current month
            const postsCount = await Content.countDocuments({
              userId: subscription.userId._id,
              type: "post",
              createdAt: { $gte: startOfMonth },
            });

            const commentsCount = await Content.countDocuments({
              userId: subscription.userId._id,
              type: "comment",
              createdAt: { $gte: startOfMonth },
            });

            const postsLimit = subscription.limits?.postsPerMonth || 7;
            const commentsLimit = subscription.limits?.commentsPerMonth || 14;

            const postsPercentage = (postsCount / postsLimit) * 100;
            const commentsPercentage = (commentsCount / commentsLimit) * 100;
            const maxPercentage = Math.max(postsPercentage, commentsPercentage);

            // Send warning at 80% or 90% usage
            if (maxPercentage >= 80 && maxPercentage < 90) {
              // Check if already sent
              const alreadySent = await EmailLog.findOne({
                userId: subscription.userId._id,
                emailType: "usage_limit_warning",
                status: "sent",
                createdAt: { $gte: startOfMonth },
              });

              if (!alreadySent) {
                await emailService.sendUsageLimitWarningEmail(subscription.userId, {
                  limitType: postsPercentage > commentsPercentage ? "posts" : "comments",
                  used: postsPercentage > commentsPercentage ? postsCount : commentsCount,
                  limit: postsPercentage > commentsPercentage ? postsLimit : commentsLimit,
                  remaining:
                    postsPercentage > commentsPercentage
                      ? postsLimit - postsCount
                      : commentsLimit - commentsCount,
                  usagePercentage: Math.round(maxPercentage),
                  postsUsed: postsCount,
                  postsLimit: postsLimit,
                  postsPercentage: Math.round(postsPercentage),
                  commentsUsed: commentsCount,
                  commentsLimit: commentsLimit,
                  commentsPercentage: Math.round(commentsPercentage),
                  resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString(),
                  daysUntilReset: Math.ceil(
                    (new Date(now.getFullYear(), now.getMonth() + 1, 1) - now) /
                      (1000 * 60 * 60 * 24)
                  ),
                });
              }
            }
          } catch (error) {
            console.error(
              `Error checking usage limits for ${subscription.userId.email}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error("Error in usage limit warning job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Usage limit warnings scheduled (daily at 11 AM)");
  }

  /**
   * Schedule churn prevention emails (for inactive paid users)
   * Runs daily at 2 PM
   */
  scheduleChurnPrevention() {
    const job = cron.schedule("0 14 * * *", async () => {
      console.log("🔄 Running churn prevention check...");

      try {
        const UserSubscription = (await import("../models/UserSubscription.js")).default;
        const Content = (await import("../models/Content.js")).default;
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Find active paid users who haven't been active in 7+ days
        const subscriptions = await UserSubscription.find({
          status: "active",
          plan: { $in: ["starter", "pro", "elite"] },
        }).populate("userId");

        for (const subscription of subscriptions) {
          if (!subscription.userId) continue;

          // Check last activity
          const lastContent = await Content.findOne({
            userId: subscription.userId._id,
          }).sort({ createdAt: -1 });

          if (!lastContent || lastContent.createdAt < sevenDaysAgo) {
            // Check if churn prevention email already sent recently
            const alreadySent = await EmailLog.findOne({
              userId: subscription.userId._id,
              emailType: "churn_prevention",
              status: "sent",
              createdAt: { $gte: sevenDaysAgo },
            });

            if (!alreadySent) {
              try {
                const postsCount = await Content.countDocuments({
                  userId: subscription.userId._id,
                  type: "post",
                });

                const engagementCount = await Content.countDocuments({
                  userId: subscription.userId._id,
                });

                await emailService.sendChurnPreventionEmail(subscription.userId, {
                  postsCount,
                  engagementCount,
                  postsRemaining:
                    (subscription.limits?.postsPerMonth || 0) -
                    (subscription.usage?.postsGenerated || 0),
                  commentsRemaining:
                    (subscription.limits?.commentsPerMonth || 0) -
                    (subscription.usage?.commentsGenerated || 0),
                });
              } catch (error) {
                console.error(
                  `Error sending churn prevention to ${subscription.userId.email}:`,
                  error
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in churn prevention job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Churn prevention emails scheduled (daily at 2 PM)");
  }

  /**
   * Schedule content planner reminders
   * Runs every 15 minutes to check who needs a reminder
   */
  scheduleContentPlannerReminders() {
    const job = cron.schedule("*/15 * * * *", async () => {
      console.log("🔄 Running content planner reminder check...");

      try {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const currentDay = now.getUTCDay(); // 0=Sunday, 1=Monday...

        // Find users with reminders enabled
        const preferences = await EmailPreference.find({
          "preferences.plannerReminders.enabled": true,
        }).populate("userId");

        for (const pref of preferences) {
          if (!pref.userId || !pref.userId.isActive) continue;

          const reminderCfg = pref.preferences.plannerReminders;
          const [remHour, remMin] = reminderCfg.time.split(":").map(Number);

          // Check if it's approximately the right time (within 15 min window)
          // Note: This matches UTC. Frontend will need to store time in UTC or we handle offset.
          // For simplicity, we'll assume UTC for now or handle user timezone if available.
          // User model doesn't seem to have timezone. We'll use UTC comparison.
          
          const isTimeMatch = currentHour === remHour && Math.abs(currentMinute - remMin) < 15;
          if (!isTimeMatch) continue;

          // Check frequency
          let isDayMatch = false;
          if (reminderCfg.frequency === "daily") isDayMatch = true;
          else if (reminderCfg.frequency === "weekdays") isDayMatch = currentDay >= 1 && currentDay <= 5;
          else if (reminderCfg.frequency === "weekly") isDayMatch = currentDay === 1; // Default to Monday for weekly

          if (!isDayMatch) continue;

          // Check if already sent today
          const lastSent = reminderCfg.lastSentAt;
          const alreadySentToday = lastSent && 
            new Date(lastSent).getUTCDate() === now.getUTCDate() &&
            new Date(lastSent).getUTCMonth() === now.getUTCMonth();

          if (alreadySentToday) continue;

          try {
            await emailService.sendContentPlannerReminderEmail(pref.userId);
            
            // Update lastSentAt
            pref.preferences.plannerReminders.lastSentAt = now;
            await pref.save();
            
            console.log(`✅ Sent planner reminder to ${pref.userId.email}`);
          } catch (error) {
            console.error(`Error sending planner reminder to ${pref.userId.email}:`, error);
          }
        }
      } catch (error) {
        console.error("Error in content planner reminder job:", error);
      }
    });

    this.jobs.push(job);
    console.log("✅ Content planner reminders scheduled (every 15 minutes)");
  }


  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      emailServiceInitialized: emailService.initialized,
    };
  }
}

// Export singleton instance
const emailScheduler = new EmailScheduler();
export default emailScheduler;

