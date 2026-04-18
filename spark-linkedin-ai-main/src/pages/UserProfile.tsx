import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  User,
  Mail,
  Building,
  Lock,
  Bell,
  CreditCard,
  Crown,
  Download,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Globe,
  Bookmark,
  FileText,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "../services/api";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface Payment {
  _id: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  plan: string;
  billingPeriod: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  captured: boolean;
  capturedAt?: string;
  metadata?: {
    credits?: any;
    planType?: string;
  };
  createdAt: string;
}

export const UserProfile = () => {
  const { user, setUser } = useAuth();
  const { subscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState("profile");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [selectedTrainingPosts, setSelectedTrainingPosts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTraining, setIsSavingTraining] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    jobTitle: user?.profile?.jobTitle || "",
    company: user?.profile?.company || "",
    bio: user?.profile?.bio || "",
    linkedinUrl: user?.linkedinUrl || "",
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Email preferences state
  const [emailPrefs, setEmailPrefs] = useState({
    product: true,
    marketing: true,
    updates: true,
  });

  // AI Voice & Style state
  const [aiVoiceData, setAiVoiceData] = useState({
    description: "",
    tone: "neutral",
    boldness: "balanced",
    emojiPreference: "sometimes",
  });
  const [isSavingAiVoice, setIsSavingAiVoice] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [postIdeaInput, setPostIdeaInput] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
    fetchSavedPosts();
    
    // Check if saved parameter is in URL
    if (searchParams.get("saved") === "true") {
      setActiveTab("saved");
    }
  }, [searchParams]);

  useEffect(() => {
    const av = user?.profile?.aiVoice;
    if (av) {
      setAiVoiceData({
        description: av.description || "",
        tone: av.tone || "neutral",
        boldness: av.boldness || "balanced",
        emojiPreference: av.emojiPreference || "sometimes",
      });
    }
  }, [user?.profile?.aiVoice]);

  const fetchPaymentHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.getPaymentHistory();
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await api.getSavedContent();
      if (response.success) {
        const posts = response.data.content || [];
        setSavedPosts(posts);
        
        // Load user's current training post selections (premium feature)
        if (user?.persona?.trainingPostIds) {
          setSelectedTrainingPosts(user.persona.trainingPostIds.map((id: any) => id.toString()));
        }
      }
    } catch (error) {
      console.error("Error fetching saved posts:", error);
    }
  };

  const handleTrainingPostToggle = (postId: string) => {
    setSelectedTrainingPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSaveTrainingPosts = async () => {
    if (subscription?.plan === 'trial') {
      toast({
        title: "Premium Feature",
        description: "This feature is available in our premium plans. Upgrade to continue.",
        variant: "destructive",
      });
      navigate('/#pricing');
      return;
    }

    setIsSavingTraining(true);
    try {
      const response = await api.updateProfile({
        persona: {
          trainingPostIds: selectedTrainingPosts,
        }
      });

      if (response.success) {
        toast({
          title: "Training posts saved",
          description: "Your AI will now learn from these posts to match your writing style.",
        });
        // Refresh user data
        if (setUser && response.data?.user) {
          setUser(response.data.user);
        }
      } else {
        throw new Error(response.message || "Failed to save");
      }
    } catch (error: any) {
      console.error("Error saving training posts:", error);
      toast({
        title: "Failed to save",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTraining(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await api.request("/profile/update", {
        method: "PUT",
        body: JSON.stringify({
          name: profileData.name,
          profile: {
            jobTitle: profileData.jobTitle,
            company: profileData.company,
            bio: profileData.bio,
          },
          linkedinUrl: profileData.linkedinUrl,
        }),
      });

      if (response.success) {
        toast({
          title: "Profile updated! ✅",
          description: "Your profile has been updated successfully",
        });
        setUser(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAiVoice = async () => {
    setIsSavingAiVoice(true);
    try {
      const response = await api.request("/profile/update", {
        method: "PUT",
        body: JSON.stringify({
          profile: {
            aiVoice: {
              description: aiVoiceData.description.trim().slice(0, 6000),
              tone: aiVoiceData.tone,
              boldness: aiVoiceData.boldness,
              emojiPreference: aiVoiceData.emojiPreference,
            },
          },
        }),
      });
      if (response.success && response.data && setUser) {
        setUser(response.data);
      }
      toast({
        title: "AI Style saved",
        description: "Your content style has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Could not save AI Style settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAiVoice(false);
    }
  };

  const handlePreviewVoice = async () => {
    const idea = postIdeaInput.trim().slice(0, 300);
    if (!idea) {
      toast({
        title: "Enter a post idea",
        description: "Type a short topic or idea to generate a preview.",
        variant: "destructive",
      });
      return;
    }
    setPreviewLoading(true);
    setPreviewContent("");
    try {
      const response = await api.previewVoice(idea);
      if (response?.success && response?.data?.content) {
        setPreviewContent(response.data.content);
      } else {
        throw new Error(response?.message || "No content returned");
      }
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error?.message || "Could not generate preview.",
        variant: "destructive",
      });
      setPreviewContent("");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.request("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.success) {
        toast({
          title: "Password changed! ✅",
          description: "Your password has been updated successfully",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailPrefsUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await api.request("/profile/email-preferences", {
        method: "PUT",
        body: JSON.stringify(emailPrefs),
      });

      if (response.success) {
        toast({
          title: "Preferences saved! ✅",
          description: "Your email preferences have been updated",
        });
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: "Failed to update email preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.request("/profile/export-data", {
        method: "GET",
      });

      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `linkedinpulse-data-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Data exported! ✅",
          description: "Your data has been downloaded",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Invalid confirmation",
        description: 'Please type "DELETE" to confirm',
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.request("/profile/delete-account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (response.success) {
        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted",
        });
        window.location.href = "/";
      }
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteConfirmation("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "captured":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
      case "authorized":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Account Settings
            </span>
          </h1>
          <p className="text-muted-foreground">
            Manage your profile, preferences, and account
          </p>
        </div>

        {/* Profile Overview Card */}
        <Card className="p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl font-bold">
                {getInitials(user?.name || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user?.profile?.jobTitle && (
                  <Badge variant="outline">
                    <Building className="h-3 w-3 mr-1" />
                    {user.profile.jobTitle}
                  </Badge>
                )}
                {user?.profile?.company && (
                  <Badge variant="outline">
                    {user.profile.company}
                  </Badge>
                )}
              </div>
            </div>
            <Badge 
              className={`px-4 py-2 ${
                subscription?.plan === 'pro' 
                  ? 'bg-purple-600 text-white' 
                  : subscription?.plan === 'starter'
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <Crown className="h-4 w-4 mr-2" />
              {subscription?.plan === 'pro' ? 'Pro User' : subscription?.plan === 'starter' ? 'Starter User' : 'Trial User'}
            </Badge>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-1">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Globe className="h-4 w-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="aivoice">
              <FileText className="h-4 w-4 mr-2" />
              AI Style
            </TabsTrigger>
            {subscription && subscription.plan !== 'trial' && (
              <TabsTrigger value="personalization">
                <Crown className="h-4 w-4 mr-2" />
                Personalization
              </TabsTrigger>
            )}
            <TabsTrigger value="danger">
              <Trash2 className="h-4 w-4 mr-2" />
              Danger
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                    placeholder="e.g. Marketing Manager"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    placeholder="Your company name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={profileData.linkedinUrl}
                    onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
                
                <div>
  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </div>
              
              <Button onClick={handleProfileUpdate} disabled={isSaving} className="mt-6">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </Card>
          </TabsContent>

          {/* AI Style Tab */}
          <TabsContent value="aivoice" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI Style
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This is how Engagematic will write for you.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                This affects LinkedIn posts, comments, and other AI-generated content.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="aiVoiceDesc">Describe your style (company context, audience, tone - up to ~1000 words)</Label>
                  <Textarea
                    id="aiVoiceDesc"
                    placeholder="Example: Direct, no fluff, slightly humorous, no emojis. I write for B2B SaaS founders and prefer practical, step-by-step posts. Our company does X; our audience is Y. Use this context for all generated content."
                    value={aiVoiceData.description}
                    onChange={(e) => setAiVoiceData((p) => ({ ...p, description: e.target.value.slice(0, 6000) }))}
                    className="mt-1.5 min-h-[120px] resize-y"
                    maxLength={6000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{aiVoiceData.description.length}/6000 (~{Math.round(aiVoiceData.description.length / 5)} words)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Tone</Label>
                    <select
                      value={aiVoiceData.tone}
                      onChange={(e) => setAiVoiceData((p) => ({ ...p, tone: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1.5"
                    >
                      <option value="formal">Formal</option>
                      <option value="neutral">Neutral</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Boldness</Label>
                    <select
                      value={aiVoiceData.boldness}
                      onChange={(e) => setAiVoiceData((p) => ({ ...p, boldness: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1.5"
                    >
                      <option value="safe">Safe</option>
                      <option value="balanced">Balanced</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Emojis</Label>
                    <select
                      value={aiVoiceData.emojiPreference}
                      onChange={(e) => setAiVoiceData((p) => ({ ...p, emojiPreference: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm mt-1.5"
                    >
                      <option value="never">Never</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="often">Often</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPostIdeaInput("");
                      setPreviewContent("");
                      setPreviewOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Preview voice
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveAiVoice}
                    disabled={isSavingAiVoice}
                    className="gap-2"
                  >
                    {isSavingAiVoice ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <Button onClick={handlePasswordChange} disabled={isSaving} className="mt-6">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Preferences
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Product Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about Engagematic features and improvements
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.product}
                    onCheckedChange={(checked) => setEmailPrefs({ ...emailPrefs, product: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Tips, best practices, and promotional content
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.marketing}
                    onCheckedChange={(checked) => setEmailPrefs({ ...emailPrefs, marketing: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Company Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      News and announcements from Engagematic
                    </p>
                  </div>
                  <Switch
                    checked={emailPrefs.updates}
                    onCheckedChange={(checked) => setEmailPrefs({ ...emailPrefs, updates: checked })}
                  />
                </div>
              </div>
              
              <Button onClick={handleEmailPrefsUpdate} disabled={isSaving} className="mt-6">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No payments yet</p>
                  <p className="text-muted-foreground mb-4">
                    Your payment history will appear here
                  </p>
                  <Button onClick={() => window.location.href = "/#pricing"}>
                    Upgrade Now
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Plan</th>
                        <th className="text-left p-3 font-semibold">Period</th>
                        <th className="text-left p-3 font-semibold">Amount</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Order ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div>{format(new Date(payment.createdAt), "MMM dd, yyyy")}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(payment.createdAt), "hh:mm a")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-medium capitalize">{payment.plan}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">
                              {payment.billingPeriod}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-primary text-lg">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="p-3">
                            <div className="text-xs text-muted-foreground font-mono">
                              {payment.orderId}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  Saved Posts
                </h3>
                {savedPosts.length > 0 && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'}
                  </Badge>
                )}
              </div>
              
              {savedPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl"></div>
                    <Bookmark className="relative h-20 w-20 mx-auto text-primary/30" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2 text-foreground">No saved posts yet</h4>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Posts and comments you save will appear here for easy access
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/dashboard"}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPosts.map((post) => {
                    // Truncate content to first 150 characters for preview
                    const truncatedContent = post.content && post.content.length > 150 
                      ? post.content.substring(0, 150) + '...' 
                      : post.content;
                    
                    return (
                      <Card
                        key={post._id}
                        className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 overflow-hidden"
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        <div className="p-5">
                          {/* Header with badge */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge 
                              variant={post.type === 'post' ? 'default' : 'secondary'}
                              className="capitalize font-medium"
                            >
                              {post.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                          
                          {/* Topic */}
                          {post.topic && (
                            <div className="mb-3">
                              <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {post.topic}
                              </h4>
                            </div>
                          )}
                          
                          {/* Content Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {truncatedContent}
                          </p>
                          
                          {/* Footer with bookmark icon */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Bookmark className="h-3.5 w-3.5" />
                              <span>Saved</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement unsave functionality
                              }}
                            >
                              Unsave
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Referral Program
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Your Referral Link
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${window.location.origin}/auth/register?ref=${user?._id}`}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/auth/register?ref=${user?._id}`
                        );
                        toast({
                          title: "Copied!",
                          description: "Referral link copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Total Referrals</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">Rewards Earned</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Personalization Tab - Premium Feature */}
          {subscription && subscription.plan !== 'trial' && (
            <TabsContent value="personalization" className="space-y-6">
              <Card className="p-6 shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Your Unique Voice, Powered by AI</h3>
                        <p className="text-sm text-gray-600 mt-1">Train your AI to write exactly like you</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 max-w-2xl">
                      Select posts from your saved content that represent your best writing style. Our AI will learn from these examples to match your unique voice, tone, and structure in future generations.
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1">
                    Premium
                  </Badge>
                </div>

                {savedPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-semibold mb-2 text-gray-900">No Saved Posts Yet</h4>
                    <p className="text-sm text-gray-600 mb-2 max-w-md mx-auto">
                      Save posts you create to train your AI with your writing style.
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      💡 Tip: Generate and save posts that represent your best work, then come back here to select them for training.
                    </p>
                    <Button onClick={() => navigate('/post-generator')}>
                      Create Your First Post
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>📝 Note:</strong> Only posts you've saved are shown here. If you generated posts but didn't save them, they won't appear. Save your best posts to train your AI!
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {savedPosts.map((post) => {
                        const isSelected = selectedTrainingPosts.includes(post._id);
                        const truncatedContent = post.content?.length > 200
                          ? post.content.substring(0, 200) + '...'
                          : post.content;

                        return (
                          <Card
                            key={post._id}
                            className={`p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-md'
                                : 'border hover:border-purple-300 hover:shadow-sm'
                            }`}
                            onClick={() => handleTrainingPostToggle(post._id)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTrainingPostToggle(post._id)}
                                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                                      {truncatedContent}
                                    </p>
                                    {post.topic && (
                                      <Badge variant="outline" className="text-xs">
                                        {post.topic}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {selectedTrainingPosts.length} of {savedPosts.length} posts selected
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Select at least 3-5 posts for best results
                        </p>
                      </div>
                      <Button
                        onClick={handleSaveTrainingPosts}
                        disabled={isSavingTraining || selectedTrainingPosts.length === 0}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {isSavingTraining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Training Posts
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>
          )}

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="p-6 shadow-lg border-red-200">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Download Your Data</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export all your data including profile, personas, payments, and content.
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-red-600 mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Account Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                This will permanently delete your account and all data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder='Type "DELETE" to confirm'
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE"}
              >
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Style Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Preview your style</DialogTitle>
              <DialogDescription>
                Enter a short post idea. We&apos;ll generate a sample using your saved AI Style settings. Save changes first if you just updated them.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="previewIdea">Post idea</Label>
                <Input
                  id="previewIdea"
                  placeholder="e.g. Why I switched to remote work"
                  value={postIdeaInput}
                  onChange={(e) => setPostIdeaInput(e.target.value.slice(0, 300))}
                  className="mt-1.5"
                />
              </div>
              <Button
                type="button"
                onClick={handlePreviewVoice}
                disabled={previewLoading || !postIdeaInput.trim()}
                className="w-full gap-2"
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate preview
                  </>
                )}
              </Button>
              {previewContent && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Sample post</p>
                  <p className="text-sm whitespace-pre-wrap">{previewContent}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserProfile;
