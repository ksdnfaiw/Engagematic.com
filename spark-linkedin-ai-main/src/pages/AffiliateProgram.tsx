import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Gift,
  Users,
  TrendingUp,
  DollarSign,
  Share2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Trophy,
  BarChart3,
  MessageCircle,
  Mail,
  Linkedin,
  Twitter,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

export default function AffiliateProgram() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleJoinProgram = () => {
    navigate("/affiliate/register");
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = {
    linkedin: (link: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    twitter: (link: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
    whatsapp: (link: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`,
    email: (link: string, text: string) =>
      `mailto:?subject=${encodeURIComponent("Join Engagematic!")}&body=${encodeURIComponent(text + " " + link)}`,
  };

  const referralLink = isAuthenticated && user?.referralCode
    ? `${window.location.origin}/signup?ref=${user.referralCode}`
    : `${window.location.origin}/signup?ref=affiliate`;

  const shareText = "Earn 10% recurring commissions every month when your referrals subscribe to Engagematic! 🚀";

  return (
    <>
      <Helmet>
        <title>Affiliate Program - Earn 10% Recurring Commissions | Engagematic</title>
        <meta
          name="description"
          content="Join Engagematic Affiliate Program. Earn 10% recurring monthly commissions for every subscription. Share with students, creators, and professionals. Transparent tracking, instant payouts."
        />
        <meta
          name="keywords"
          content="affiliate program, LinkedIn tools referral, student affiliate, creator rewards, SaaS commission, referral program, earn money online"
        />
        <meta property="og:title" content="Engagematic Affiliate Program - Earn 10% Monthly" />
        <meta property="og:description" content="Share Engagematic and earn 10% recurring commissions every month. Perfect for students, creators, and LinkedIn professionals." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`${window.location.origin}/affiliate`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-white to-blue-50/50">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
                <Gift className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">
                  Engagematic Affiliate Program
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Earn Rewards for Sharing{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Engagematic!
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
                Invite friends and grow your network. Get paid{" "}
                <span className="font-bold text-purple-600">10% recurring commission</span> every month when they subscribe.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleJoinProgram}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Join Program Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 rounded-full"
                >
                  Learn How It Works
                </Button>
              </div>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-4 gap-6 mt-12"
            >
              <Card className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">10%</div>
                <div className="text-sm text-gray-600">Monthly Commission</div>
              </Card>
              <Card className="p-6 text-center">
                <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">Instant</div>
                <div className="text-sm text-gray-600">Payouts</div>
              </Card>
              <Card className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">Recurring</div>
                <div className="text-sm text-gray-600">Every Month</div>
              </Card>
              <Card className="p-6 text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">∞</div>
                <div className="text-sm text-gray-600">Unlimited Referrals</div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple 4-step process to start earning
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Create Your Link",
                  description: "Get your unique referral link in one click. No approval needed.",
                  icon: Share2,
                },
                {
                  step: "2",
                  title: "Share Everywhere",
                  description: "Share on LinkedIn, WhatsApp, email, campuses, and communities.",
                  icon: MessageSquare,
                },
                {
                  step: "3",
                  title: "Track Signups",
                  description: "Monitor visitors, signups, and earnings in your personal dashboard.",
                  icon: BarChart3,
                },
                {
                  step: "4",
                  title: "Get Paid Monthly",
                  description: "Earn 10% recurring commission every month they stay subscribed. Instant payouts!",
                  icon: DollarSign,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-8 h-full text-center hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <item.icon className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Commission Details */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Trophy className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">
                Earn 10% Every Month, Forever
              </h2>
              <p className="text-xl mb-8 text-purple-100">
                For every friend who subscribes, you earn <strong>10% of their monthly subscription</strong> - 
                recurring every month they stay active. No limits, no caps.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                  <div className="text-3xl font-bold mb-2">₹100</div>
                  <div className="text-sm text-purple-100">Minimum Payout</div>
                </Card>
                <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                  <div className="text-3xl font-bold mb-2">Instant</div>
                  <div className="text-sm text-purple-100">Payout Processing</div>
                </Card>
                <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
                  <div className="text-3xl font-bold mb-2">10%</div>
                  <div className="text-sm text-purple-100">Monthly Commission</div>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Share Buttons */}
        {isAuthenticated && (
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Share Your Link
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-4 py-3 border rounded-lg font-mono text-sm"
                    />
                    <Button
                      onClick={() => handleCopyLink(referralLink)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3">
                    <Button
                      onClick={() => window.open(shareLinks.linkedin(referralLink), "_blank")}
                      variant="outline"
                      className="gap-2"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                    <Button
                      onClick={() => window.open(shareLinks.twitter(referralLink, shareText), "_blank")}
                      variant="outline"
                      className="gap-2"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Button>
                    <Button
                      onClick={() => window.open(shareLinks.whatsapp(referralLink, shareText), "_blank")}
                      variant="outline"
                      className="gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => window.open(shareLinks.email(referralLink, shareText), "_blank")}
                      variant="outline"
                      className="gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  q: "How does it work?",
                  a: "Create your affiliate link, share it with friends. When they sign up and subscribe, you earn 10% of their monthly subscription fee every month they remain active. Commissions are processed automatically.",
                },
                {
                  q: "How are commissions paid?",
                  a: "Commissions are processed monthly. Once you reach the ₹100 minimum threshold, you can request an instant payout via bank transfer, UPI, or wallet. Payouts are processed within 24-48 hours.",
                },
                {
                  q: "Where can I share my link?",
                  a: "Share anywhere! LinkedIn, WhatsApp, email, university campuses, online communities, social media, forums, or direct messages. The more you share, the more you earn.",
                },
                {
                  q: "Is there a limit to how much I can earn?",
                  a: "No limits! Refer unlimited friends. Each active subscription pays you 10% monthly for as long as they stay subscribed. Build passive income.",
                },
                {
                  q: "What happens if someone cancels?",
                  a: "You stop earning commissions for that specific subscription. Any commissions already earned and paid are yours to keep. You can continue earning from other active referrals.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      {faq.q}
                    </h3>
                    <p className="text-gray-600 ml-7">{faq.a}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h2 className="text-4xl font-bold mb-4">
                  Ready to Start Earning?
                </h2>
                <p className="text-xl mb-8 text-purple-100">
                  Join thousands of affiliates earning recurring commissions with Engagematic
                </p>
                <Button
                  onClick={handleJoinProgram}
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full"
                >
                  Join Program Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

