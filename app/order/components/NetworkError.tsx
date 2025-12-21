'use client'

interface NetworkErrorProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export default function NetworkError({
  message,
  onRetry,
  onDismiss,
  className = '',
}: NetworkErrorProps) {
  return (
    <div
      className={`bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start justify-between ${className}`}
      role="alert"
    >
      <div className="flex items-start flex-1">
        <svg
          className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-orange-800 font-medium mb-1">Connection Problem</p>
          <p className="text-sm text-orange-700">{message}</p>
        </div>
      </div>
      <div className="ml-4 flex gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition font-medium min-h-[44px]"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-orange-600 hover:text-orange-800 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

