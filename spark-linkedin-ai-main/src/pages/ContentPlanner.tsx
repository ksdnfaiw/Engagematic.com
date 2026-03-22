import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, Lock, Plus, Calendar, Target, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ReminderSettingsModal } from "@/components/planner/ReminderSettingsModal";

import { PlannerStep1Goal } from "@/components/planner/PlannerStep1Goal";
import { PlannerStep2Context } from "@/components/planner/PlannerStep2Context";
import { PlannerStep3Config } from "@/components/planner/PlannerStep3Config";
import { PlannerStep4Board } from "@/components/planner/PlannerStep4Board";
import { 
  PlannerContext, 
  PlannerConfig, 
  PlannerBoard, 
  PlannerPost,
  generateBoard 
} from "@/services/plannerService";
import { GoalType } from "@/constants/plannerTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "@/services/api.js";

export const ContentPlanner = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Show loading state while checking auth (with timeout)
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  if (authLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Require sign-in only (Content Planner is free for all authenticated users)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Content Planner</h2>
            <p className="text-muted-foreground">
              Sign in to plan your content, generate ideas, and turn them into posts.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth/login')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  const [showDashboard, setShowDashboard] = useState(true);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [goal, setGoal] = useState<GoalType | 'custom' | ''>('');
  const [customGoal, setCustomGoal] = useState('');
  const [context, setContext] = useState<PlannerContext>({
    audience: '',
    helpWith: '',
    platforms: [],
    promotion: ''
  });
  const [config, setConfig] = useState<PlannerConfig>({
    postsPerWeek: 5,
    spiceLevel: 'balanced',
    contentMix: []
  });
  const [board, setBoard] = useState<PlannerBoard | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);


  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await apiClient.listContentPlans();
      if (res?.success && Array.isArray(res.data)) setSavedPlans(res.data);
    } catch {
      setSavedPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchPlans();
  }, [isAuthenticated, fetchPlans]);

  const handleFinalizePlan = useCallback(async (finalBoard: PlannerBoard) => {
    const res = await apiClient.saveContentPlan({
      title: `Content Plan ${new Date().toLocaleDateString()}`,
      goal: finalBoard.goal,
      context: finalBoard.context,
      config: finalBoard.config,
      posts: finalBoard.posts,
    });
    if (res?.success) {
      await fetchPlans();
    } else {
      throw new Error(res?.message || 'Failed to save plan');
    }
  }, [fetchPlans]);

  const handleCreateNewPlan = () => {
    setShowDashboard(false);
    setViewingPlanId(null);
    setCurrentStep(1);
    setGoal('');
    setCustomGoal('');
    setContext({ audience: '', helpWith: '', platforms: [], promotion: '' });
    setConfig({ postsPerWeek: 5, spiceLevel: 'balanced', contentMix: [] });
    setBoard(null);
  };

  const handleOpenPlan = useCallback((plan: any) => {
    const planBoard: PlannerBoard = {
      goal: plan.goal,
      context: {
        audience: plan.context?.audience || '',
        helpWith: plan.context?.helpWith || '',
        platforms: plan.context?.platforms || [],
        promotion: plan.context?.promotion || '',
      },
      config: {
        postsPerWeek: plan.config?.postsPerWeek ?? 5,
        spiceLevel: plan.config?.spiceLevel || 'balanced',
        contentMix: plan.config?.contentMix || [],
      },
      posts: (plan.posts || []).map((p: any) => ({
        slot: p.slot,
        hook: p.hook || '',
        angle: p.angle || '',
        cta: p.cta || '',
        commentPrompt: p.commentPrompt || '',
        templateId: p.templateId || '',
        edited: p.edited || false,
        notes: p.notes || '',
        column: p.column || 'ideas',
      })),
      generatedAt: plan.generatedAt ? new Date(plan.generatedAt) : new Date(),
    };
    setBoard(planBoard);
    setGoal(plan.goal);
    setContext(planBoard.context);
    setConfig(planBoard.config);
    setViewingPlanId(plan._id);
    setShowDashboard(false);
    setCurrentStep(4);
  }, []);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;
  
  // TEMPORARY DEBUG: Uncomment to test if component renders at all
  // return (
  //   <div style={{ 
  //     padding: '2rem', 
  //     background: 'red', 
  //     color: 'white', 
  //     fontSize: '24px', 
  //     zIndex: 9999,
  //     position: 'fixed',
  //     top: 0,
  //     left: 0,
  //     right: 0,
  //     bottom: 0
  //   }}>
  //     TEST: ContentPlanner Component is Rendering!
  //   </div>
  // );

  const handleGoalSelect = (selectedGoal: GoalType | 'custom') => {
    setGoal(selectedGoal);
    if (selectedGoal !== 'custom') {
      setCustomGoal('');
    }
  };

  const handleContextChange = (field: keyof PlannerContext, value: any) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (field: keyof PlannerConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handlePostEdit = (slot: number, field: keyof PlannerPost, value: string) => {
    if (!board) return;
    const updatedPosts = board.posts.map(post => 
      post.slot === slot ? { ...post, [field]: value, edited: true } : post
    );
    setBoard({ ...board, posts: updatedPosts });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return goal !== '' && (goal !== 'custom' || customGoal.trim() !== '');
      case 2:
        return context.audience.trim() !== '' && 
               context.helpWith.trim() !== '' && 
               context.platforms.length > 0;
      case 3:
        return true; // Config is always valid
      case 4:
        return board !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      // Generate board
      handleGenerateBoard();
    } else if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGenerateBoard = async () => {
    if (!canProceed()) return;
    
    setIsGenerating(true);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const finalGoal = goal === 'custom' ? 'calls' : goal as GoalType;
      const generatedBoard = generateBoard(finalGoal, context, config);
      setBoard(generatedBoard);
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating board:', error);
      alert('Error generating board. Please check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerateBoard();
  };

  if (showDashboard) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-background via-primary/5 to-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Content Planner
            </h1>
            <p className="text-muted-foreground">
              Your saved plans and ideas. Open a plan to edit or generate posts from it.
            </p>
          </div>
          <div className="flex justify-center mb-8 gap-3">
            <Button
              onClick={handleCreateNewPlan}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Plus className="h-4 w-4" />
              Create new plan
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsReminderModalOpen(true)}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              Reminders
            </Button>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedPlans.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No plans yet</p>
              <p className="text-sm mt-1">Create a plan with &quot;Send to Engagematic&quot; to save it here.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {savedPlans.map((plan) => (
                <Card
                  key={plan._id}
                  className="p-4 cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between gap-4"
                  onClick={() => handleOpenPlan(plan)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{plan.title || `Plan ${new Date(plan.updatedAt || plan.createdAt).toLocaleDateString()}`}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {plan.context?.audience || '—'} · {plan.posts?.length || 0} posts
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-background via-primary/5 to-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full min-h-0">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setShowDashboard(true)} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsReminderModalOpen(true)} className="gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient-premium-world-class">
            Hook → Outcome Content Planner
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turn your monthly goal into a clear content plan with hooks, CTAs, and comment prompts that drive DMs and leads—not vanity likes.
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep < 4 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </Card>
        )}

        {/* Step Content */}
        <Card className="p-6 sm:p-8 lg:p-10 min-h-[420px] flex flex-col overflow-visible">
          {currentStep === 1 && (
            <PlannerStep1Goal
              selectedGoal={goal}
              customGoal={customGoal}
              onGoalSelect={handleGoalSelect}
              onCustomGoalChange={setCustomGoal}
              isLoading={isGenerating}
            />
          )}

          {currentStep === 2 && (
            <PlannerStep2Context
              context={context}
              onContextChange={handleContextChange}
              isLoading={isGenerating}
            />
          )}

          {currentStep === 3 && (
            <PlannerStep3Config
              config={config}
              onConfigChange={handleConfigChange}
              isLoading={isGenerating}
            />
          )}

          {currentStep === 4 && board && (
            <PlannerStep4Board
              board={board}
              onPostEdit={handlePostEdit}
              onRegenerate={handleRegenerate}
              onFinalize={handleFinalizePlan}
            />
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your content plan...</p>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        {currentStep < 4 && !isGenerating && (
          <div className="flex justify-between items-center mt-6 gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            >
              {currentStep === 3 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Board
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <ReminderSettingsModal 
        isOpen={isReminderModalOpen} 
        onClose={() => setIsReminderModalOpen(false)} 
      />
    </div>
  );
};


export default ContentPlanner;
