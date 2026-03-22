import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import apiClient from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface FeedbackRowProps {
  targetId: string;
  targetType: "idea" | "post";
  source?: string;
  className?: string;
}

const REASONS = [
  "Too generic",
  "Not my tone",
  "Not relevant",
  "Too long / Too short",
];

export const FeedbackRow = ({ targetId, targetType, source, className }: FeedbackRowProps) => {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [showReasons, setShowReasons] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await apiClient.getFeedback(targetId);
        if (response.success && response.data) {
          setFeedback(response.data.feedback);
          setSelectedReasons(response.data.reasons || []);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };

    fetchFeedback();
  }, [targetId]);

  const handleFeedback = async (type: "like" | "dislike") => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    
    if (newFeedback === "dislike") {
      setShowReasons(true);
    } else {
      setShowReasons(false);
      setSelectedReasons([]);
    }

    try {
      await apiClient.submitFeedback({
        targetId,
        targetType,
        feedback: newFeedback,
        reasons: newFeedback === "dislike" ? selectedReasons : [],
        context: { source },
      });

      if (newFeedback) {
        toast({
          title: newFeedback === "like" ? "Glad you liked it! ✨" : "Thanks for the feedback",
          description: newFeedback === "like" ? "We'll use this to improve future generations." : "Tell us more so we can do better.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const toggleReason = async (reason: string) => {
    const newReasons = selectedReasons.includes(reason)
      ? selectedReasons.filter((r) => r !== reason)
      : [...selectedReasons, reason];
    
    setSelectedReasons(newReasons);

    try {
      await apiClient.submitFeedback({
        targetId,
        targetType,
        feedback: "dislike",
        reasons: newReasons,
        context: { source },
      });
    } catch (error) {
      console.error("Error updating feedback reasons:", error);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleFeedback("like")}
          className={cn(
            "gap-1.5 h-7 px-2 text-[10px] font-medium transition-all",
            feedback === "like" 
              ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ThumbsUp className={cn("h-3 w-3", feedback === "like" && "fill-current")} />
          Useful
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleFeedback("dislike")}
          className={cn(
            "gap-1.5 h-7 px-2 text-[10px] font-medium transition-all",
            feedback === "dislike" 
              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ThumbsDown className={cn("h-3 w-3", feedback === "dislike" && "fill-current")} />
          Not useful
        </Button>
      </div>

      {showReasons && feedback === "dislike" && (
        <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {REASONS.map((reason) => (
            <Badge
              key={reason}
              variant={selectedReasons.includes(reason) ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-[9px] px-1.5 py-0 h-5 font-normal transition-all",
                selectedReasons.includes(reason)
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "hover:border-primary/50 hover:bg-primary/5 bg-background text-muted-foreground"
              )}
              onClick={() => toggleReason(reason)}
            >
              {reason}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-muted"
            onClick={() => setShowReasons(false)}
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
