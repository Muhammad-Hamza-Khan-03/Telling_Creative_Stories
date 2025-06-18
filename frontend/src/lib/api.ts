// lib/api.ts - Centralized API service for backend communication

import { StoryNode, StoryProject } from '@/store/store'

// Types for API communication
export interface BranchRequest {
  context: string
  current_node_id: string
  character_names: string[]
  genre: string
  tone: string
}

export interface BranchOption {
  id: string
  title: string
  summary: string
  content: string
  characters: string[]
  impact: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface BranchResponse {
  options: BranchOption[]
  generation_time: number
  cached: boolean
}

export interface AnalysisRequest {
  nodes: StoryNode[]
  project_info: StoryProject
}

export interface APIError {
  success: false
  message: string
  error_code?: string
  details?: string
}

export interface APISuccess<T> {
  success: true
  data: T
  message?: string
}

export type APIResponse<T> = APISuccess<T> | APIError

// Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
const DEFAULT_TIMEOUT = 30000 // 30 seconds for AI operations

/**
 * Custom error class for API-related errors
 * This helps us distinguish between network errors, API errors, and other issues
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Base fetch wrapper with timeout, error handling, and consistent format
 * This is the foundation that all our API calls will use
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
  // Create an AbortController for request timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle non-JSON responses (like health checks)
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      if (isJson) {
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          // If parsing JSON fails, use the default message
        }
      }

      throw new APIError(errorMessage, response.status)
    }

    if (isJson) {
      return await response.json()
    } else {
      throw new APIError('Unexpected non-JSON response from API.', response.status)
    }

  } catch (error) {
    clearTimeout(timeoutId)

    if (typeof error === 'object' && error !== null && 'name' in error && (error as any).name === 'AbortError') {
      throw new APIError('Request timed out. Please try again.', 408, 'TIMEOUT')
    }

    if (error instanceof APIError) {
      throw error
    }

    // Handle network errors
    throw new APIError(
      'Unable to connect to the service. Please check your connection.',
      0,
      'NETWORK_ERROR'
    )
  }
}

/**
 * AI Branch Generation Service
 * Generates story continuation options using AI
 */
export const branchService = {
  /**
   * Generate story branches from current context
   */
  async generateBranches(request: BranchRequest): Promise<BranchResponse> {
    console.log('🤖 Generating branches for node:', request.current_node_id)
    
    return apiRequest<BranchResponse>('/branches/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  /**
   * Regenerate branches with fresh AI output (bypasses cache)
   */
  async regenerateBranches(request: BranchRequest): Promise<BranchResponse> {
    console.log('🔄 Regenerating branches for node:', request.current_node_id)
    
    return apiRequest<BranchResponse>('/branches/regenerate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  /**
   * Check if branch generation service is healthy
   */
  async checkHealth(): Promise<any> {
    return apiRequest('/branches/health', { method: 'GET' })
  }
}

/**
 * Analytics Service for Narrative DNA analysis
 */
export const analyticsService = {
  /**
   * Perform full Narrative DNA analysis
   */
  async analyzeStory(request: AnalysisRequest): Promise<any> {
    console.log('📊 Analyzing story with', request.nodes.length, 'nodes')
    
    return apiRequest('/analytics/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    }, 45000) // Longer timeout for complex analysis
  },

  /**
   * Get quick insights without full analysis
   */
  async getQuickInsights(request: AnalysisRequest): Promise<any> {
    console.log('⚡ Getting quick insights for story')
    
    return apiRequest('/analytics/quick-insights', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  /**
   * Check analytics service health
   */
  async checkHealth(): Promise<any> {
    return apiRequest('/analytics/health', { method: 'GET' })
  }
}

/**
 * System Health Service
 * Monitors the overall health of backend services
 */
export const healthService = {
  /**
   * Check overall system health
   */
  async checkSystemHealth(): Promise<any> {
    return apiRequest('/health', { method: 'GET' }, 5000)
  },

  /**
   * Check if all services are operational
   */
  async checkAllServices(): Promise<{
    system: boolean
    branches: boolean
    analytics: boolean
  }> {
    try {
      const [system, branches, analytics] = await Promise.allSettled([
        healthService.checkSystemHealth(),
        branchService.checkHealth(),
        analyticsService.checkHealth(),
      ])

      return {
        system: system.status === 'fulfilled',
        branches: branches.status === 'fulfilled',
        analytics: analytics.status === 'fulfilled',
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        system: false,
        branches: false,
        analytics: false,
      }
    }
  }
}

/**
 * Utility function to handle API errors in components
 * Returns a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    switch (error.errorCode) {
      case 'TIMEOUT':
        return 'The request took too long. Please try again.'
      case 'NETWORK_ERROR':
        return 'Unable to connect. Please check your internet connection.'
      default:
        return error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}