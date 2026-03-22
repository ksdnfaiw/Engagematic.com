import { Resend } from "resend";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import EmailLog from "../models/EmailLog.js";
import EmailPreference from "../models/EmailPreference.js";
import { config } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.resend = null;
    this.initialized = false;
    this.fromEmail = process.env.EMAIL_FROM || "hello@engagematic.com";
    this.fromName = process.env.EMAIL_FROM_NAME || "Engagematic";
    this.maxRetries = 3;
    this.retryDelayMs = 1000; // 1 second base delay (doubles each retry)
  }

  /**
   * Validate email address format
   */
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
  }

  /**
   * Retry helper with exponential backoff
   */
  async withRetry(fn, retries = this.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const isRetryable = error.statusCode >= 500 || error.code === "ECONNRESET" || error.code === "ETIMEDOUT";

        if (isLastAttempt || !isRetryable) {
          throw error;
        }

        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.warn(`⚠️  Email send attempt ${attempt}/${retries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Initialize Resend API client
   */
  async initialize() {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️  RESEND_API_KEY not found. Email service disabled.");
        console.warn("💡 Get your free API key at: https://resend.com/api-keys");
        return false;
      }

      // Initialize Resend SDK
      this.resend = new Resend(process.env.RESEND_API_KEY);

      // Test the API key by checking if it's valid (we'll do a simple validation)
      // Resend doesn't have a verify method, so we'll just check if the key format is correct
      if (!process.env.RESEND_API_KEY.startsWith("re_")) {
        console.warn("⚠️  RESEND_API_KEY format appears invalid (should start with 're_')");
        return false;
      }

      this.initialized = true;
      console.log("✅ Email service initialized with Resend API");
      console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`);
      return true;
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
      return false;
    }
  }

  /**
   * Check if user can receive this email type
   */
  async canSendEmail(userId, emailType) {
    try {
      const preference = await EmailPreference.findOne({ userId });

      // If no preference exists, allow (default is opt-in)
      if (!preference) return true;

      // Check global unsubscribe
      if (preference.unsubscribedAll) return false;

      // Map email types to preference categories
      const emailTypeMap = {
        welcome: "onboarding",
        onboarding_day1: "onboarding",
        onboarding_day3: "onboarding",
        onboarding_day5: "onboarding",
        onboarding_day7: "onboarding",
        milestone_10_posts: "milestones",
        milestone_50_posts: "milestones",
        milestone_100_posts: "milestones",
        trial_expiry_7days: "trialReminders",
        trial_expiry_3days: "trialReminders",
        trial_expiry_1day: "trialReminders",
        trial_expired: "trialReminders",
        reengagement_7days: "reengagement",
        reengagement_14days: "reengagement",
        reengagement_30days: "reengagement",
        upgrade_prompt: "upgradePrompts",
        payment_failed: "transactional",
        feature_update: "featureUpdates",
        planner_reminder: "plannerReminders",
      };


      const category = emailTypeMap[emailType] || "marketing";
      return preference.preferences[category] !== false;
    } catch (error) {
      console.error("Error checking email permission:", error);
      return true; // Default to allowing if check fails
    }
  }

  /**
   * Check if email was already sent recently
   */
  async wasRecentlySent(userId, emailType, hoursAgo = 24) {
    try {
      const recentEmail = await EmailLog.findOne({
        userId,
        emailType,
        status: "sent",
        sentAt: { $gte: new Date(Date.now() - hoursAgo * 60 * 60 * 1000) },
      });
      return !!recentEmail;
    } catch (error) {
      console.error("Error checking recent emails:", error);
      return false;
    }
  }

  /**
   * Render email template
   */
  async renderTemplate(templateName, data) {
    try {
      const templatePath = path.join(
        __dirname,
        "..",
        "templates",
        "emails",
        `${templateName}.ejs`
      );
      return await ejs.renderFile(templatePath, data);
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Send email with logging and preference checking
   */
  async sendEmail({
    userId,
    to,
    subject,
    templateName,
    templateData = {},
    emailType = "custom",
    metadata = {},
  }) {
    // Check if service is initialized
    if (!this.initialized) {
      console.warn("Email service not initialized. Skipping email send.");
      return { success: false, reason: "service_not_initialized" };
    }

    try {
      // Validate email address format
      if (!this.isValidEmail(to)) {
        console.warn(`Invalid email address: ${to}`);
        return { success: false, reason: "invalid_email" };
      }

      // Check if user can receive this email
      const canSend = await this.canSendEmail(userId, emailType);
      if (!canSend) {
        console.log(`User ${userId} has opted out of ${emailType} emails`);
        return { success: false, reason: "user_opted_out" };
      }

      // Check if recently sent
      const recentlySent = await this.wasRecentlySent(userId, emailType);
      if (recentlySent) {
        console.log(
          `Email ${emailType} already sent to user ${userId} recently`
        );
        return { success: false, reason: "recently_sent" };
      }

      // Get or create email preference (for unsubscribe token)
      let preference = await EmailPreference.findOne({ userId });
      if (!preference) {
        preference = await EmailPreference.create({
          userId,
          email: to,
        });
      }

      // Add unsubscribe link to template data (use production URL from config)
      const unsubscribeUrl = `${config.FRONTEND_URL}/unsubscribe?token=${preference.unsubscribeToken}`;
      const preferencesUrl = `${config.FRONTEND_URL}/email-preferences?token=${preference.unsubscribeToken}`;

      // Render email template
      const html = await this.renderTemplate(templateName, {
        ...templateData,
        unsubscribeUrl,
        preferencesUrl,
        currentYear: new Date().getFullYear(),
      });

      // Create email log entry
      const emailLog = await EmailLog.create({
        userId,
        email: to,
        emailType,
        subject,
        status: "pending",
        metadata,
      });

      // Send email using Resend API with retry logic for transient failures
      const sendResult = await this.withRetry(async () => {
        const { data, error } = await this.resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [to],
          subject,
          html,
          // Add List-Unsubscribe header for better deliverability
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        if (error) {
          const err = new Error(error.message || "Failed to send email via Resend");
          err.statusCode = error.statusCode || 500;
          throw err;
        }

        return data;
      });

      // Update log with success
      await EmailLog.findByIdAndUpdate(emailLog._id, {
        status: "sent",
        providerId: sendResult?.id || "resend",
        sentAt: new Date(),
      });

      console.log(`✅ Email sent: ${emailType} to ${to} (ID: ${sendResult?.id})`);
      return {
        success: true,
        messageId: sendResult?.id,
        emailLogId: emailLog._id,
      };
    } catch (error) {
      console.error(`❌ Error sending email ${emailType} to ${to}:`, error.message);

      // Log failure with error details
      try {
        await EmailLog.create({
          userId,
          email: to,
          emailType,
          subject,
          status: "failed",
          error: error.message,
          metadata: {
            ...metadata,
            errorCode: error.statusCode || error.code,
            retried: true,
          },
        });
      } catch (logError) {
        console.error("Error logging email failure:", logError);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Email flow methods
   */

  async sendWelcomeEmail(user) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Welcome to Engagematic",
      templateName: "welcome",
      templateData: {
        name: user.name || "there",
        trialDays: Math.ceil(
          (new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)
        ),
        dashboardUrl: `${config.FRONTEND_URL}/dashboard`,
      },
      emailType: "welcome",
    });
  }

  async sendOnboardingEmail(user, day) {
    const emailTypes = {
      1: {
        type: "onboarding_day1",
        subject: "Day 1: Create Your First Post",
        template: "onboarding_day1",
      },
      3: {
        type: "onboarding_day3",
        subject: "Day 3: Master Your Content Strategy",
        template: "onboarding_day3",
      },
      5: {
        type: "onboarding_day5",
        subject: "Day 5: Unlock Advanced Features",
        template: "onboarding_day5",
      },
      7: {
        type: "onboarding_day7",
        subject: "Day 7: Your Weekly Success Report",
        template: "onboarding_day7",
      },
    };

    const config = emailTypes[day];
    if (!config) return { success: false, reason: "invalid_day" };

    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: config.subject,
      templateName: config.template,
      templateData: {
        name: user.name || "there",
      },
      emailType: config.type,
    });
  }

  async sendMilestoneEmail(user, postCount) {
    const milestones = {
      10: {
        type: "milestone_10_posts",
        subject: "First 10 Posts Created",
        emoji: "🎉",
      },
      50: {
        type: "milestone_50_posts",
        subject: "50 Posts Milestone Unlocked",
        emoji: "",
      },
      100: {
        type: "milestone_100_posts",
        subject: "100 Posts Milestone",
        emoji: "",
      },
    };

    const milestone = milestones[postCount];
    if (!milestone) return { success: false, reason: "invalid_milestone" };

    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: milestone.subject,
      templateName: "milestone",
      templateData: {
        name: user.name || "there",
        postCount,
        emoji: milestone.emoji,
      },
      emailType: milestone.type,
    });
  }

  async sendTrialExpiryEmail(user, daysLeft) {
    const configs = {
      7: {
        type: "trial_expiry_7days",
        subject: "Your Trial Expires in 7 Days",
      },
      3: {
        type: "trial_expiry_3days",
        subject: "Only 3 Days Left of Your Trial",
      },
      1: {
        type: "trial_expiry_1day",
        subject: "Last Day of Your Trial",
      },
      0: {
        type: "trial_expired",
        subject: "Your Trial Has Ended",
      },
    };

    const config = configs[daysLeft];
    if (!config) return { success: false, reason: "invalid_days_left" };

    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: config.subject,
      templateName: daysLeft === 0 ? "trial_expired" : "trial_expiry",
      templateData: {
        name: user.name || "there",
        daysLeft,
        trialEndDate: user.trialEndsAt,
      },
      emailType: config.type,
    });
  }

  async sendReengagementEmail(user, daysInactive) {
    const configs = {
      7: {
        type: "reengagement_7days",
        subject: "We Miss You",
      },
      14: {
        type: "reengagement_14days",
        subject: "Your Content Strategy Is Waiting",
      },
      30: {
        type: "reengagement_30days",
        subject: "Come Back - Special Offer",
      },
    };

    const config = configs[daysInactive];
    if (!config) return { success: false, reason: "invalid_days_inactive" };

    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: config.subject,
      templateName: "reengagement",
      templateData: {
        name: user.name || "there",
        daysInactive,
      },
      emailType: config.type,
    });
  }

  async sendUpgradePromptEmail(user, reason = "value_based") {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Unlock Your Full Potential",
      templateName: "upgrade",
      templateData: {
        name: user.name || "there",
        currentPlan: user.plan,
        reason,
      },
      emailType: "upgrade_prompt",
    });
  }

  async sendPaymentFailedEmail(user, subscriptionDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Payment Failed - Action Required",
      templateName: "payment_failed",
      templateData: {
        name: user.name || "there",
        ...subscriptionDetails,
      },
      emailType: "payment_failed",
    });
  }

  async sendFeatureUpdateEmail(user, featureDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: `New Feature: ${featureDetails.title}`,
      templateName: "feature_update",
      templateData: {
        name: user.name || "there",
        ...featureDetails,
      },
      emailType: "feature_update",
    });
  }

  async sendPaymentReminderEmail(user, paymentDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Payment Reminder - Action Required",
      templateName: "payment_reminder",
      templateData: {
        name: user.name || "there",
        amount: paymentDetails.amount,
        dueDate: paymentDetails.dueDate,
        billingPeriod: paymentDetails.billingPeriod || "month",
        paymentUrl: `${config.FRONTEND_URL}/pricing`,
      },
      emailType: "payment_reminder",
    });
  }

  async sendPaymentOverdueEmail(user, paymentDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Payment Overdue - Action Required",
      templateName: "payment_overdue",
      templateData: {
        name: user.name || "there",
        amount: paymentDetails.amount,
        overdueDate: paymentDetails.overdueDate,
        paymentUrl: `${config.FRONTEND_URL}/pricing`,
      },
      emailType: "payment_overdue",
    });
  }

  async sendPaymentSuccessEmail(user, paymentDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Payment Successful",
      templateName: "payment_success",
      templateData: {
        name: user.name || "there",
        amount: paymentDetails.amount,
        plan: paymentDetails.plan,
        transactionId: paymentDetails.transactionId,
        paymentDate: paymentDetails.paymentDate,
        nextBillingDate: paymentDetails.nextBillingDate,
        dashboardUrl: `${config.FRONTEND_URL}/dashboard`,
      },
      emailType: "payment_success",
    });
  }

  async sendSubscriptionRenewalReminderEmail(user, subscriptionDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Subscription Renewal Reminder",
      templateName: "subscription_renewal_reminder",
      templateData: {
        name: user.name || "there",
        plan: subscriptionDetails.plan,
        daysLeft: subscriptionDetails.daysLeft,
        renewalDate: subscriptionDetails.renewalDate,
        amount: subscriptionDetails.amount,
        accountUrl: `${config.FRONTEND_URL}/settings`,
      },
      emailType: "subscription_renewal_reminder",
    });
  }

  async sendSubscriptionRenewedEmail(user, subscriptionDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Subscription Renewed",
      templateName: "subscription_renewed",
      templateData: {
        name: user.name || "there",
        plan: subscriptionDetails.plan,
        amount: subscriptionDetails.amount,
        renewalDate: subscriptionDetails.renewalDate,
        nextBillingDate: subscriptionDetails.nextBillingDate,
        nextRenewalDate: subscriptionDetails.nextRenewalDate,
        dashboardUrl: `${config.FRONTEND_URL}/dashboard`,
      },
      emailType: "subscription_renewed",
    });
  }

  async sendSubscriptionCancelledEmail(user, cancellationDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Subscription Cancelled - We're Sorry to See You Go",
      templateName: "subscription_cancelled",
      templateData: {
        name: user.name || "there",
        accessUntilDate: cancellationDetails.accessUntilDate,
        reactivateUrl: `${config.FRONTEND_URL}/pricing`,
      },
      emailType: "subscription_cancelled",
    });
  }

  async sendSubscriptionCancellationWarningEmail(user, cancellationDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Cancellation Scheduled",
      templateName: "subscription_cancellation_warning",
      templateData: {
        name: user.name || "there",
        cancellationDate: cancellationDetails.cancellationDate,
        postsCount: cancellationDetails.postsCount || 0,
        engagementCount: cancellationDetails.engagementCount || 0,
        keepSubscriptionUrl: `${config.FRONTEND_URL}/settings`,
      },
      emailType: "subscription_cancellation_warning",
    });
  }

  async sendAccountSuspendedEmail(user, suspensionDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Account Suspended - Action Required",
      templateName: "account_suspended",
      templateData: {
        name: user.name || "there",
        reason: suspensionDetails.reason,
        suspensionDate: suspensionDetails.suspensionDate,
        resolveUrl: `${config.FRONTEND_URL}/settings`,
      },
      emailType: "account_suspended",
    });
  }

  async sendAccountWarningEmail(user, warningDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Important Account Notice",
      templateName: "account_warning",
      templateData: {
        name: user.name || "there",
        warningReason: warningDetails.reason,
        actionRequired: warningDetails.actionRequired,
        deadlineDate: warningDetails.deadlineDate,
        actionUrl: `${config.FRONTEND_URL}/settings`,
      },
      emailType: "account_warning",
    });
  }

  async sendReactivationOfferEmail(user, offerDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "We Miss You - Special Offer",
      templateName: "reactivation_offer",
      templateData: {
        name: user.name || "there",
        discount: offerDetails.discount || 30,
        promoCode: offerDetails.promoCode || "WELCOMEBACK30",
        daysValid: offerDetails.daysValid || 7,
        postsCount: offerDetails.postsCount || 0,
        engagementCount: offerDetails.engagementCount || 0,
        reactivateUrl: `${config.FRONTEND_URL}/pricing?promo=${offerDetails.promoCode || "WELCOMEBACK30"}`,
      },
      emailType: "reactivation_offer",
    });
  }

  async sendChurnPreventionEmail(user, stats) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "💡 You're Missing Out - Don't Let Your Subscription Go to Waste!",
      templateName: "churn_prevention",
      templateData: {
        name: user.name || "there",
        postsCount: stats.postsCount || 0,
        engagementCount: stats.engagementCount || 0,
        postsRemaining: stats.postsRemaining || 0,
        commentsRemaining: stats.commentsRemaining || 0,
        dashboardUrl: `${config.FRONTEND_URL}/dashboard`,
      },
      emailType: "churn_prevention",
    });
  }

  async sendUsageLimitWarningEmail(user, usageDetails) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "Usage Limit Warning",
      templateName: "usage_limit_warning",
      templateData: {
        name: user.name || "there",
        limitType: usageDetails.limitType || "posts",
        used: usageDetails.used || 0,
        limit: usageDetails.limit || 0,
        remaining: usageDetails.remaining || 0,
        usagePercentage: usageDetails.usagePercentage || 0,
        postsUsed: usageDetails.postsUsed || 0,
        postsLimit: usageDetails.postsLimit || 0,
        postsPercentage: usageDetails.postsPercentage || 0,
        commentsUsed: usageDetails.commentsUsed || 0,
        commentsLimit: usageDetails.commentsLimit || 0,
        commentsPercentage: usageDetails.commentsPercentage || 0,
        resetDate: usageDetails.resetDate,
        daysUntilReset: usageDetails.daysUntilReset,
        upgradeUrl: `${config.FRONTEND_URL}/pricing`,
      },
      emailType: "usage_limit_warning",
    });
  }

  async sendContentPlannerReminderEmail(user) {
    return this.sendEmail({
      userId: user._id,
      to: user.email,
      subject: "📅 Your LinkedIn Content Plan Reminder",
      templateName: "planner_reminder",
      templateData: {
        name: user.name || "there",
        plannerUrl: `${config.FRONTEND_URL}/planner`,
      },
      emailType: "planner_reminder",
    });
  }
}


// Export singleton instance
const emailService = new EmailService();
export default emailService;
