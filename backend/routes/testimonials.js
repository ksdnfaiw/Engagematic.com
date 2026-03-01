import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { adminAuth } from "../middleware/adminAuth.js";
import Testimonial from "../models/Testimonial.js";
import User from "../models/User.js";
import Content from "../models/Content.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// Submit testimonial via public link (no authentication required)
router.post("/collect", async (req, res) => {
  try {
    const {
      name,
      email,
      rating,
      comment,
      jobTitle,
      company,
      displayName,
      source = "public_link",
    } = req.body;

    // Validation
    if (!name || !email || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Name, email, rating, and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must be between 10 and 1000 characters",
      });
    }

    // Check if email already submitted a testimonial
    const existingTestimonial = await Testimonial.findOne({
      userEmail: email.toLowerCase(),
    });

    if (existingTestimonial) {
      return res.status(400).json({
        success: false,
        message: "A testimonial from this email already exists. Thank you!",
      });
    }

    // Create testimonial
    const testimonial = new Testimonial({
      userName: name.trim(),
      userEmail: email.toLowerCase().trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
      displayName: displayName?.trim() || name.trim(),
      jobTitle: jobTitle?.trim() || "",
      company: company?.trim() || "",
      triggeredBy: source,
      actionCount: 0,
      status: "pending",
    });

    await testimonial.save();

    console.log(
      `✅ Public testimonial collected from ${email} (Rating: ${rating}/5)`
    );

    res.json({
      success: true,
      message:
        "Thank you for your testimonial! We'll review it and may feature it on our website.",
      data: {
        id: testimonial._id,
        rating: testimonial.rating,
        status: testimonial.status,
      },
    });
  } catch (error) {
    console.error("Error collecting public testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit testimonial. Please try again.",
    });
  }
});

// Get approved testimonials for public display
router.get("/public", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const featured = req.query.featured === "true";

    let testimonials;
    if (featured) {
      testimonials = await Testimonial.getFeatured(limit);
    } else {
      testimonials = await Testimonial.getForDisplay(limit);
    }

    res.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching public testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials",
    });
  }
});

// ==========================================
// USER ROUTES (Authentication required)
// ==========================================

// Submit a testimonial
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const { rating, comment, displayName, jobTitle, company, triggeredBy } =
      req.body;

    // Validation
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must be between 10 and 1000 characters",
      });
    }

    // Check if user has already submitted a testimonial (one per user)
    const existingTestimonial = await Testimonial.findOne({
      userId: req.user._id,
    });

    if (existingTestimonial) {
      return res.json({
        success: true,
        alreadySubmitted: true,
        message: "You have already submitted a testimonial. Thank you!",
        data: {
          id: existingTestimonial._id,
          rating: existingTestimonial.rating,
          status: existingTestimonial.status,
        },
      });
    }

    // Get user action count
    const postsCount = await Content.countDocuments({
      userId: req.user._id,
      type: "post",
    });

    const commentsCount = await Content.countDocuments({
      userId: req.user._id,
      type: "comment",
    });

    const actionCount = postsCount + commentsCount;

    // Normalize triggeredBy from popup (post/comment/idea) to schema values
    const normalizedTriggeredBy =
      triggeredBy === "post"
        ? "first_post"
        : triggeredBy === "comment"
          ? "first_comment"
          : triggeredBy === "idea"
            ? "manual"
            : triggeredBy || "manual";

    // Create testimonial
    const testimonial = new Testimonial({
      userId: req.user._id,
      userName: req.user.name || req.user.email.split("@")[0],
      userEmail: req.user.email,
      rating,
      comment: comment.trim(),
      displayName:
        displayName?.trim() || req.user.name || req.user.email.split("@")[0],
      jobTitle: jobTitle?.trim() || req.user.profile?.jobTitle || "",
      company: company?.trim() || req.user.profile?.company || "",
      triggeredBy: normalizedTriggeredBy,
      actionCount,
      status: "pending",
    });

    await testimonial.save();

    console.log(
      `✅ New testimonial submitted by ${req.user.email} (Rating: ${rating}/5)`
    );

    res.json({
      success: true,
      message: "Thank you for your feedback! Your testimonial is under review.",
      data: {
        id: testimonial._id,
        rating: testimonial.rating,
        status: testimonial.status,
      },
    });
  } catch (error) {
    console.error("Error submitting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit testimonial",
    });
  }
});

// Check if user can submit testimonial
router.get("/check-eligibility", authenticateToken, async (req, res) => {
  try {
    // Check if already submitted
    const existingTestimonial = await Testimonial.findOne({
      userId: req.user._id,
    });

    if (existingTestimonial) {
      return res.json({
        success: true,
        eligible: false,
        reason: "already_submitted",
        testimonial: {
          rating: existingTestimonial.rating,
          status: existingTestimonial.status,
        },
      });
    }

    // Check action count
    const postsCount = await Content.countDocuments({
      userId: req.user._id,
      type: "post",
    });

    const commentsCount = await Content.countDocuments({
      userId: req.user._id,
      type: "comment",
    });

    const actionCount = postsCount + commentsCount;

    // Eligible if completed at least 3 actions
    const eligible = actionCount >= 3;

    res.json({
      success: true,
      eligible,
      actionCount,
      requiredActions: 3,
      reason: eligible ? "eligible" : "insufficient_actions",
    });
  } catch (error) {
    console.error("Error checking testimonial eligibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check eligibility",
    });
  }
});

// ==========================================
// ADMIN ROUTES (Admin authentication required)
// ==========================================

// Get all testimonials for admin
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const status = req.query.status; // 'pending', 'approved', 'rejected'
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = status ? { status } : {};

    const testimonials = await Testimonial.find(query)
      .populate("userId", "email name")
      .populate("reviewedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Testimonial.countDocuments(query);

    res.json({
      success: true,
      data: testimonials,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: testimonials.length,
        totalTestimonials: total,
      },
    });
  } catch (error) {
    console.error("Error fetching admin testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials",
    });
  }
});

// Approve testimonial
router.patch("/admin/:id/approve", adminAuth, async (req, res) => {
  try {
    const { notes } = req.body;

    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    await testimonial.approve(req.admin.adminId, notes);

    console.log(
      `✅ Testimonial ${testimonial._id} approved by admin ${req.admin.username}`
    );

    res.json({
      success: true,
      message: "Testimonial approved successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve testimonial",
    });
  }
});

// Reject testimonial
router.patch("/admin/:id/reject", adminAuth, async (req, res) => {
  try {
    const { notes } = req.body;

    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    await testimonial.reject(req.admin.adminId, notes);

    console.log(
      `❌ Testimonial ${testimonial._id} rejected by admin ${req.admin.username}`
    );

    res.json({
      success: true,
      message: "Testimonial rejected successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error rejecting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject testimonial",
    });
  }
});

// Toggle featured status
router.patch("/admin/:id/toggle-featured", adminAuth, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    if (testimonial.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved testimonials can be featured",
      });
    }

    await testimonial.toggleFeatured();

    console.log(
      `⭐ Testimonial ${testimonial._id} featured status: ${testimonial.isFeatured}`
    );

    res.json({
      success: true,
      message: `Testimonial ${
        testimonial.isFeatured ? "featured" : "unfeatured"
      } successfully`,
      data: testimonial,
    });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle featured status",
    });
  }
});

// Delete testimonial
router.delete("/admin/:id", adminAuth, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    console.log(
      `🗑️ Testimonial ${testimonial._id} deleted by admin ${req.admin.username}`
    );

    res.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete testimonial",
    });
  }
});

// Get testimonial statistics
router.get("/admin/stats", adminAuth, async (req, res) => {
  try {
    const total = await Testimonial.countDocuments();
    const pending = await Testimonial.countDocuments({ status: "pending" });
    const approved = await Testimonial.countDocuments({ status: "approved" });
    const rejected = await Testimonial.countDocuments({ status: "rejected" });
    const featured = await Testimonial.countDocuments({ isFeatured: true });

    // Average rating
    const avgRatingResult = await Testimonial.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    const avgRating =
      avgRatingResult.length > 0 ? avgRatingResult[0].avgRating.toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        featured,
        avgRating: parseFloat(avgRating),
      },
    });
  } catch (error) {
    console.error("Error fetching testimonial stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

// Create testimonial manually by admin
router.post("/admin/create", adminAuth, async (req, res) => {
  try {
    const {
      displayName,
      userEmail,
      jobTitle,
      company,
      rating,
      comment,
      autoApprove,
      isFeatured,
    } = req.body;

    // Validation
    if (!displayName || !comment) {
      return res.status(400).json({
        success: false,
        message: "Display name and comment are required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment must be between 10 and 1000 characters",
      });
    }

    // Create testimonial
    const testimonial = new Testimonial({
      userName: displayName.trim(),
      userEmail:
        userEmail?.trim() || `admin-created-${Date.now()}@system.local`,
      displayName: displayName.trim(),
      jobTitle: jobTitle?.trim() || "",
      company: company?.trim() || "",
      rating: parseInt(rating),
      comment: comment.trim(),
      status: autoApprove ? "approved" : "pending",
      isFeatured: autoApprove && isFeatured ? true : false,
      triggeredBy: "admin_created",
      actionCount: 0,
      reviewedBy: autoApprove ? req.admin.adminId : null,
      reviewedAt: autoApprove ? new Date() : null,
    });

    await testimonial.save();

    console.log(
      `✅ Testimonial manually created by admin ${req.admin.username} (Rating: ${rating}/5, Status: ${testimonial.status}, Featured: ${testimonial.isFeatured})`
    );

    res.json({
      success: true,
      message: "Testimonial created successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create testimonial",
    });
  }
});

export default router;
