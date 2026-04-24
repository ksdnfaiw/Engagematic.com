import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import AppLayout from "./components/layout/AppLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));

// Lazy load heavy components for better performance
const PostGenerator = lazy(() => import("./pages/PostGenerator"));
const IdeaGenerator = lazy(() => import("./pages/IdeaGenerator"));
const CommentGenerator = lazy(() => import("./pages/CommentGenerator"));
const ProfileAnalyzer = lazy(() => import("./pages/ProfileAnalyzer"));
// Try direct import first to debug - change back to lazy after fixing
const ContentPlanner = lazy(() => import("./pages/ContentPlanner"));
// import ContentPlanner from "./pages/ContentPlanner";
const FreeTools = lazy(() => import("./pages/FreeTools"));
const LinkedInProfileAnalyzerTool = lazy(() => import("./pages/tools/LinkedInProfileAnalyzerTool"));
const LinkedInPostGeneratorTool = lazy(() => import("./pages/tools/LinkedInPostGeneratorTool"));
const LinkedInEngagementCalculator = lazy(() => import("./pages/tools/LinkedInEngagementCalculator"));
const LinkedInTextFormatter = lazy(() => import("./pages/tools/LinkedInTextFormatter"));
const VideoTranscriptTool = lazy(() => import("./pages/tools/VideoTranscriptTool"));
import { ErrorBoundary } from "./components/ErrorBoundary";
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const Referrals = lazy(() => import("./pages/Referrals"));
const AffiliateProgram = lazy(() => import("./pages/AffiliateProgram"));
const AffiliateRegister = lazy(() => import("./pages/affiliate/AffiliateRegister"));
const AffiliateLogin = lazy(() => import("./pages/affiliate/AffiliateLogin"));
const AffiliateDashboard = lazy(() => import("./pages/affiliate/AffiliateDashboard"));
import { ProtectedAffiliateRoute } from "./components/affiliate/ProtectedAffiliateRoute";
const TestimonialCollection = lazy(() => import("./pages/TestimonialCollection"));
// PlanManagement page removed - redirects to pricing section
const BlogListingPage = lazy(() => import("./pages/BlogListingPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const PricingRedirect = lazy(() => import("./pages/PricingRedirect"));
// Admin Pages - lazy loaded (only accessed by admins, saves ~80KB from main bundle)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AffiliateManagement = lazy(() => import("./pages/admin/AffiliateManagement"));
const TestimonialsManagement = lazy(() => import("./pages/admin/TestimonialsManagement"));
const BlogManagement = lazy(() => import("./pages/admin/BlogManagement"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const EmailAnalytics = lazy(() => import("./pages/admin/EmailAnalytics"));
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - avoid unnecessary refetches
      gcTime: 10 * 60 * 1000, // 10 minutes - keep cache in memory
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch when user switches tabs
    },
  },
});

// Loading component for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span>Loading...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AdminProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Public auth pages without layout */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/google/callback" element={<Suspense fallback={<PageLoader />}><GoogleCallback /></Suspense>} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/testimonial" element={<TestimonialCollection />} />
                
                {/* Admin Routes - No AppLayout */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedAdminRoute>
                      <UserManagement />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/admin/affiliates" 
                  element={
                    <ProtectedAdminRoute>
                      <AffiliateManagement />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/admin/testimonials" 
                  element={
                    <ProtectedAdminRoute>
                      <TestimonialsManagement />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/admin/blog" 
                  element={
                    <ProtectedAdminRoute>
                      <BlogManagement />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedAdminRoute>
                      <Analytics />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route 
                  path="/admin/email-analytics" 
                  element={
                    <ProtectedAdminRoute>
                      <EmailAnalytics />
                    </ProtectedAdminRoute>
                  } 
                />
                {/* Redirect /admin to /admin/dashboard */}
                <Route path="/admin" element={<AdminLogin />} />

                {/* All other pages share header/footer */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  
                  {/* Free Tools Pages - Public SEO Pages */}
                  <Route path="/tools" element={<FreeTools />} />
                  {/* LinkedIn Profile Analyzer Tool disabled temporarily */}
                  {/* <Route path="/tools/linkedin-profile-analyzer" element={<LinkedInProfileAnalyzerTool />} /> */}
                  <Route path="/tools/linkedin-post-generator" element={<LinkedInPostGeneratorTool />} />
                  <Route path="/tools/linkedin-engagement-rate-calculator" element={<LinkedInEngagementCalculator />} />
                  <Route path="/tools/linkedin-text-formatter" element={<ErrorBoundary><LinkedInTextFormatter /></ErrorBoundary>} />
                  
                  {/* Dashboard routes with onboarding modal */}
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/idea-generator" element={<IdeaGenerator />} />
                    <Route path="/post-generator" element={<PostGenerator />} />
                    <Route path="/comment-generator" element={<CommentGenerator />} />
                    <Route path="/content-planner" element={<ContentPlanner />} />
                    <Route path="/tools/video-transcript-generator" element={<VideoTranscriptTool />} />
                  </Route>
                  {/* Blog Routes */}
                  {/* Static Pages */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/resources" element={<HelpCenterPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  {/* Plan Management route removed - redirects to pricing section */}
                  <Route path="/plan-management" element={<PricingRedirect />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/post/:postId" element={<PostDetailPage />} />
                <Route path="/referral" element={<Referrals />} />
                <Route path="/affiliate" element={<AffiliateProgram />} />
                <Route path="/affiliate/register" element={<AffiliateRegister />} />
                <Route path="/affiliate/login" element={<AffiliateLogin />} />
                <Route 
                  path="/affiliate/dashboard" 
                  element={
                    <ProtectedAffiliateRoute>
                      <AffiliateDashboard />
                    </ProtectedAffiliateRoute>
                  } 
                />
                <Route path="/blogs" element={<BlogListingPage />} />
                  <Route path="/blogs/:slug" element={<BlogPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </TooltipProvider>
          </AdminProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
