import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { LogoWithText } from "@/components/LogoWithText";
import { LayoutDashboard, Home, User, LogOut, Lightbulb, FileText, MessageSquare, Menu, X, Calendar, Loader2, Crown, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export const DashboardLayout = () => {
  const { user, isLoading, checkAuthStatus, logout, isAuthenticated } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Check if user has paid plan (only check if subscription is loaded and user is authenticated)
  const hasPaidPlan = isAuthenticated && 
    !subscriptionLoading && 
    subscription && 
    subscription.plan !== 'trial' && 
    subscription.status === 'active';
  
  // Sidebar state - persist in localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, premiumOnly: false },
    { path: "/idea-generator", label: "Idea Generator", icon: Lightbulb, premiumOnly: false },
    { path: "/post-generator", label: "Post Generator", icon: FileText, premiumOnly: false },
    { path: "/comment-generator", label: "Comment Generator", icon: MessageSquare, premiumOnly: false },
    { path: "/content-planner", label: "Content Planner", icon: Calendar, premiumOnly: true },
    { path: "/tools/video-transcript-generator", label: "Video Transcript", icon: FileVideo, premiumOnly: false },
  ] as const;

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Show onboarding modal if user hasn't completed it
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user && !isLoading) {
      checkAuthStatus?.();
      return;
    }

    const needsOnboarding = user && (
      !user.profile || 
      user.profile.onboardingCompleted === false || 
      user.profile.onboardingCompleted === undefined ||
      user.profile.onboardingCompleted === null
    );

    if (needsOnboarding && !hasChecked) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
        setHasChecked(true);
      }, 800);
      return () => clearTimeout(timer);
    } else if (!needsOnboarding) {
      setShowOnboarding(false);
      setHasChecked(true);
    }
  }, [user, isLoading, checkAuthStatus, hasChecked]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      checkAuthStatus?.();
    }
  }, [isLoading, isAuthenticated, checkAuthStatus]);

  // Allow Content Planner to render its own access control
  // Other dashboard routes require authentication
  const isContentPlannerRoute = location.pathname === '/content-planner';
  
  if (isContentPlannerRoute) {
    // Let ContentPlanner handle its own access control
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
        <Outlet />
      </div>
    );
  }

  // For other dashboard routes, require authentication
  if (!isAuthenticated && !isLoading) {
    return null;
  }
  
  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Sidebar - Responsive & Collapsible */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen
        transform transition-all duration-300 ease-in-out
        bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
        ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col overflow-hidden
      `}>
        {/* Logo/Brand */}
        <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between ${!sidebarOpen ? 'lg:px-3' : ''}`}>
          {sidebarOpen ? (
            <Link to="/dashboard" className="flex-1">
              <LogoWithText textSize="sm" />
            </Link>
          ) : (
            <Link to="/dashboard" className="flex justify-center w-full lg:px-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
            </Link>
          )}
          {/* Close button - only show when sidebar is open on desktop */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Collapse sidebar"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 sm:p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isLocked = item.premiumOnly && !hasPaidPlan;

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (isLocked) {
                    navigate('/plan-management');
                  } else {
                    navigate(item.path);
                  }
                  setMobileSidebarOpen(false);
                }}
                className={`
                  w-full text-left flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${sidebarOpen ? "" : "lg:justify-center lg:px-2"}
                  ${
                    isActive && !isLocked
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : isLocked
                      ? "text-gray-400 dark:text-gray-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }
                `}
                title={!sidebarOpen ? (isLocked ? `${item.label} (Premium)` : item.label) : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`font-medium ${isLocked ? 'text-gray-400 dark:text-gray-500' : ''}`}>{item.label}</span>
                    {isLocked && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                        <Crown className="h-3 w-3" />
                        Pro
                      </span>
                    )}
                  </div>
                )}
                {!sidebarOpen && isLocked && (
                  <Crown className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section - Only show if authenticated */}
        {isAuthenticated && (
          <div className={`p-2 sm:p-4 border-t border-gray-200 dark:border-slate-800 space-y-2 ${!sidebarOpen ? 'lg:px-2' : ''}`}>
            <Link
              to="/profile"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all
                ${sidebarOpen ? '' : 'lg:justify-center lg:px-2'}
              `}
              title={!sidebarOpen ? 'Profile' : ''}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Profile</span>}
            </Link>
            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all
                ${sidebarOpen ? '' : 'lg:justify-center lg:px-2'}
              `}
              title={!sidebarOpen ? 'Home' : ''}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Home</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all
                ${sidebarOpen ? '' : 'lg:justify-center lg:px-2'}
              `}
              title={!sidebarOpen ? 'Logout' : ''}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        )}

        {/* Expand button - only show when collapsed on desktop */}
        {!sidebarOpen && (
          <div className="hidden lg:flex p-2 border-t border-gray-200 dark:border-slate-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Top Header - Mobile menu button */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/dashboard">
              <LogoWithText textSize="sm" />
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <div className="w-full" style={{ minHeight: '100vh', position: 'relative' }}>
          <Outlet />
        </div>
      </main>

      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onComplete={async () => {
          setShowOnboarding(false);
          if (checkAuthStatus) {
            await checkAuthStatus();
          }
        }}
      />
    </div>
  );
};