/**
 * SEO Constants and Keywords for Engagematic
 * Centralized SEO configuration for consistency across all pages
 */

// Primary Brand
export const SITE_NAME = 'Engagematic';
export const SITE_URL = 'https://www.engagematic.com';
export const SITE_DOMAIN = 'engagematic.com';

// Primary Keywords (High-Value)
export const PRIMARY_KEYWORDS = [
  'LinkedIn post generator',
  'AI LinkedIn posts',
  'LinkedIn content generator',
  'LinkedIn post scheduler',
  'LinkedIn automation',
  'AI LinkedIn content',
  'LinkedIn carousel generator',
  'LinkedIn comment generator',
  'LinkedIn profile analyzer',
  'AI content creator',
  'LinkedIn automation tool',
  'viral LinkedIn posts',
  'LinkedIn growth tool',
  'LinkedIn AI assistant',
  'LinkedIn content creator',
  'LinkedIn marketing tool',
  'LinkedIn AI tool',
  'LinkedIn post creator',
  'LinkedIn content automation',
  'LinkedIn engagement tool'
];

// Secondary Keywords
export const SECONDARY_KEYWORDS = [
  'LinkedIn marketing',
  'social media content',
  'creator economy tools',
  'LinkedIn engagement',
  'professional networking',
  'content marketing AI',
  'LinkedIn analytics',
  'thought leadership',
  'personal branding',
  'B2B marketing tools'
];

// Brand Misspellings and Variations
export const BRAND_VARIATIONS = [
  'Engagematic',
  'Engagematic AI',
  'Engagematic tool',
  'Engagematic app',
  'Engagematic software',
  'Engagematic platform'
];

// Competitive Keywords
export const COMPETITIVE_KEYWORDS = [
  // Direct Competitors
  'Engagematic vs Taplio',
  'Engagematic vs Hootsuite',
  'Engagematic vs ChatGPT',
  'Engagematic vs AuthoredUp',
  'Engagematic vs Kleo',
  'Engagematic vs Buffer',
  'Engagematic vs Sprout Social',
  'Engagematic vs Later',
  'Engagematic vs CoSchedule',
  'Engagematic vs Canva',
  
  // Alternative Tools
  'Taplio alternative',
  'Hootsuite alternative',
  'Buffer alternative',
  'Sprout Social alternative',
  'Later alternative',
  'CoSchedule alternative',
  'Canva alternative',
  'ChatGPT alternative LinkedIn',
  'AuthoredUp alternative',
  'Kleo alternative',
  
  // Tool Comparisons
  'best LinkedIn automation tool',
  'best LinkedIn content generator',
  'best LinkedIn post scheduler',
  'best LinkedIn AI tool',
  'best LinkedIn marketing tool',
  'LinkedIn automation tools comparison',
  'LinkedIn content tools comparison',
  'LinkedIn AI tools comparison',
  'LinkedIn marketing tools comparison',
  'LinkedIn post generators comparison'
];

// Long-tail Keywords
export const LONG_TAIL_KEYWORDS = [
  'how to create viral LinkedIn posts',
  'how to generate LinkedIn content with AI',
  'how to automate LinkedIn posts',
  'how to schedule LinkedIn content',
  'how to optimize LinkedIn profile',
  'how to grow LinkedIn following',
  'how to increase LinkedIn engagement',
  'how to build LinkedIn presence',
  'how to create LinkedIn content strategy',
  'how to use AI for LinkedIn marketing',
  'best practices for LinkedIn content',
  'LinkedIn content creation tips',
  'LinkedIn marketing strategies',
  'LinkedIn automation best practices',
  'LinkedIn AI content generation',
  'LinkedIn post optimization techniques',
  'LinkedIn engagement strategies',
  'LinkedIn profile optimization guide',
  'LinkedIn content calendar planning',
  'LinkedIn thought leadership content'
];

// Industry-Specific Keywords
export const INDUSTRY_KEYWORDS = [
  'LinkedIn for startups',
  'LinkedIn for SaaS companies',
  'LinkedIn for agencies',
  'LinkedIn for consultants',
  'LinkedIn for freelancers',
  'LinkedIn for recruiters',
  'LinkedIn for sales teams',
  'LinkedIn for marketers',
  'LinkedIn for founders',
  'LinkedIn for CEOs',
  'LinkedIn for entrepreneurs',
  'LinkedIn for B2B companies',
  'LinkedIn for tech companies',
  'LinkedIn for healthcare',
  'LinkedIn for finance',
  'LinkedIn for real estate',
  'LinkedIn for education',
  'LinkedIn for nonprofits',
  'LinkedIn for e-commerce',
  'LinkedIn for manufacturing'
];

// Problem-Solving Keywords
export const PROBLEM_KEYWORDS = [
  'LinkedIn shadowbanning prevention',
  'LinkedIn algorithm changes 2025',
  'LinkedIn content not getting views',
  'LinkedIn posts not engaging',
  'LinkedIn profile not visible',
  'LinkedIn connection requests ignored',
  'LinkedIn content ideas exhausted',
  'LinkedIn posting frequency optimal',
  'LinkedIn hashtag strategy',
  'LinkedIn video content best practices',
  'LinkedIn carousel post creation',
  'LinkedIn article writing tips',
  'LinkedIn company page optimization',
  'LinkedIn personal branding mistakes',
  'LinkedIn networking strategies',
  'LinkedIn lead generation techniques',
  'LinkedIn sales prospecting content',
  'LinkedIn recruitment content',
  'LinkedIn thought leadership positioning',
  'LinkedIn content calendar management'
];

// Combined Keywords for SEO
export const ALL_KEYWORDS = [
  ...PRIMARY_KEYWORDS,
  ...SECONDARY_KEYWORDS,
  ...BRAND_VARIATIONS,
  ...COMPETITIVE_KEYWORDS,
  ...LONG_TAIL_KEYWORDS,
  ...INDUSTRY_KEYWORDS,
  ...PROBLEM_KEYWORDS
];

// Default SEO Configuration
export const DEFAULT_SEO = {
  title: 'Engagematic - Free LinkedIn Tools & AI Post Generator | Viral Content',
  description: 'Free LinkedIn tools: AI post generator, text formatter, engagement calculator & more. Create viral posts in 30 seconds. No signup for free tools. Join 1000+ creators.',
  keywords: ALL_KEYWORDS.join(', '),
  author: 'Engagematic Team',
  image: `${SITE_URL}/og-default.png`,
  imageAlt: 'Engagematic - Free LinkedIn Tools & AI Content Generator',
  twitterHandle: '@engagematic',
  locale: 'en_US',
  type: 'website'
};

// Page-Specific SEO - Optimized for organic traffic & free tools
export const PAGE_SEO = {
  home: {
    title: 'Free LinkedIn Tools & AI Post Generator | Viral Posts in 30 Sec | Engagematic',
    description: 'Use free LinkedIn tools: AI post generator, text formatter, engagement calculator. No signup. Create viral LinkedIn posts in 30 seconds. Used by 1000+ creators & marketers.',
    keywords: 'free linkedin tools, linkedin post generator free, linkedin text formatter, linkedin engagement calculator, ai linkedin posts, viral linkedin content, linkedin content generator free, best linkedin ai tool, linkedin post creator, linkedin automation',
    canonical: SITE_URL,
    image: `${SITE_URL}/og-home.png`
  },

  pricing: {
    title: 'Pricing - Free LinkedIn Tools & Pro Plans | Engagematic',
    description: 'Free LinkedIn tools available now. Pro from $12/mo: unlimited AI posts, comments, content planner. 7-day free trial, no card required.',
    keywords: 'linkedin tool pricing, free linkedin tools, engagematic pricing, linkedin ai cost',
    canonical: `${SITE_URL}/pricing`
  },

  postGenerator: {
    title: 'AI LinkedIn Post Generator - Free Viral Post Creator | Engagematic',
    description: 'Generate viral LinkedIn posts with AI in 30 seconds. Free tool: 50K+ viral post training, personas, hooks. No signup. Best free LinkedIn post generator for creators.',
    keywords: 'free linkedin post generator, ai linkedin post generator, linkedin post creator, viral linkedin posts, linkedin content generator free, linkedin ai tool',
    canonical: `${SITE_URL}/post-generator`
  },

  commentGenerator: {
    title: 'Free LinkedIn Comment Generator - AI Engagement Tool | Engagematic',
    description: 'Free AI LinkedIn comment generator. Write genuine comments that start conversations and grow your network. No signup. Use instantly.',
    keywords: 'free linkedin comment generator, linkedin comment generator ai, linkedin engagement tool, linkedin comment maker, ai comments linkedin',
    canonical: `${SITE_URL}/comment-generator`
  },

  profileAnalyzer: {
    title: 'LinkedIn Profile Analyzer - Free Score & Optimization | Engagematic',
    description: 'Free LinkedIn profile analyzer: get your score, headline tips, and optimization advice. AI-powered. No signup for first analysis.',
    keywords: 'linkedin profile analyzer free, linkedin profile score, linkedin profile checker, linkedin optimization',
    canonical: `${SITE_URL}/profile-analyzer`
  },

  // Free Tools - Primary traffic target
  freeTools: {
    title: 'Free LinkedIn Tools - Post Generator, Text Formatter, Engagement Calculator | No Signup',
    description: '100% free LinkedIn tools: AI post generator, text formatter (bold/italic), engagement rate calculator, comment generator, idea generator. No signup required. Use instantly to grow your LinkedIn presence. Best free LinkedIn tools for creators and marketers.',
    keywords: 'free linkedin tools, linkedin tools free, linkedin post generator free, linkedin text formatter free, linkedin engagement calculator free, linkedin comment generator free, linkedin idea generator, linkedin tools no signup, free linkedin software, linkedin content tools free, linkedin marketing tools free, linkedin automation tools free, linkedin analytics tools free, linkedin post tools, linkedin content creation tools, linkedin tools online, best free linkedin tools, linkedin tools for creators, linkedin tools for marketers, linkedin productivity tools',
    canonical: `${SITE_URL}/tools`
  },

  linkedinProfileAnalyzerTool: {
    title: 'Free LinkedIn Profile Analyzer - Score & Tips | Engagematic',
    description: 'Free LinkedIn profile analyzer. Get AI score (0-100), headline rewrite, about section tips. No signup. Improve profile for more reach.',
    keywords: 'free linkedin profile analyzer, linkedin profile score, linkedin profile checker, linkedin optimization free',
    canonical: `${SITE_URL}/tools/linkedin-profile-analyzer`
  },

  linkedinPostGeneratorTool: {
    title: 'Free LinkedIn Post Generator AI - Create Viral Posts Instantly | No Signup Required',
    description: 'Generate viral LinkedIn posts instantly with our free AI post generator. Trained on 50,000+ high-performing posts. No signup needed. Create engaging LinkedIn content in seconds. Best free LinkedIn post generator tool for creators, marketers, and professionals.',
    keywords: 'linkedin post generator, free linkedin post generator, ai linkedin post generator, linkedin content generator, linkedin post creator, viral linkedin posts, linkedin post maker, linkedin content creator, ai linkedin content, linkedin post generator free online, best linkedin post generator, linkedin ai tool, linkedin content generator free, create linkedin posts, linkedin post writing tool, linkedin post generator ai free, linkedin content creation tool, linkedin post generator tool, linkedin post creator free, linkedin post generator no signup',
    canonical: `${SITE_URL}/tools/linkedin-post-generator`
  },

  linkedinEngagementCalculator: {
    title: 'LinkedIn Engagement Rate Calculator Free - Calculate Post Performance Instantly',
    description: 'Free LinkedIn engagement rate calculator. Calculate your LinkedIn post engagement rate instantly. Compare against industry benchmarks. Get post performance score and actionable insights. No signup required. Best free LinkedIn analytics tool.',
    keywords: 'linkedin engagement rate calculator, linkedin engagement rate, linkedin engagement calculator, linkedin post engagement, linkedin engagement rate calculator free, calculate linkedin engagement, linkedin metrics calculator, linkedin analytics tool, linkedin post performance, linkedin engagement score, linkedin engagement rate tool, free linkedin analytics, linkedin engagement calculator free, linkedin post metrics, linkedin engagement analysis, linkedin engagement benchmark, linkedin post engagement rate, linkedin engagement calculator online, linkedin analytics free, linkedin engagement tool',
    canonical: `${SITE_URL}/tools/linkedin-engagement-rate-calculator`
  },

  linkedinTextFormatter: {
    title: 'LinkedIn Text Formatter Free - Bold, Italic, Underline Text for LinkedIn Posts',
    description: 'Free LinkedIn text formatter tool. Format LinkedIn posts with bold, italic, underline, strikethrough using Unicode. Works in LinkedIn posts and messages. No signup required. Best free LinkedIn text formatting tool for professional posts.',
    keywords: 'linkedin text formatter, linkedin bold text, linkedin italic text, linkedin text formatter free, format linkedin post, linkedin unicode text, linkedin post formatter, linkedin bold text generator, linkedin italic text generator, linkedin text formatting, linkedin bold font, linkedin italic font, linkedin underline text, linkedin strikethrough text, linkedin text style, linkedin post formatting, linkedin text formatter tool, linkedin text formatter free online, linkedin bold text converter, linkedin text editor, linkedin post text formatter, linkedin message formatter, linkedin text formatting tool',
    canonical: `${SITE_URL}/tools/linkedin-text-formatter`
  },

  videoTranscriptTool: {
    title: 'Free Video Transcript Generator – YouTube, MP4 & More | Engagematic',
    description: 'Convert any video to text instantly. Paste a YouTube link, public MP4 URL, or upload a video file. Get a clean transcript in seconds. 100% free, no signup required.',
    keywords: 'free video transcript generator, video to text free, youtube transcript generator, mp4 to text, video transcription online free, transcribe video free, video to text converter, youtube video to text, free transcription tool, video transcript maker, online video transcriber, ai transcription free, video caption generator, convert video to text, speech to text from video',
    canonical: `${SITE_URL}/tools/video-transcript-generator`
  },
  
  ideaGenerator: {
    title: 'Free LinkedIn Idea Generator - Viral Post Ideas | Engagematic',
    description: 'Free LinkedIn post idea generator. Get viral-worthy content angles and post ideas with AI. No signup. Use for content strategy.',
    keywords: 'linkedin idea generator free, linkedin post ideas, linkedin content ideas, viral linkedin ideas',
    canonical: `${SITE_URL}/idea-generator`
  },

  templates: {
    title: 'LinkedIn Post Templates - Free Copy-Paste | Engagematic',
    description: 'Free LinkedIn post templates: hooks, CTAs, carousels. Copy-paste and customize. Use with our free LinkedIn tools for best results.',
    keywords: 'linkedin post templates, linkedin content templates, free linkedin templates',
    canonical: `${SITE_URL}/templates`
  },

  waitlist: {
    title: 'Join the Waitlist - Engagematic Premium | Engagematic',
    description: 'Join the Engagematic waitlist for early access and exclusive pricing on premium LinkedIn AI tools.',
    keywords: 'Engagematic waitlist, LinkedIn tool early access',
    canonical: `${SITE_URL}/waitlist`
  },

  faq: {
    title: 'FAQ - Free LinkedIn Tools & AI Post Generator | Engagematic',
    description: 'FAQs about free LinkedIn tools, AI post generator, text formatter, engagement calculator. Pricing, features, and how to get traffic.',
    keywords: 'free linkedin tools faq, linkedin post generator help, engagematic faq',
    canonical: `${SITE_URL}/faq`
  },

  blog: {
    title: 'Blog - LinkedIn Tips, Viral Posts & Free Tools | Engagematic',
    description: 'LinkedIn growth tips, viral post strategies, and how to use free LinkedIn tools. Content ideas and creator growth.',
    keywords: 'linkedin blog, linkedin tips, viral linkedin posts, free linkedin tools, linkedin growth',
    canonical: `${SITE_URL}/blogs`
  },

  register: {
    title: 'Sign Up Free - 7-Day Trial | Free LinkedIn Tools | Engagematic',
    description: 'Sign up free. No credit card. Get 7-day trial + access to free LinkedIn tools: post generator, formatter, engagement calculator.',
    keywords: 'free linkedin tools signup, engagematic free trial, linkedin ai signup',
    canonical: `${SITE_URL}/auth/register`
  },

  about: {
    title: 'About Engagematic - Free LinkedIn Tools & AI for Creators',
    description: 'We build free LinkedIn tools and AI that help creators grow. Post generator, text formatter, engagement calculator. No signup for free tools.',
    keywords: 'about engagematic, linkedin tools for creators, free linkedin ai',
    canonical: `${SITE_URL}/about`
  },

  contact: {
    title: 'Contact - Free LinkedIn Tools Support | Engagematic',
    description: 'Contact Engagematic for support with free LinkedIn tools, AI post generator, or Pro plans. We reply within 24 hours.',
    keywords: 'contact engagematic, linkedin tool support',
    canonical: `${SITE_URL}/contact`
  },

  privacy: {
    title: 'Privacy Policy | Engagematic',
    description: 'Privacy policy for Engagematic free LinkedIn tools and AI post generator. How we use and protect your data.',
    keywords: 'engagematic privacy, linkedin tool privacy',
    canonical: `${SITE_URL}/privacy`
  },

  terms: {
    title: 'Terms of Service | Engagematic',
    description: 'Terms of service for Engagematic free LinkedIn tools and AI content platform.',
    keywords: 'engagematic terms, linkedin tool terms',
    canonical: `${SITE_URL}/terms`
  }
};

// Schema.org Organization Data
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': SITE_NAME,
  'applicationCategory': 'BusinessApplication',
  'operatingSystem': 'Web',
  'offers': {
    '@type': 'AggregateOffer',
    'priceCurrency': 'USD',
    'lowPrice': '0',
    'highPrice': '24',
    'offerCount': '3'
  },
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': '4.8',
    'ratingCount': '1000',
    'bestRating': '5',
    'worstRating': '1'
  },
  'url': SITE_URL,
  'description': DEFAULT_SEO.description,
  'image': DEFAULT_SEO.image,
  'author': {
    '@type': 'Organization',
    'name': SITE_NAME
  }
};

// Breadcrumb Schema Generator
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

// FAQ Schema Generator
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };
}

// Product Schema for Tools
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': product.description,
    'brand': {
      '@type': 'Brand',
      'name': SITE_NAME
    },
    'offers': {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': product.currency,
      'availability': 'https://schema.org/InStock',
      'url': SITE_URL
    }
  };
}

// Article Schema for Blog Posts
export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  image: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.description,
    'image': article.image,
    'author': {
      '@type': 'Person',
      'name': article.author
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
      'logo': {
        '@type': 'ImageObject',
        'url': `${SITE_URL}/logo.svg`
      }
    },
    'datePublished': article.datePublished,
    'dateModified': article.dateModified,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': article.url
    }
  };
}
