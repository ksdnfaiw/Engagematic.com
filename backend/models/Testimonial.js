import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    // User information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for public testimonials
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Testimonial content
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Display information
    displayName: {
      type: String,
      trim: true,
      default: function () {
        return this.userName;
      },
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },

    // Trigger information
    triggeredBy: {
      type: String,
      enum: [
        "first_post",
        "first_comment",
        "profile_analysis",
        "manual",
        "public_link",
        "admin_created",
        "post",   // from TestimonialPopup contentType
        "comment",
        "idea",
      ],
      required: true,
    },
    actionCount: {
      type: Number,
      default: 1,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Admin metadata
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },

    // Analytics
    displayCount: {
      type: Number,
      default: 0,
    },
    lastDisplayed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
testimonialSchema.index({
  status: 1,
  isFeatured: -1,
  rating: -1,
  createdAt: -1,
});
testimonialSchema.index({ userId: 1, status: 1 });

// Virtual for formatted date
testimonialSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Static method to get approved testimonials for display
testimonialSchema.statics.getForDisplay = async function (limit = 6) {
  return this.find({ status: "approved" })
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
    .limit(limit)
    .select("displayName jobTitle company rating comment createdAt")
    .lean();
};

// Static method to get featured testimonials
testimonialSchema.statics.getFeatured = async function (limit = 3) {
  return this.find({ status: "approved", isFeatured: true })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit)
    .select("displayName jobTitle company rating comment createdAt")
    .lean();
};

// Method to approve testimonial
testimonialSchema.methods.approve = function (adminId, notes = "") {
  this.status = "approved";
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  return this.save();
};

// Method to reject testimonial
testimonialSchema.methods.reject = function (adminId, notes = "") {
  this.status = "rejected";
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  return this.save();
};

// Method to toggle featured status
testimonialSchema.methods.toggleFeatured = function () {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

// Pre-save hook to ensure display name
testimonialSchema.pre("save", function (next) {
  if (!this.displayName && this.userName) {
    this.displayName = this.userName;
  }
  next();
});

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
