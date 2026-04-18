import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "@/components/landing/Hero";
import { TryItFreeSection } from "@/components/landing/TryItFreeSection";
import { Features } from "@/components/landing/Features";
import { ProfileAnalyzerSection } from "@/components/landing/ProfileAnalyzerSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { BlogSection } from "@/components/landing/BlogSection";
import ReferralSection from "@/components/landing/ReferralSection";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { SEO } from "@/components/SEO";
import { PAGE_SEO, ORGANIZATION_SCHEMA, generateFAQSchema, SITE_URL } from "@/constants/seo";
import { UseCases } from "@/components/landing/UseCases";

// FAQ data for structured data
const faqData = [
  {
    question: "How does Engagematic help me grow my LinkedIn presence?",
    answer: "Engagematic uses AI to create authentic, engaging content that sounds like you. Our Persona Engine learns your unique voice, while the Viral Hook Selector ensures your posts stop the scroll. Users typically see a 6x increase in engagement within the first month."
  },
  {
    question: "Will the content sound like it was written by AI?",
    answer: "No! That's the magic of Engagematic. Our advanced Persona Engine analyzes your writing style, tone, and preferences to create content that authentically represents you. Plus, you can edit and refine every post before sharing."
  },
  {
    question: "How many posts and comments can I generate?",
    answer: "It depends on your plan. The free Starter plan includes 5 AI posts and 10 AI comments per month. Pro users get unlimited posts and comments, plus access to advanced features like the full viral hook library and analytics dashboard."
  },
  {
    question: "Can I try Engagematic before upgrading to Pro?",
    answer: "Absolutely! Start with our free Starter plan to experience the power of AI-generated LinkedIn content. When you're ready for unlimited content and advanced features, upgrade to Pro with a 7-day free trial-no credit card required."
  },
  {
    question: "How quickly can I start creating content?",
    answer: "You can start creating content in under 2 minutes! Sign up, complete our quick onboarding wizard, and you'll be generating viral-worthy LinkedIn posts immediately. No complicated setup required."
  },
  {
    question: "What makes Engagematic different from other AI tools?",
    answer: "Engagematic is specifically trained on 50,000+ viral LinkedIn posts, making it purpose-built for professional networking. Unlike generic AI tools, we understand LinkedIn's algorithm, B2B marketing dynamics, and what drives engagement on the platform. Our Persona Engine ensures every post sounds authentically like you."
  }
];

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle hash navigation when landing on the page
    if (location.hash) {
      const hash = location.hash.substring(1); // Remove the #
      // Longer delay to ensure all components are rendered
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500); // Increased delay for reliability
    }
  }, [location]);

  // Structured data for SEO
  const structuredData = [
    ORGANIZATION_SCHEMA,
    generateFAQSchema(faqData)
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <SEO {...PAGE_SEO.home} structuredData={structuredData} />
      <Hero />
      <UseCases />
      <TryItFreeSection />
      <Features />
      {/* ProfileAnalyzerSection disabled temporarily */}
      {/* <ProfileAnalyzerSection /> */}
      <Testimonials />
      <ReferralSection />
      <Pricing />
      <FAQ />
      <BlogSection />
    </div>
  );
};

export default Index;
