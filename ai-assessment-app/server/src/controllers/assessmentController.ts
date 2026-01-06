import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { validateAssessment } from '../models/assessment.js';

/**
 * Submit a new assessment
 * 
 * Requirements:
 * - 2.1: Insert assessment record into database
 * - 2.3: Return 201 status with created record ID on success
 * - 2.4: Return 500 error on database failure
 * - 2.2: Validate input and return 400 on validation errors
 * - 2.7: Apply default name "匿名用户" if not provided
 * - 2.8: Apply default cohort "default" if not provided
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export async function submitAssessment(req: Request, res: Response): Promise<void> {
  try {
    // Extract data from request body
    const data = req.body;
    
    // Apply default values (Requirements 2.7, 2.8)
    const assessmentData = {
      ...data,
      name: data.name || '匿名用户',
      cohort: data.cohort || 'default',
      user_agent: data.user_agent || req.get('user-agent') || null,
    };
    
    // Validate assessment data (Requirement 2.2)
    const validationErrors = validateAssessment(assessmentData);
    
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          message: '验证失败',
          details: validationErrors,
        },
      });
      return;
    }
    
    // Insert into database (Requirement 2.1)
    const query = `
      INSERT INTO ai_assessments (
        name, cohort, total, title, d1, d2, d3, d4, d5, answers, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const values = [
      assessmentData.name,
      assessmentData.cohort,
      assessmentData.total,
      assessmentData.title,
      assessmentData.d1,
      assessmentData.d2,
      assessmentData.d3,
      assessmentData.d4,
      assessmentData.d5,
      JSON.stringify(assessmentData.answers),
      assessmentData.user_agent,
    ];
    
    const result = await pool.query(query, values);
    
    // Return success response (Requirement 2.3)
    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
      },
    });
    
  } catch (error) {
    // Handle database errors (Requirement 2.4)
    console.error('Error submitting assessment:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误',
      },
    });
  }
}

/**
 * Get cohort statistics
 * 
 * Requirements:
 * - 3.1: Return aggregate statistics for the specified cohort
 * - 3.2: Calculate count, averages, min and max total scores
 * - 3.3: Return null or empty statistics when no assessments exist for the cohort
 * 
 * @param req - Express request object with cohort parameter
 * @param res - Express response object
 */
export async function getCohortStatistics(req: Request, res: Response): Promise<void> {
  try {
    const { cohort } = req.params;
    
    // Query the ai_assessment_public_stats view (Requirement 3.1)
    const query = `
      SELECT 
        cohort,
        total_count,
        avg_total,
        avg_d1,
        avg_d2,
        avg_d3,
        avg_d4,
        avg_d5,
        min_total,
        max_total
      FROM ai_assessment_public_stats
      WHERE cohort = $1
    `;
    
    const result = await pool.query(query, [cohort]);
    
    // Handle empty results (Requirement 3.3)
    let data = result.rows.length > 0 ? result.rows[0] : null;
    
    // Convert string numbers to actual numbers for proper JSON serialization
    if (data) {
      data = {
        cohort: data.cohort,
        total_count: parseInt(data.total_count),
        avg_total: parseFloat(data.avg_total),
        avg_d1: parseFloat(data.avg_d1),
        avg_d2: parseFloat(data.avg_d2),
        avg_d3: parseFloat(data.avg_d3),
        avg_d4: parseFloat(data.avg_d4),
        avg_d5: parseFloat(data.avg_d5),
        min_total: parseInt(data.min_total),
        max_total: parseInt(data.max_total),
      };
    }
    
    // Return success response (Requirement 3.1, 3.2)
    res.status(200).json({
      success: true,
      data,
    });
    
  } catch (error) {
    // Handle database errors (Requirement 3.3 - database query failure)
    console.error('Error fetching cohort statistics:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误',
      },
    });
  }
}

/**
 * Get recent assessments for a cohort
 * 
 * Requirements:
 * - 4.1: Return recent assessments ordered by created_at descending
 * - 4.2: Support limit parameter (default 50, max 100)
 * - 4.3: Return only non-sensitive fields (exclude answers, user_agent)
 * 
 * @param req - Express request object with cohort parameter and optional limit query
 * @param res - Express response object
 */
export async function getRecentAssessments(req: Request, res: Response): Promise<void> {
  try {
    const { cohort } = req.params;
    
    // Parse and validate limit parameter (Requirement 4.2)
    let limit = parseInt(req.query.limit as string) || 50;
    
    // Enforce maximum limit of 100 (Requirement 4.2)
    if (limit > 100) {
      limit = 100;
    }
    
    // Ensure limit is positive
    if (limit < 1) {
      limit = 50;
    }
    
    // Query only non-sensitive fields (Requirement 4.3)
    // Ordered by created_at descending (Requirement 4.1)
    const query = `
      SELECT 
        id,
        name,
        total,
        title,
        d1,
        d2,
        d3,
        d4,
        d5,
        created_at
      FROM ai_assessments
      WHERE cohort = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [cohort, limit]);
    
    // Return success response (Requirement 4.1)
    res.status(200).json({
      success: true,
      data: result.rows,
    });
    
  } catch (error) {
    // Handle database errors (Requirement 4.1 - database query failure)
    console.error('Error fetching recent assessments:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误',
      },
    });
  }
}

/**
 * Get assessment distribution data for a cohort
 * 
 * Requirements:
 * - 5.1: Return assessment records with scores and timestamps
 * - 5.2: Limit results to most recent 1000 records
 * - 5.3: Order results by created_at descending
 * 
 * @param req - Express request object with cohort parameter
 * @param res - Express response object
 */
export async function getAssessmentDistribution(req: Request, res: Response): Promise<void> {
  try {
    const { cohort } = req.params;
    
    // Query distribution data (Requirement 5.1)
    // Limited to 1000 records (Requirement 5.2)
    // Ordered by created_at descending (Requirement 5.3)
    const query = `
      SELECT 
        total,
        d1,
        d2,
        d3,
        d4,
        d5,
        created_at
      FROM ai_assessments
      WHERE cohort = $1
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    
    const result = await pool.query(query, [cohort]);
    
    // Return success response (Requirement 5.1)
    res.status(200).json({
      success: true,
      data: result.rows,
    });
    
  } catch (error) {
    // Handle database errors (Requirement 5.1 - database query failure)
    console.error('Error fetching assessment distribution:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: '服务器内部错误',
      },
    });
  }
}
