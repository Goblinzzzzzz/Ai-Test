/**
 * @deprecated This Supabase client is deprecated and maintained only for backward compatibility.
 * New implementations should use the Railway backend API in api.ts
 * 
 * This file will be removed in a future version once migration is complete.
 */

// Mock Supabase client interface for backward compatibility
// This allows gradual migration from Supabase to Railway backend

export interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
}

export interface SupabaseQueryBuilder {
  insert: (data: any) => SupabaseInsertBuilder;
  select: (columns?: string) => SupabaseSelectBuilder;
}

export interface SupabaseInsertBuilder {
  select: () => Promise<{ data: any; error: any }>;
}

export interface SupabaseSelectBuilder {
  eq: (column: string, value: any) => SupabaseSelectBuilder;
  order: (column: string, options?: { ascending: boolean }) => SupabaseSelectBuilder;
  limit: (count: number) => SupabaseSelectBuilder;
  single: () => Promise<{ data: any; error: any }>;
  then: (resolve: (value: { data: any; error: any }) => void) => Promise<{ data: any; error: any }>;
}

/**
 * @deprecated Use Railway backend API instead
 * Creates a mock Supabase client that proxies to Railway backend
 */
export function createClient(_supabaseUrl: string, _supabaseKey: string): SupabaseClient {
  console.warn(
    '[DEPRECATED] Supabase client is deprecated. Please migrate to Railway backend API (api.ts)'
  );

  const API_BASE_URL = import.meta.env.VITE_API_URL || '';

  return {
    from: (table: string) => {
      if (table !== 'ai_assessments') {
        throw new Error(`Table ${table} not supported in compatibility mode`);
      }

      return {
        insert: (data: any) => ({
          select: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/assessments`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              const result = await response.json();

              if (!response.ok) {
                return { data: null, error: result.error };
              }

              return { data: [{ id: result.data.id }], error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
        }),

        select: (_columns?: string) => {
          let cohort = 'default';
          let limit = 50;

          const builder: SupabaseSelectBuilder = {
            eq: (column: string, value: any) => {
              if (column === 'cohort') {
                cohort = value;
              }
              return builder;
            },

            order: (_column: string, _options?: { ascending: boolean }) => {
              // Order is handled by the backend API
              return builder;
            },

            limit: (count: number) => {
              limit = count;
              return builder;
            },

            single: async () => {
              try {
                const response = await fetch(
                  `${API_BASE_URL}/api/assessments/stats/${cohort}`
                );

                const result = await response.json();

                if (!response.ok) {
                  return { data: null, error: result.error };
                }

                return { data: result.data, error: null };
              } catch (error) {
                return { data: null, error };
              }
            },

            then: async (resolve) => {
              try {
                const response = await fetch(
                  `${API_BASE_URL}/api/assessments/recent/${cohort}?limit=${limit}`
                );

                const result = await response.json();

                if (!response.ok) {
                  resolve({ data: null, error: result.error });
                  return { data: null, error: result.error };
                }

                resolve({ data: result.data, error: null });
                return { data: result.data, error: null };
              } catch (error) {
                resolve({ data: null, error });
                return { data: null, error };
              }
            },
          };

          return builder;
        },
      };
    },
  };
}

/**
 * @deprecated Legacy Supabase client instance
 * Use Railway backend API functions from api.ts instead
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);
