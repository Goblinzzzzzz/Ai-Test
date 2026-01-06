import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware for assessment submission endpoint
 * Limits each IP to 10 requests per minute
 * 
 * Validates: Requirements 10.1
 */
export const assessmentSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 requests per window
  message: {
    success: false,
    error: {
      message: '请求过于频繁,请稍后再试',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address as the key for rate limiting
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // Skip successful requests from counting (optional, can be removed if all requests should count)
  skipSuccessfulRequests: false,
  // Skip failed requests from counting (optional, can be removed if all requests should count)
  skipFailedRequests: false,
});
