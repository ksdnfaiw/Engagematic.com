import { body, param, query, validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error(
      "❌ Validation failed:",
      JSON.stringify(errors.array(), null, 2)
    );
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
      details: errors
        .array()
        .map((err) => `${err.path}: ${err.msg}`)
        .join(", "),
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validateRequest,
];

export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

// Content generation validation rules
export const validatePostGeneration = [
  body("topic")
    .trim()
    .notEmpty()
    .withMessage("Topic is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Topic must be between 10 and 1000 characters"),
  body("hookId")
    .notEmpty()
    .withMessage("Hook ID is required")
    .custom((value) => {
      if (!value) return false;
      
      // Convert to string for validation
      const hookIdStr = String(value).trim();
      
      // Accept both MongoDB ObjectIds and trending hook IDs
      const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
      const trendingHookPattern = /^trending_\d+(_\d+)?$/; // More flexible: trending_123 or trending_123_456
      
      const isValid = mongoIdPattern.test(hookIdStr) || trendingHookPattern.test(hookIdStr);
      
      if (!isValid) {
        console.error("Invalid hook ID format:", hookIdStr, "Type:", typeof value);
      }
      
      return isValid;
    })
    .withMessage("Invalid hook ID format. Must be a valid MongoDB ObjectId or trending hook ID."),
  // personaId is now optional (can send persona data directly)
  // Skip validation entirely if personaId is not provided
  body("personaId")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Only validate if value exists and is not empty
      if (value && value !== "") {
        return /^[0-9a-fA-F]{24}$/.test(value);
      }
      return true;
    })
    .withMessage("Invalid persona ID format"),
  body("persona")
    .optional()
    .isObject()
    .withMessage("Persona data must be an object"),
  validateRequest,
];

// Validation for post generation without hooks (pro users)
export const validatePostGenerationWithoutHook = [
  body("topic")
    .trim()
    .notEmpty()
    .withMessage("Topic is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Topic must be between 10 and 1000 characters"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["story", "question", "statement", "challenge", "insight"])
    .withMessage("Invalid category"),
  // personaId is now optional (can send persona data directly)
  // Skip validation entirely if personaId is not provided
  body("personaId")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Only validate if value exists and is not empty
      if (value && value !== "") {
        return /^[0-9a-fA-F]{24}$/.test(value);
      }
      return true;
    })
    .withMessage("Invalid persona ID format"),
  body("persona")
    .optional()
    .isObject()
    .withMessage("Persona data must be an object"),
  validateRequest,
];

export const validateCommentGeneration = [
  body("postContent")
    .trim()
    // Allow longer LinkedIn posts but cap at a safe upper bound.
    .isLength({ min: 10, max: 4000 })
    .withMessage("Post content must be between 10 and 4000 characters"),
  // personaId is now optional (can send persona data directly)
  // Skip validation entirely if personaId is not provided
  body("personaId")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Only validate if value exists and is not empty
      if (value && value !== "") {
        return /^[0-9a-fA-F]{24}$/.test(value);
      }
      return true;
    })
    .withMessage("Invalid persona ID format"),
  body("persona")
    .optional()
    .isObject()
    .withMessage("Persona data must be an object"),
  validateRequest,
];

// Persona validation rules
export const validatePersonaCreation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Persona name must be between 2 and 50 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("tone")
    .isIn(["professional", "casual", "authentic", "authoritative", "friendly"])
    .withMessage("Invalid tone selection"),
  body("industry")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Industry must be between 2 and 100 characters"),
  body("experience")
    .isIn(["entry", "mid", "senior", "executive", "entrepreneur"])
    .withMessage("Invalid experience level"),
  body("writingStyle")
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Writing style must be between 10 and 300 characters"),
  validateRequest,
];

// MongoDB ObjectId validation
export const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  validateRequest,
];

// Pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  validateRequest,
];
