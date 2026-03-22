import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["idea", "post"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous feedback if needed, but usually logged in
    },
    feedback: {
      type: String,
      required: true,
      enum: ["like", "dislike"],
    },
    reasons: {
      type: [String],
      default: [],
    },
    context: {
      source: { type: String }, // e.g., 'idea_generator', 'post_generator'
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup of user feedback on a specific target
feedbackSchema.index({ userId: 1, targetId: 1 }, { unique: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
