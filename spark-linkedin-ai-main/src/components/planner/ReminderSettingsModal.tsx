import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, Calendar, Clock, Loader2 } from "lucide-react";
import apiClient from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderSettingsModal = ({ isOpen, onClose }: ReminderSettingsModalProps) => {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("09:00");
  const [frequency, setFrequency] = useState("daily");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getEmailPreferences();
      if (response.success && response.data.preferences?.plannerReminders) {
        const reminders = response.data.preferences.plannerReminders;
        setEnabled(reminders.enabled || false);
        setTime(reminders.time || "09:00");
        setFrequency(reminders.frequency || "daily");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await apiClient.updateEmailPreferences({
        preferences: {
          plannerReminders: {
            enabled,
            time,
            frequency
          }
        }
      });

      if (response.success) {
        toast({
          title: "Settings saved! 📅",
          description: enabled 
            ? `We'll remind you ${frequency} at ${time} UTC.` 
            : "Reminders have been disabled.",
        });
        onClose();
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Email Reminders
          </DialogTitle>
          <DialogDescription>
            Choose when you want to be reminded about your content schedule.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="reminders-enabled" className="flex flex-col gap-1">
                <span className="text-base font-semibold">Enable Reminders</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Get notified when it's time to post
                </span>
              </Label>
              <Switch
                id="reminders-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {enabled && (
              <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Time Selection */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Reminder Time (UTC)
                  </Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Frequency Selection */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Frequency
                  </Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Every day</SelectItem>
                      <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                      <SelectItem value="weekly">Once a week (Monday)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <p className="text-[10px] text-muted-foreground italic">
                  Note: All times are in UTC. We're working on local timezone support!
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
