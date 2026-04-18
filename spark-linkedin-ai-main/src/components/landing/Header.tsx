import { Button } from "@/components/ui/button";
import { premiumCTAClasses, premiumCTAHighlight, premiumCTAIcon } from "@/styles/premiumButtons";
import { Menu, Home, FileText, MessageSquare, Lightbulb, User, LogOut, ArrowRight, ChevronDown, BarChart3, Type, FileVideo } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDropdownMenu } from "../UserDropdownMenu";
import { LogoWithText } from "../LogoWithText";

export const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    // If we're on the home page, scroll to section
    if (location.pathname === '/') {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    } else {
      // Otherwise, navigate to home page with hash
      navigate(`/#${id}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/');
    setIsLoggingOut(false);
  };

  const handleStartFree = () => {
    navigate('/auth/register');
  };

  // Navigation items for authenticated users
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/idea-generator', label: 'Ideas', icon: Lightbulb },
    { path: '/post-generator', label: 'Posts', icon: FileText },
    { path: '/comment-generator', label: 'Comments', icon: MessageSquare },
  ];

  // Check if we're on a dashboard route (hide header navigation for sidebar layout)
  const isDashboardRoute = ['/dashboard', '/idea-generator', '/post-generator', '/comment-generator'].includes(location.pathname);

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isDashboardRoute ? 'hidden' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <LogoWithText 
            textSize="md"
            to="/"
          />
          
          {/* Desktop Navigation - Hidden on dashboard routes */}
          {!isDashboardRoute && (
            <>
              {isAuthenticated ? (
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ) : (
                <nav className="hidden md:flex items-center gap-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-muted/50 hover:text-foreground hover:border-primary/30 transition-all outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
                      Free Tools
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={8} className="w-72 rounded-xl border-2 border-border/80 bg-background shadow-xl p-2">
                      <div className="px-3 py-2 mb-1 border-b border-border/60">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">LinkedIn Free Tools</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">No signup · Use instantly</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to="/tools" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></span>
                          <span className="font-medium">All LinkedIn Free Tools</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/tools/linkedin-post-generator" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10"><FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" /></span>
                          <span className="font-medium">LinkedIn Post Generator</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/tools/linkedin-engagement-rate-calculator" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10"><BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></span>
                          <span className="font-medium">LinkedIn Engagement Calculator</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/tools/linkedin-text-formatter" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10"><Type className="h-4 w-4 text-purple-600 dark:text-purple-400" /></span>
                          <span className="font-medium">LinkedIn Text Formatter</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/tools/video-transcript-generator" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10"><FileVideo className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /></span>
                          <span className="font-medium">Video Transcript Generator</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/#free-generator" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10"><MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" /></span>
                          <span className="font-medium">LinkedIn Comment Generator</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/#free-generator" className="flex items-center gap-3 rounded-lg py-2.5 px-3 cursor-pointer hover:bg-primary/5 focus:bg-primary/5 outline-none">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/10"><Lightbulb className="h-4 w-4 text-pink-600 dark:text-pink-400" /></span>
                          <span className="font-medium">LinkedIn Idea Generator</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-foreground/80 hover:text-foreground transition-smooth"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="text-foreground/80 hover:text-foreground transition-smooth"
                  >
                    Pricing
                  </button>
                  <Link 
                    to="/blogs"
                    className="text-foreground/80 hover:text-foreground transition-smooth"
                  >
                    Blog
                  </Link>
                  <button 
                    onClick={() => scrollToSection('faq')}
                    className="text-foreground/80 hover:text-foreground transition-smooth"
                  >
                    FAQ
                  </button>
                </nav>
              )}
            </>
          )}
          
          {/* Desktop Actions - Hidden on dashboard routes */}
          {!isDashboardRoute && (
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <UserDropdownMenu />
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/auth/login')}
                    size="sm"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={handleStartFree}
                    className={premiumCTAClasses}
                  >
                    <span className={premiumCTAHighlight} />
                    <span className="relative">Start Free</span>
                    <ArrowRight className={premiumCTAIcon} />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu - Hidden on dashboard routes */}
          {!isDashboardRoute && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col gap-6 mt-8">
                  {isAuthenticated ? (
                    <>
                      {/* User Profile in Mobile */}
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>

                      {/* Navigation Links in Mobile */}
                      <nav className="flex flex-col gap-2">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.path;
                          
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-foreground hover:bg-muted'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </nav>

                    {/* Logout Button */}
                    <div className="pt-4 border-t mt-auto">
                      <Button 
                        variant="outline" 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        {isLoggingOut ? 'Signing out...' : 'Logout'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <nav className="flex flex-col gap-4">
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary px-1">LinkedIn Free Tools</p>
                        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2">
                          <Link 
                            to="/tools"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></span>
                            All LinkedIn Free Tools
                          </Link>
                          <Link 
                            to="/tools/linkedin-post-generator"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10"><FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" /></span>
                            LinkedIn Post Generator
                          </Link>
                          <Link 
                            to="/tools/linkedin-engagement-rate-calculator"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10"><BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></span>
                            LinkedIn Engagement Calculator
                          </Link>
                          <Link 
                            to="/tools/linkedin-text-formatter"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10"><Type className="h-4 w-4 text-purple-600 dark:text-purple-400" /></span>
                            LinkedIn Text Formatter
                          </Link>
                          <Link 
                            to="/tools/video-transcript-generator"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10"><FileVideo className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /></span>
                            Video Transcript Generator
                          </Link>
                          <Link 
                            to="/#free-generator"
                            onClick={() => { setMobileMenuOpen(false); scrollToSection('free-generator'); }}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10"><MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" /></span>
                            LinkedIn Comment Generator
                          </Link>
                          <Link 
                            to="/#free-generator"
                            onClick={() => { setMobileMenuOpen(false); scrollToSection('free-generator'); }}
                            className="flex items-center gap-3 rounded-lg py-2.5 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10"><Lightbulb className="h-4 w-4 text-pink-600 dark:text-pink-400" /></span>
                            LinkedIn Idea Generator
                          </Link>
                        </div>
                      </div>
                      <button 
                        onClick={() => scrollToSection('features')}
                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-smooth"
                      >
                        Features
                      </button>
                      <button 
                        onClick={() => scrollToSection('pricing')}
                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-smooth"
                      >
                        Pricing
                      </button>
                      <Link 
                        to="/blogs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-smooth"
                      >
                        Blog
                      </Link>
                      <button 
                        onClick={() => scrollToSection('faq')}
                        className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-smooth"
                      >
                        FAQ
                      </button>
                    </nav>

                    <div className="flex flex-col gap-3 pt-4 border-t">
                      <Button 
                        onClick={() => {
                          navigate('/auth/login');
                          setMobileMenuOpen(false);
                        }}
                        variant="ghost"
                        className="w-full"
                      >
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => {
                          handleStartFree();
                          setMobileMenuOpen(false);
                        }}
                        className={`${premiumCTAClasses} w-full`}
                      >
                        <span className={premiumCTAHighlight} />
                        <span className="relative">Start Free Trial</span>
                        <ArrowRight className={premiumCTAIcon} />
                      </Button>
                    </div>
                  </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};
