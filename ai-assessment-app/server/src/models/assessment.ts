/**
 * Data models and validation for AI Assessment
 */

/**
 * Assessment record interface
 */
export interface Assessment {
  id?: string;
  name: string;
  cohort: string;
  total: number;
  title: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  answers: any;
  created_at?: Date;
  user_agent?: string;
}

/**
 * Assessment statistics interface
 */
export interface AssessmentStats {
  cohort: string;
  total_count: number;
  avg_total: number;
  avg_d1: number;
  avg_d2: number;
  avg_d3: number;
  avg_d4: number;
  avg_d5: number;
  min_total: number;
  max_total: number;
}

/**
 * Validates assessment submission data
 * 
 * Requirements:
 * - 2.2: Validate required fields and score ranges
 * - 2.5: Validate total score is between 0-30
 * - 2.6: Validate dimension scores (d1-d5) are between 0-6
 * 
 * @param data - Assessment data to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateAssessment(data: any): string[] {
  const errors: string[] = [];
  
  // Validate required fields
  if (typeof data.total !== 'number') {
    errors.push('total 必须是数字');
  }
  
  if (typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title 必须是非空字符串');
  }
  
  if (typeof data.answers !== 'object' || data.answers === null) {
    errors.push('answers 必须是对象');
  }
  
  // Validate total score range (0-30)
  if (typeof data.total === 'number' && (data.total < 0 || data.total > 30)) {
    errors.push('total 必须在 0-30 之间');
  }
  
  // Validate dimension scores (d1-d5, each 0-6)
  for (let i = 1; i <= 5; i++) {
    const key = `d${i}`;
    const value = data[key];
    
    if (typeof value !== 'number') {
      errors.push(`${key} 必须是数字`);
    } else if (value < 0 || value > 6) {
      errors.push(`${key} 必须在 0-6 之间`);
    }
  }
  
  return errors;
}
