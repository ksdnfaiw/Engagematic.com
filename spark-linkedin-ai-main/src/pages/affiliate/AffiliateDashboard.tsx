import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  Check,
  Mail,
  Linkedin,
  Twitter,
  MessageCircle,
  BarChart3,
  Calendar,
  RefreshCw,
  LogOut,
  MousePointerClick,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Helmet } from "react-helmet-async";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const StatCardSkeleton = () => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-9 w-24 mb-2" />
    <Skeleton className="h-4 w-20" />
  </Card>
);

// ─── Status helpers ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   variant: "secondary",    icon: <Clock className="w-3 h-3" /> },
  paid:      { label: "Paid",      variant: "default",      icon: <CheckCircle2 className="w-3 h-3" /> },
  active:    { label: "Active",    variant: "default",      icon: <CheckCircle2 className="w-3 h-3" /> },
  completed: { label: "Active",    variant: "default",      icon: <CheckCircle2 className="w-3 h-3" /> },
  rewarded:  { label: "Active",    variant: "default",      icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:  { label: "Rejected",  variant: "destructive",  icon: <XCircle className="w-3 h-3" /> },
  suspended: { label: "Suspended", variant: "destructive",  icon: <XCircle className="w-3 h-3" /> },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? { label: status, variant: "outline" as const, icon: null };
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs font-medium">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
};

// ─── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 max-w-xs">{description}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AffiliateDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [affiliate, setAffiliate] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllCommissions, setShowAllCommissions] = useState(false);
  const [commissionsError, setcommissionsError] = useState(false);
  const [referralsError, setReferralsError] = useState(false);

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const affiliateToken = localStorage.getItem("affiliateToken");
      if (!affiliateToken) {
        navigate("/affiliate/login");
        return;
      }

      // Core stats - must succeed
      const statsResponse = await api.getAffiliateDashboardStats();
      if (!statsResponse.success) {
        throw new Error(statsResponse.message || "Failed to load stats");
      }
      setAffiliate(statsResponse.data.affiliate);
      setStats(statsResponse.data.stats);

      // Commissions - non-blocking
      setCommissionsError(false);
      try {
        const commissionsResponse = await api.getAffiliateCommissions(1, 50);
        if (commissionsResponse.success) {
          setCommissions(commissionsResponse.data?.commissions || []);
        } else {
          setCommissionsError(true);
        }
      } catch {
        setCommissionsError(true);
      }

      // Referrals - non-blocking
      setReferralsError(false);
      try {
        const referralsResponse = await api.getAffiliateReferrals();
        if (referralsResponse.success) {
          setReferrals(referralsResponse.data || []);
        } else {
          setReferralsError(true);
        }
      } catch {
        setReferralsError(true);
      }
    } catch (error: any) {
      const is401 =
        error.message?.includes("401") ||
        error.message?.toLowerCase().includes("authentication") ||
        error.message?.toLowerCase().includes("unauthorized");

      if (is401) {
        localStorage.removeItem("affiliateToken");
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        navigate("/affiliate/login");
      } else {
        toast({
          title: "Failed to load dashboard",
          description: error.message || "Please try refreshing.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCopy = () => {
    const link = affiliate?.referralLink;
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareOnSocial = (platform: string) => {
    const url = affiliate?.referralLink || "";
    const text = "I'm using Engagematic to grow my LinkedIn - you should try it! 🚀";
    const urls: Record<string, string> = {
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
      email:    `mailto:?subject=${encodeURIComponent("You should try Engagematic!")}&body=${encodeURIComponent(text + "\n\n" + url)}`,
    };
    if (platform === "email") window.location.href = urls.email;
    else window.open(urls[platform], "_blank", "width=600,height=400");
  };

  const handleLogout = () => {
    localStorage.removeItem("affiliateToken");
    navigate("/affiliate/login");
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <Skeleton className="h-48 w-full mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) return null;

  const isPending   = affiliate.status === "pending";
  const isRejected  = affiliate.status === "rejected";
  const isSuspended = affiliate.status === "suspended";
  const showBanner  = isPending || isRejected || isSuspended;

  const visibleCommissions = showAllCommissions ? commissions : commissions.slice(0, 5);
  const pendingTotal = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + (c.monthlyCommissionAmount || 0), 0);

  return (
    <>
      <Helmet>
        <title>Affiliate Dashboard | Engagematic</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Status Banner */}
          {showBanner && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card className={`p-4 flex items-start gap-3 ${
                isPending   ? "bg-amber-50 border-amber-200" :
                isRejected  ? "bg-red-50 border-red-200"    :
                              "bg-orange-50 border-orange-200"
              }`}>
                {isPending   ? <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" /> :
                 isRejected  ? <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /> :
                               <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {isPending   ? "Application under review - usually takes 24–48 hours" :
                     isRejected  ? "Application not approved" :
                                   "Account suspended"}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isPending
                      ? "You can explore your dashboard. Commissions are processed after approval."
                      : "Please contact support@engagematic.com for assistance."}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Welcome, {affiliate.name.split(" ")[0]}!
                </h1>
                <p className="text-gray-500 mt-1">Track your earnings and referrals in real-time</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDashboardData(true)}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              {
                icon: <MousePointerClick className="w-7 h-7 text-blue-500" />,
                label: "Link Clicks",
                value: (stats?.totalClicks || 0).toLocaleString(),
                sub: "All time",
                delay: 0.05,
              },
              {
                icon: <Users className="w-7 h-7 text-indigo-500" />,
                label: "Conversions",
                value: (stats?.totalSignups || 0).toLocaleString(),
                sub: "Paying users",
                delay: 0.1,
              },
              {
                icon: <DollarSign className="w-7 h-7 text-purple-600" />,
                label: "Total Earned",
                value: `₹${(stats?.totalEarned || 0).toLocaleString()}`,
                sub: `₹${pendingTotal.toLocaleString()} pending payout`,
                highlight: true,
                delay: 0.15,
              },
              {
                icon: <TrendingUp className="w-7 h-7 text-emerald-500" />,
                label: "Monthly Recurring",
                value: `₹${(stats?.monthlyRecurring || 0).toLocaleString()}`,
                sub: `${stats?.activeSubscriptions || 0} active subs`,
                delay: 0.2,
              },
            ].map((card) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: card.delay }}>
                <Card className={`p-5 h-full ${card.highlight ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">{card.icon}</div>
                    <BarChart3 className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5">{card.value}</div>
                  <div className="text-sm font-medium text-gray-700">{card.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Referral Link */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="p-6 sm:p-8 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">Your Affiliate Link</h2>
                <Badge variant="outline" className="text-xs">
                  {affiliate.affiliateCode}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-5">Share this link to earn 10% recurring commission on every paying subscriber.</p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input
                  value={affiliate.referralLink || ""}
                  readOnly
                  className="flex-1 font-mono text-sm bg-gray-50 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopy}
                  className="shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                >
                  {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Link</>}
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "twitter",  icon: <Twitter className="w-4 h-4" />,        label: "Twitter"  },
                  { key: "linkedin", icon: <Linkedin className="w-4 h-4" />,       label: "LinkedIn" },
                  { key: "whatsapp", icon: <MessageCircle className="w-4 h-4" />,  label: "WhatsApp" },
                  { key: "email",    icon: <Mail className="w-4 h-4" />,           label: "Email"    },
                ].map((s) => (
                  <Button
                    key={s.key}
                    onClick={() => shareOnSocial(s.key)}
                    variant="outline"
                    className="gap-2 text-sm"
                  >
                    {s.icon}{s.label}
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Bottom two-col layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Commission History */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 sm:p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Commission History</h2>
                  {commissions.length > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                      {commissions.length} record{commissions.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {commissionsError ? (
                  <EmptyState
                    icon={<AlertCircle className="w-6 h-6" />}
                    title="Couldn't load commissions"
                    description="There was a problem fetching your commission data. Try refreshing."
                  />
                ) : commissions.length === 0 ? (
                  <EmptyState
                    icon={<DollarSign className="w-6 h-6" />}
                    title="No commissions yet"
                    description="Commissions appear here once your referred users subscribe to a paid plan."
                  />
                ) : (
                  <>
                    <div className="space-y-3">
                      {visibleCommissions.map((commission: any, index: number) => (
                        <div
                          key={commission._id || index}
                          className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              ₹
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {commission.referredUserId?.name || "Referred User"}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {commission.commissionPeriod || "-"}
                                {commission.plan && <span>• {commission.plan}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="font-bold text-emerald-600 text-sm">
                              ₹{(commission.monthlyCommissionAmount || 0).toLocaleString()}
                            </div>
                            <StatusBadge status={commission.status} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {commissions.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1"
                        onClick={() => setShowAllCommissions(!showAllCommissions)}
                      >
                        {showAllCommissions
                          ? <><ChevronUp className="w-4 h-4" />Show less</>
                          : <><ChevronDown className="w-4 h-4" />Show all {commissions.length} commissions</>}
                      </Button>
                    )}
                  </>
                )}
              </Card>
            </motion.div>

            {/* Referrals */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-6 sm:p-8 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Referrals</h2>
                  {referrals.length > 0 && (
                    <span className="text-xs text-gray-400 font-medium">
                      {referrals.length} user{referrals.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {referralsError ? (
                  <EmptyState
                    icon={<AlertCircle className="w-6 h-6" />}
                    title="Couldn't load referrals"
                    description="There was a problem fetching your referrals. Try refreshing."
                  />
                ) : referrals.length === 0 ? (
                  <EmptyState
                    icon={<Users className="w-6 h-6" />}
                    title="No referrals yet"
                    description="Share your affiliate link to start earning. Referrals appear here once users sign up and subscribe."
                  />
                ) : (
                  <div className="space-y-3">
                    {referrals.slice(0, 10).map((referral: any, index: number) => {
                      const user = referral.referredUser;
                      const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
                      // FIX: joinedDate is inside referredUser object per backend response
                      const joinedDate = user?.joinedDate || referral.joinedDate;
                      return (
                        <div
                          key={referral.id || index}
                          className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {user?.name || user?.email || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {joinedDate
                                  ? new Date(joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "-"}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={referral.status} />
                        </div>
                      );
                    })}
                    {referrals.length > 10 && (
                      <p className="text-center text-xs text-gray-400 pt-2">
                        +{referrals.length - 10} more referrals
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Footer tip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="mt-8 p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-900">Pro tip: LinkedIn posts convert best</p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Affiliates who share their link in LinkedIn posts earn 3× more than those who only use email.
                  Tell your audience what Engagematic helped you achieve - personal stories outperform generic promotions.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
