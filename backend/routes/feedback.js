import express from "express";
import Feedback from "../models/Feedback.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Submit or update feedback
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetId, targetType, feedback, reasons, context } = req.body;

    if (!targetId || !targetType || !feedback) {
      return res.status(400).json({
        success: false,
        message: "targetId, targetType, and feedback are required",
      });
    }

    // Upsert feedback
    const updatedFeedback = await Feedback.findOneAndUpdate(
      { userId, targetId },
      {
        targetType,
        feedback,
        reasons: reasons || [],
        context: context || {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: updatedFeedback,
      message: "Feedback saved successfully",
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ success: false, message: "Failed to save feedback" });
  }
});

// Get feedback for a specific target
router.get("/:targetId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetId } = req.params;

    const feedback = await Feedback.findOne({ userId, targetId }).lean();
    
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch feedback" });
  }
});

export default router;
