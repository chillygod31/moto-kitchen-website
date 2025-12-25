/**
 * Centralized logging utility
 * 
 * Provides structured logging with context (tenant, request ID, etc.)
 * Logs tenant resolution failures, auth failures, and blocked RLS attempts
 */

interface LogContext {
  tenantId?: string
  tenantSlug?: string
  requestId?: string
  userId?: string
  path?: string
  [key: string]: unknown
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...(context && { context }),
    ...(error && {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    }),
  }

  // In production, you might want to send to a logging service
  // For now, we'll use console with structured output
  const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log
  
  logMethod(JSON.stringify(logEntry))
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    formatLog('info', message, context)
  },

  warn: (message: string, context?: LogContext) => {
    formatLog('warn', message, context)
  },

  error: (message: string, error?: Error, context?: LogContext) => {
    formatLog('error', message, context, error)
  },

  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      formatLog('debug', message, context)
    }
  },

  // Specialized loggers
  tenantResolution: {
    success: (tenantSlug: string, tenantId: string, context?: LogContext) => {
      logger.info('Tenant resolved successfully', {
        ...context,
        tenantSlug,
        tenantId,
      })
    },
    failure: (reason: string, context?: LogContext) => {
      logger.warn('Tenant resolution failed', {
        ...context,
        reason,
      })
    },
  },

  auth: {
    success: (userId: string, tenantId: string, context?: LogContext) => {
      logger.info('Authentication successful', {
        ...context,
        userId,
        tenantId,
      })
    },
    failure: (reason: string, context?: LogContext) => {
      logger.warn('Authentication failed', {
        ...context,
        reason,
      })
    },
  },

  rls: {
    blocked: (table: string, tenantId: string, context?: LogContext) => {
      logger.warn('RLS policy blocked access', {
        ...context,
        table,
        tenantId,
      })
    },
  },

  api: {
    request: (method: string, path: string, context?: LogContext) => {
      logger.debug('API request', {
        ...context,
        method,
        path,
      })
    },
    error: (method: string, path: string, error: Error, context?: LogContext) => {
      logger.error(`API error: ${method} ${path}`, error, {
        ...context,
        method,
        path,
      })
    },
  },
}

/**
 * Extract request ID from headers
 */
export function getRequestId(headers: Headers): string | undefined {
  return headers.get('x-request-id') || undefined
}

/**
 * Extract tenant context from headers
 */
export function getTenantContextFromHeaders(headers: Headers): Partial<LogContext> {
  return {
    tenantId: headers.get('x-tenant-id') || undefined,
    tenantSlug: headers.get('x-tenant-slug') || undefined,
    requestId: headers.get('x-request-id') || undefined,
  }
}

