import dotenv from "dotenv";

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,

  // Database - MUST be set via .env, no hardcoded credentials
  MONGODB_URI: process.env.MONGODB_URI || "",
  DB_NAME: process.env.DB_NAME || "linkedinpulse",

  // JWT - MUST be set via .env in production
  JWT_SECRET: process.env.JWT_SECRET || "dev-only-jwt-secret-change-in-production",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",

  // Admin JWT (separate secret for admin authentication)
  ADMIN_JWT_SECRET:
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "dev-only-admin-jwt-secret-change-in-production",

  // Google AI - MUST be set via .env
  // Supports multiple comma-separated keys for automatic rotation on quota limits
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || "",
  GOOGLE_AI_API_KEYS: (process.env.GOOGLE_AI_API_KEYS || process.env.GOOGLE_AI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),
  _GOOGLE_AI_API_KEY_FROM_ENV: !!process.env.GOOGLE_AI_API_KEY,

  // Razorpay - MUST be set via .env
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",

  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:8080",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,

  // CoreSignal (LinkedIn Data API) - set via .env
  // Documentation: https://docs.coresignal.com/
  CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY || "",

  // Proxycurl (LinkedIn API - Free tier: 100 requests/month)
  // Sign up at https://nubela.co/proxycurl/
  PROXYCURL_API_KEY: process.env.PROXYCURL_API_KEY || "",

  // RapidAPI (LinkedIn Scraper - Fallback option)
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "linkedin-profile-scraper-api.p.rapidapi.com",

  // SerpApi (Fallback option - Free tier: 100 searches/month)
  SERPAPI_KEY: process.env.SERPAPI_KEY || "",

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  // Email Configuration
  EMAIL_FROM: process.env.EMAIL_FROM || "hello@engagematic.com",
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "Engagematic",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
};
