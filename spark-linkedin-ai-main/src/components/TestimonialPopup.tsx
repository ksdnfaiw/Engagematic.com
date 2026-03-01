import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, X, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/api";

interface TestimonialPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType?: "post" | "comment" | "idea";
}

export const TestimonialPopup = ({ 
  open, 
  onOpenChange, 
  contentType = "post" 
}: TestimonialPopupProps) => {
  const [testimonial, setTestimonial] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const contentTypeMessages = {
    post: {
      title: "How was your experience?",
      description: "We'd love to hear your feedback on generating your LinkedIn post.",
      placeholder: "Share your thoughts...",
    },
    comment: {
      title: "How was your experience?",
      description: "We'd love to hear your feedback on generating comments.",
      placeholder: "Share your thoughts...",
    },
    idea: {
      title: "How was your experience?",
      description: "We'd love to hear your feedback on generating ideas.",
      placeholder: "Share your thoughts...",
    },
  };

  const message = contentTypeMessages[contentType];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please rate us",
        description: "Select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!testimonial.trim()) {
      toast({
        title: "Feedback required",
        description: "Please share your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiClient.submitTestimonial({
        comment: testimonial.trim(),
        rating,
        triggeredBy: contentType,
      });

      if (result.success) {
        toast({
          title: result.alreadySubmitted ? "Thank you! 🙏" : "Thank you! 🙏",
          description: result.alreadySubmitted
            ? "You've already submitted your feedback. We appreciate it!"
            : "Your feedback has been submitted successfully.",
        });
        // Mark this content type and global so popup won't show again
        localStorage.setItem(`testimonial_submitted_${contentType}`, "true");
        localStorage.setItem("testimonialSubmitted", "true");
        onOpenChange(false);
        setTestimonial("");
        setRating(0);
      } else {
        throw new Error(result.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Testimonial submission error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Could not submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Store in localStorage to prevent showing again
    localStorage.setItem(`testimonial_submitted_${contentType}`, "true");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {message.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Star Rating */}
          <div>
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Rating
            </Label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-colors"
                  disabled={isSubmitting}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial Input */}
          <div>
            <Label htmlFor="testimonial" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Feedback
            </Label>
            <Textarea
              id="testimonial"
              placeholder={message.placeholder}
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-sm"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !testimonial.trim()}
            className="text-sm bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Submitting
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
