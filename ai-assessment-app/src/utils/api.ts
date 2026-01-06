// API client for Railway backend
// Supports dual backend mode for gradual migration from Supabase
// 需求: 12.5

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_RAILWAY = import.meta.env.VITE_USE_RAILWAY !== 'false'; // Default to Railway backend

// Log backend selection on initialization
if (USE_RAILWAY) {
  console.log('[API] Using Railway backend:', API_BASE_URL || 'same origin');
} else {
  console.log('[API] Using Supabase backend (legacy mode)');
}

// Assessment submission interface
export interface AssessmentSubmission {
  name?: string;
  cohort: string;
  total: number;
  title: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  answers: any;
  user_agent?: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

/**
 * Submit assessment result to backend API
 * Supports both Railway and Supabase backends
 * 需求: 7.1, 12.5
 */
export async function submitAssessment(
  submission: AssessmentSubmission
): Promise<{ ok: boolean; error?: any }> {
  // Use Railway backend
  if (USE_RAILWAY) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: submission.name || '匿名用户',
          cohort: submission.cohort,
          total: submission.total,
          title: submission.title,
          d1: submission.d1,
          d2: submission.d2,
          d3: submission.d3,
          d4: submission.d4,
          d5: submission.d5,
          answers: submission.answers,
          user_agent: submission.user_agent || navigator.userAgent,
        }),
      });

      const data: ApiResponse<{ id: string }> = await response.json();

      if (!response.ok) {
        console.error('API submission error:', data.error);
        return { ok: false, error: data.error };
      }

      return { ok: true };
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      return { ok: false, error };
    }
  }

  // Use Supabase backend (legacy)
  try {
    const { supabase } = await import('./supabase');
    
    const { error } = await supabase
      .from('ai_assessments')
      .insert({
        name: submission.name || '匿名用户',
        cohort: submission.cohort,
        total: submission.total,
        title: submission.title,
        d1: submission.d1,
        d2: submission.d2,
        d3: submission.d3,
        d4: submission.d4,
        d5: submission.d5,
        answers: submission.answers,
        user_agent: submission.user_agent || navigator.userAgent,
      })
      .select();

    if (error) {
      console.error('Supabase submission error:', error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    console.error('Failed to submit assessment via Supabase:', error);
    return { ok: false, error };
  }
}

/**
 * Get assessment statistics for a cohort
 * Supports both Railway and Supabase backends
 * 需求: 7.2, 12.5
 */
export async function getCohortStatistics(cohort: string = 'default') {
  // Use Railway backend
  if (USE_RAILWAY) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assessments/stats/${cohort}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get cohort statistics:', error);
      throw error;
    }
  }

  // Use Supabase backend (legacy)
  try {
    const { supabase } = await import('./supabase');
    
    const { data, error } = await supabase
      .from('ai_assessment_public_stats')
      .select('*')
      .eq('cohort', cohort)
      .single();

    if (error) {
      console.error('Supabase statistics error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get cohort statistics via Supabase:', error);
    throw error;
  }
}

/**
 * Get recent assessments for a cohort
 * Supports both Railway and Supabase backends
 * 需求: 7.3, 12.5
 */
export async function getRecentAssessments(
  cohort: string = 'default',
  limit: number = 50
) {
  // Use Railway backend
  if (USE_RAILWAY) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assessments/recent/${cohort}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch recent assessments: ${response.statusText}`);
      }

      const result: ApiResponse<any[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get recent assessments:', error);
      throw error;
    }
  }

  // Use Supabase backend (legacy)
  try {
    const { supabase } = await import('./supabase');
    
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('id, name, total, title, d1, d2, d3, d4, d5, created_at')
      .eq('cohort', cohort)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase recent assessments error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get recent assessments via Supabase:', error);
    throw error;
  }
}

/**
 * Get assessment distribution for charts
 * Supports both Railway and Supabase backends
 * 需求: 7.4, 12.5
 */
export async function getAssessmentDistribution(cohort: string = 'default') {
  // Use Railway backend
  if (USE_RAILWAY) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assessments/distribution/${cohort}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch distribution: ${response.statusText}`);
      }

      const result: ApiResponse<any[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get assessment distribution:', error);
      throw error;
    }
  }

  // Use Supabase backend (legacy)
  try {
    const { supabase } = await import('./supabase');
    
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('total, d1, d2, d3, d4, d5, created_at')
      .eq('cohort', cohort)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Supabase distribution error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get assessment distribution via Supabase:', error);
    throw error;
  }
}

/**
 * Delete all assessments for a cohort
 * 需求: 6.1
 */
export async function deleteAllAssessments(cohort: string = 'default') {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/assessments/${cohort}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete assessments: ${response.statusText}`);
    }

    const result: ApiResponse<{ deleted_count: number; cohort: string }> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to delete assessments:', error);
    throw error;
  }
}
