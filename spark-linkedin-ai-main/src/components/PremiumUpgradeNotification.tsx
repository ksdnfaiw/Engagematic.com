import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PremiumUpgradeNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  featureName?: string;
}

export const PremiumUpgradeNotification = ({
  isVisible,
  onClose,
  title = "Unlock Premium Potential! 🚀",
  description = "This feature is part of our Pro plan. Elevate your LinkedIn game today.",
  featureName
}: PremiumUpgradeNotificationProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/plan-management");
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
          className="fixed bottom-6 right-6 z-[100] w-80 sm:w-96"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 dark:bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl">
            {/* Animated background gradient */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-1 pr-4">
                <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                  {featureName ? `Unlock ${featureName} ✨` : title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/20"
              >
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Not now
              </Button>
            </div>

            {/* Subtle sparkle decoration */}
            <Sparkles className="absolute -bottom-2 -left-2 h-8 w-8 text-yellow-400/20" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
