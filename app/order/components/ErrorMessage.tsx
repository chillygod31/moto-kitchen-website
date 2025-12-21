interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export default function ErrorMessage({
  message,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-red-800">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-red-600 hover:text-red-800 flex-shrink-0"
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
  )
}

interface SuccessMessageProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export function SuccessMessage({
  message,
  onDismiss,
  className = '',
}: SuccessMessageProps) {
  return (
    <div
      className={`bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-green-600 hover:text-green-800 flex-shrink-0"
          aria-label="Dismiss message"
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
  )
}

