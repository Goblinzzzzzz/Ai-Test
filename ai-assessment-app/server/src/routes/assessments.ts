import { Router } from 'express';
import {
  submitAssessment,
  getCohortStatistics,
  getRecentAssessments,
  getAssessmentDistribution,
  deleteAllAssessments,
} from '../controllers/assessmentController.js';
import { assessmentSubmissionLimiter } from '../middleware/rateLimiter.js';
import { sanitizeInput } from '../middleware/validator.js';

/**
 * Assessment API Routes
 * 
 * Defines all routes for assessment operations:
 * - POST /api/assessments - Submit a new assessment
 * - GET /api/assessments/stats/:cohort - Get cohort statistics
 * - GET /api/assessments/recent/:cohort - Get recent assessments
 * - GET /api/assessments/distribution/:cohort - Get assessment distribution
 * - DELETE /api/assessments/:cohort - Delete all assessments for a cohort
 * 
 * Requirements:
 * - 2.1: Assessment submission endpoint
 * - 3.1: Statistics retrieval endpoint
 * - 4.1: Recent assessments endpoint
 * - 5.1: Distribution data endpoint
 * - 6.1: Delete all assessments endpoint
 */

const router = Router();

/**
 * POST /api/assessments
 * Submit a new assessment
 * 
 * Middleware:
 * - assessmentSubmissionLimiter: Rate limiting (10 requests per minute per IP)
 * - sanitizeInput: Input sanitization and validation
 * 
 * Validates: Requirements 2.1, 10.1, 10.2
 */
router.post(
  '/assessments',
  assessmentSubmissionLimiter,
  sanitizeInput,
  submitAssessment
);

/**
 * GET /api/assessments/stats/:cohort
 * Get aggregate statistics for a cohort
 * 
 * Middleware:
 * - sanitizeInput: Input sanitization for cohort parameter
 * 
 * Validates: Requirement 3.1
 */
router.get(
  '/assessments/stats/:cohort',
  sanitizeInput,
  getCohortStatistics
);

/**
 * GET /api/assessments/recent/:cohort
 * Get recent assessments for a cohort
 * 
 * Query parameters:
 * - limit: Optional, default 50, max 100
 * 
 * Middleware:
 * - sanitizeInput: Input sanitization for cohort parameter and query params
 * 
 * Validates: Requirement 4.1
 */
router.get(
  '/assessments/recent/:cohort',
  sanitizeInput,
  getRecentAssessments
);

/**
 * GET /api/assessments/distribution/:cohort
 * Get assessment distribution data for a cohort
 * 
 * Middleware:
 * - sanitizeInput: Input sanitization for cohort parameter
 * 
 * Validates: Requirement 5.1
 */
router.get(
  '/assessments/distribution/:cohort',
  sanitizeInput,
  getAssessmentDistribution
);

/**
 * DELETE /api/assessments/:cohort
 * Delete all assessments for a cohort
 * 
 * Middleware:
 * - sanitizeInput: Input sanitization for cohort parameter
 * 
 * Validates: Requirement 6.1
 */
router.delete(
  '/assessments/:cohort',
  sanitizeInput,
  deleteAllAssessments
);

export default router;
