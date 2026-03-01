// Detect production environment and set appropriate API URL
const getApiUrl = () => {
  // If explicitly set in env, use that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect production based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production backend (Render)
    const productionApi = 'https://spark-linkedin-ai.onrender.com/api';
    if (hostname === 'www.linkedinpulse.com' || hostname === 'linkedinpulse.com' ||
        hostname === 'www.engagematic.com' || hostname === 'engagematic.com') {
      return productionApi;
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  
  // Default fallback
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiUrl();

// Log API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem("token");
    
    // Log in production too (helpful for debugging production issues)
    if (typeof window !== 'undefined' && window.location.hostname.includes('linkedinpulse.com')) {
      console.log('🔗 API Base URL:', this.baseURL);
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getToken() {
    return this.token || localStorage.getItem("token");
  }

  async request(endpoint, options = {}) {
    // Normalize endpoint path
    // baseURL is like "http://localhost:5000/api" (ends with /api)
    // endpoint is like "/profile-coach/test" or "profile-coach/test"
    // We want: "http://localhost:5000/api/profile-coach/test"
    let normalizedEndpoint = endpoint;
    if (normalizedEndpoint.startsWith('/')) {
      normalizedEndpoint = normalizedEndpoint.substring(1); // Remove leading slash
    }
    // baseURL already ends with /api, so we add / before the endpoint
    const url = `${this.baseURL}/${normalizedEndpoint}`;
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log('🔗 API Request:', options.method || 'GET', url);
    }
    
    // Check if this is an affiliate endpoint - use affiliate token if available
    const isAffiliateEndpoint = endpoint.includes('/affiliate/');
    let token = isAffiliateEndpoint ? this.getAffiliateToken() : this.getToken();
    
    // If no token found and it's an affiliate endpoint, try regular token as fallback
    if (!token && isAffiliateEndpoint) {
      token = this.getToken();
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle rate limiting specifically
      if (response.status === 429) {
        const data = await response
          .json()
          .catch(() => ({ message: "Too many requests" }));
        throw new Error(
          data.message || "Too many requests, please try again later"
        );
      }

      const data = await response.json();

      if (!response.ok) {
        // Log detailed error for debugging
        console.error("❌ API Error Response:", {
          status: response.status,
          endpoint,
          message: data?.message,
          errors: data?.errors,
          details: data?.details,
        });

        // Provide more specific error messages
        if (response.status === 400) {
          // Validation errors - show detailed message
          // Prioritize error field, then message, then details
          const errorMsg = data.error || data.message || data.details || "Invalid request data";
          const validationErrors = data.errors
            ?.map((e) => e.msg || e.message || `${e.path}: ${e.msg}`)
            .join(", ");
          const fullErrorMsg = validationErrors || errorMsg;
          
          console.error("Validation errors:", {
            errors: data.errors,
            error: data.error,
            details: data.details,
            message: data.message,
          });
          
          throw new Error(fullErrorMsg);
        } else if (response.status === 401) {
          const msg = data?.message || "Authentication required. Please log in again.";
          throw new Error(msg);
        } else if (response.status === 403) {
          throw new Error(data.message || "Access denied");
        } else if (response.status === 404) {
          throw new Error(data.message || "Resource not found");
        } else if (response.status === 500) {
          const errorDetails = data?.error || data?.message || "Server error. Please try again later.";
          const error = new Error(data?.message || errorDetails);
          error.error = data?.error;
          throw error;
        }

        throw new Error(
          data?.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      // Handle network errors (CORS, fetch failures) gracefully
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error("Network error (CORS or connection issue):", {
          endpoint,
          url,
          baseURL: this.baseURL,
          error: error.message,
        });
        
        // Provide more helpful error message based on environment
        const isProduction = window.location.hostname.includes('linkedinpulse.com');
        if (isProduction) {
          throw new Error("Unable to connect to server. The backend may be temporarily unavailable. Please try again in a moment.");
        } else {
          throw new Error("Network error: Unable to connect to server. Please check your connection and ensure the backend is running.");
        }
      }
      
      // Handle CORS errors specifically
      if (error.message && error.message.includes("CORS")) {
        console.error("CORS error:", {
          endpoint,
          url,
          baseURL: this.baseURL,
          origin: window.location.origin,
        });
        throw new Error("CORS error: The server is blocking requests from this origin. Please contact support.");
      }
      
      console.error("API request failed:", {
        endpoint,
        error: error.message,
        url,
        baseURL: this.baseURL,
      });
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async googleAuth(tokenOrCode, referralCode, redirectUri) {
    const isCode = tokenOrCode && tokenOrCode.length > 100;
    const body = isCode
      ? { code: tokenOrCode, redirect_uri: redirectUri, referralCode }
      : { access_token: tokenOrCode, referralCode };

    const response = await this.request("/auth/google", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    const response = await this.request("/auth/logout", {
      method: "POST",
    });

    this.setToken(null);
    return response;
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  async updateProfile(profileData) {
    return this.request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Content generation methods
  async generatePost(postData) {
    return this.request("/content/posts/generate", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async generatePostCustom(postData) {
    return this.request("/content/posts/generate-custom", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async generatePostFromPlan(postData) {
    return this.request("/content/posts/generate-from-plan", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  async previewVoice(postIdea) {
    return this.request("/content/posts/preview-voice", {
      method: "POST",
      body: JSON.stringify({ postIdea: (postIdea || "").trim().slice(0, 300) }),
    });
  }

  // Content Planner - saved plans (dashboard)
  async listContentPlans() {
    return this.request("/content-plans", { method: "GET" });
  }

  async getContentPlan(id) {
    return this.request(`/content-plans/${id}`, { method: "GET" });
  }

  async saveContentPlan(plan) {
    return this.request("/content-plans", {
      method: "POST",
      body: JSON.stringify(plan),
    });
  }

  async updateContentPlan(id, updates) {
    return this.request(`/content-plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteContentPlan(id) {
    return this.request(`/content-plans/${id}`, { method: "DELETE" });
  }

  // Free post generation (no auth required)
  async generatePostFree(postData) {
    // This endpoint should be created on backend without auth middleware
    // It should track usage via session/IP to limit to 1 free post
    const url = `${this.baseURL}/content/posts/generate-free`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to generate post" }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async generateComment(commentData) {
    return this.request("/content/comments/generate", {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async generateIdeas(payload) {
    return this.request("/content/generate-ideas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async fetchLinkedInContent(url) {
    return this.request("/content/fetch-linkedin-content", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  }

  async analyzeLinkedInProfile(profileUrl) {
    return this.request("/content/analyze-linkedin-profile", {
      method: "POST",
      body: JSON.stringify({ profileUrl }),
    });
  }

  // Profile Coach methods (new LinkedIn profile analyzer)
  async analyzeProfileWithCoach(profileUrl, options = {}) {
    const { userType, targetAudience, mainGoal } = options;
    return this.request("/profile-coach/analyze", {
      method: "POST",
      body: JSON.stringify({
        profileUrl,
        userType,
        targetAudience,
        mainGoal,
      }),
    });
  }

  async analyzeProfileWithCoachTest(profileUrl, options = {}) {
    const { userType, targetAudience, mainGoal } = options;
    return this.request("/profile-coach/test", {
      method: "POST",
      body: JSON.stringify({
        profileUrl,
        userType,
        targetAudience,
        mainGoal,
      }),
    });
  }

  async exportAnalysisPDF(analysisData, profileData = {}) {
    const response = await fetch(`${this.baseURL}/profile-coach/export-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
      },
      body: JSON.stringify({
        analysisData,
        profileData,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to export PDF" }));
      throw new Error(error.message || "Failed to export PDF");
    }

    // Return blob for PDF download
    const blob = await response.blob();
    return blob;
  }

  async exportAnalysisPDFById(analysisId, profileName = "", profileHeadline = "") {
    const params = new URLSearchParams({
      analysisId,
      ...(profileName ? { profileName } : {}),
      ...(profileHeadline ? { profileHeadline } : {}),
    });
    
    const response = await fetch(`${this.baseURL}/profile-coach/export-pdf?${params}`, {
      method: "GET",
      headers: {
        ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to export PDF" }));
      throw new Error(error.message || "Failed to export PDF");
    }

    // Return blob for PDF download
    const blob = await response.blob();
    return blob;
  }

  async analyzeContentOptimization(optimizationData) {
    return this.request("/content/analyze-optimization", {
      method: "POST",
      body: JSON.stringify(optimizationData),
    });
  }

  async getContentHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/content/history${queryString ? `?${queryString}` : ""}`
    );
  }

  async saveContent(contentId) {
    return this.request(`/content/save/${contentId}`, {
      method: "POST",
    });
  }

  async getSavedContent(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/content/saved${queryString ? `?${queryString}` : ""}`
    );
  }

  async deleteContent(contentId) {
    return this.request(`/content/${contentId}`, {
      method: "DELETE",
    });
  }

  // Persona methods
  async getPersonas() {
    return this.request("/personas");
  }

  async getSamplePersonas() {
    return this.request("/personas/samples");
  }

  async createPersona(personaData) {
    return this.request("/personas", {
      method: "POST",
      body: JSON.stringify(personaData),
    });
  }

  async updatePersona(personaId, personaData) {
    return this.request(`/personas/${personaId}`, {
      method: "PUT",
      body: JSON.stringify(personaData),
    });
  }

  async deletePersona(personaId) {
    return this.request(`/personas/${personaId}`, {
      method: "DELETE",
    });
  }

  async setDefaultPersona(personaId) {
    return this.request(`/personas/${personaId}/set-default`, {
      method: "POST",
    });
  }

  // Hook methods
  async getHooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/hooks${queryString ? `?${queryString}` : ""}`);
  }

  async getHookCategories() {
    return this.request("/hooks/categories");
  }

  async getPopularHooks() {
    return this.request("/hooks/popular");
  }

  async getTrendingHooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/hooks/trending${queryString ? `?${queryString}` : ""}`
    );
  }

  // Trial management methods
  async getTrialStatus() {
    return this.request("/trial/status");
  }

  async checkTrialAction(action) {
    return this.request("/trial/check-action", "POST", { action });
  }

  async getTrialLimits() {
    return this.request("/trial/limits");
  }

  async getDynamicHooks(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/dynamic-hooks${queryString ? `?${queryString}` : ""}`
    );
  }

  // Analytics methods
  async getDashboardStats() {
    return this.request("/analytics/dashboard");
  }

  async getUsageStats() {
    return this.request("/analytics/usage");
  }

  async getUsageHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/analytics/usage/history${queryString ? `?${queryString}` : ""}`
    );
  }

  async getEngagementAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/analytics/engagement${queryString ? `?${queryString}` : ""}`
    );
  }

  // Subscription methods
  async getCurrentSubscription() {
    return this.request("/subscription/current");
  }

  async createSubscription(subscriptionData) {
    return this.request("/subscription/create", {
      method: "POST",
      body: JSON.stringify(subscriptionData),
    });
  }

  async upgradeSubscription(upgradeData) {
    return this.request("/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify(upgradeData),
    });
  }

  async cancelSubscription() {
    return this.request("/subscription/cancel", {
      method: "POST",
    });
  }

  async getInvoices() {
    return this.request("/subscription/invoices");
  }

  // Waitlist methods
  async joinWaitlist(waitlistData) {
    return this.request("/waitlist/join", {
      method: "POST",
      body: JSON.stringify(waitlistData),
    });
  }

  async getWaitlistStats() {
    return this.request("/waitlist/stats");
  }

  // Referral methods
  async generateReferralCode() {
    return this.request("/referrals/generate", {
      method: "POST",
    });
  }

  async getReferralStats() {
    return this.request("/referrals/stats");
  }

  async getMyReferrals() {
    return this.request("/referrals/my-referrals");
  }

  async validateReferralCode(code) {
    return this.request(`/referrals/validate/${code}`);
  }

  async trackReferralClick(code) {
    return this.request("/referrals/track", {
      method: "POST",
      body: JSON.stringify({ referralCode: code }),
    });
  }

  async sendReferralInvites(emailData) {
    return this.request("/referrals/invite", {
      method: "POST",
      body: JSON.stringify(emailData),
    });
  }

  // Affiliate authentication methods
  async affiliateRegister(data) {
    const response = await this.request("/affiliate/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.data.token) {
      // Store affiliate token separately
      localStorage.setItem("affiliateToken", response.data.token);
      console.log("✅ Affiliate token saved");
    }

    return response;
  }

  async affiliateLogin(credentials) {
    const response = await this.request("/affiliate/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data && response.data.token) {
      // Store affiliate token separately
      localStorage.setItem("affiliateToken", response.data.token);
      console.log("✅ Affiliate token saved");
    }

    return response;
  }

  getAffiliateToken() {
    return localStorage.getItem("affiliateToken");
  }

  setAffiliateToken(token) {
    if (token) {
      localStorage.setItem("affiliateToken", token);
    } else {
      localStorage.removeItem("affiliateToken");
    }
  }

  clearAffiliateToken() {
    localStorage.removeItem("affiliateToken");
  }

  async getAffiliateProfile() {
    const token = this.getAffiliateToken();
    if (!token) {
      throw new Error("Authentication required. Please log in to your affiliate account.");
    }
    return this.request("/affiliate/me");
  }

  async updateAffiliateProfile(profileData) {
    const token = this.getAffiliateToken();
    if (!token) {
      throw new Error("Authentication required. Please log in to your affiliate account.");
    }
    return this.request("/affiliate/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Affiliate dashboard methods
  async getAffiliateDashboardStats() {
    // Ensure we use affiliate token for affiliate endpoints
    const token = this.getAffiliateToken();
    if (!token) {
      throw new Error("Authentication required. Please log in to your affiliate account.");
    }
    return this.request("/affiliate/dashboard/stats");
  }

  async getAffiliateCommissions(page = 1, limit = 50) {
    const token = this.getAffiliateToken();
    if (!token) {
      throw new Error("Authentication required. Please log in to your affiliate account.");
    }
    return this.request(`/affiliate/dashboard/commissions?page=${page}&limit=${limit}`);
  }

  async getAffiliateReferrals() {
    const token = this.getAffiliateToken();
    if (!token) {
      throw new Error("Authentication required. Please log in to your affiliate account.");
    }
    return this.request("/affiliate/dashboard/referrals");
  }

  // Testimonial methods
  async collectTestimonial(testimonialData) {
    return this.request("/testimonials/collect", {
      method: "POST",
      body: JSON.stringify(testimonialData),
    });
  }

  async getPublicTestimonials(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/testimonials/public${queryString ? `?${queryString}` : ""}`
    );
  }

  async submitTestimonial(testimonialData) {
    return this.request("/testimonials/submit", {
      method: "POST",
      body: JSON.stringify(testimonialData),
    });
  }

  // Pricing methods
  async getPricingConfig() {
    return this.request("/pricing/config");
  }

  async calculatePrice(credits, currency) {
    return this.request("/pricing/calculate", {
      method: "POST",
      body: JSON.stringify({ credits, currency }),
    });
  }

  async detectRegion() {
    return this.request("/pricing/detect-region");
  }

  async createCreditSubscription(subscriptionData) {
    return this.request("/pricing/create-subscription", {
      method: "POST",
      body: JSON.stringify(subscriptionData),
    });
  }

  async updateSubscriptionCredits(credits, currency) {
    return this.request("/pricing/update-credits", {
      method: "PUT",
      body: JSON.stringify({ credits, currency }),
    });
  }

  async getCurrentSubscriptionWithPricing() {
    return this.request("/pricing/current-subscription");
  }

  async validateCredits(credits) {
    return this.request("/pricing/validate-credits", {
      method: "POST",
      body: JSON.stringify({ credits }),
    });
  }

  // Payment methods
  async createCreditOrder(orderData) {
    return this.request("/payment/create-credit-order", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async verifyPayment(paymentData) {
    return this.request("/payment/verify-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  async createPlanOrder(orderData) {
    return this.request("/payment/create-plan-order", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async getRazorpayKey() {
    return this.request("/payment/key");
  }

  async getPaymentHistory() {
    return this.request("/payment/history");
  }

  // Profile completion methods
  async getProfileStatus() {
    return this.request("/profile/status", {
      method: "GET",
    });
  }

  async getProfileRequirements() {
    return this.request("/profile/requirements", {
      method: "GET",
    });
  }

  async completeBasicProfile(profileData) {
    return this.request("/profile/complete-basic", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  }

  // Coupon methods
  async validateCoupon(code, amount = 0, plan = null) {
    return this.request("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, amount, plan }),
    });
  }

  async applyCoupon(code, orderId) {
    return this.request("/coupons/apply", {
      method: "POST",
      body: JSON.stringify({ code, orderId }),
    });
  }

  // Admin coupon methods
  async getAllCoupons() {
    return this.request("/coupons/admin/all");
  }

  async getCouponById(id) {
    return this.request(`/coupons/admin/${id}`);
  }

  async createCoupon(couponData) {
    return this.request("/coupons/admin/create", {
      method: "POST",
      body: JSON.stringify(couponData),
    });
  }

  async updateCoupon(id, couponData) {
    return this.request(`/coupons/admin/${id}`, {
      method: "PUT",
      body: JSON.stringify(couponData),
    });
  }

  async deleteCoupon(id) {
    return this.request(`/coupons/admin/${id}`, {
      method: "DELETE",
    });
  }

  async getEmailAnalytics() {
    return await this.request("/admin/email-analytics", { method: "GET" });
  }
  async getEmailLogs() {
    return await this.request("/admin/email-logs", { method: "GET" });
  }
  async getEmailTemplates() {
    return await this.request("/admin/email-templates", { method: "GET" });
  }
  async sendEmail({ userIds, templateId, subject, content, sendTime }) {
    return await this.request("/admin/send-email", {
      method: "POST",
      body: JSON.stringify({ userIds, templateId, subject, content, sendTime }),
    });
  }
  async addEmailTemplate(data) {
    return await this.request("/admin/email-templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateEmailTemplate(id, data) {
    return await this.request(`/admin/email-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteEmailTemplate(id) {
    return await this.request(`/admin/email-templates/${id}`, {
      method: "DELETE",
    });
  }
}

export default new ApiClient();
