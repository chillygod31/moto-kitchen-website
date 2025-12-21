'use client'

import { formatDate } from '@/lib/utils'

interface OrderTimelineProps {
  orderNumber: string
  scheduledFor?: string | null
  leadTimeMinutes?: number
}

export default function OrderTimeline({
  orderNumber,
  scheduledFor,
  leadTimeMinutes = 120,
}: OrderTimelineProps) {
  const getEstimatedReadyTime = () => {
    if (!scheduledFor) return null
    
    const scheduledDate = new Date(scheduledFor)
    const readyDate = new Date(scheduledDate.getTime() + leadTimeMinutes * 60 * 1000)
    return readyDate
  }

  const estimatedReady = getEstimatedReadyTime()

  const timelineSteps = [
    {
      status: 'confirmed',
      title: 'Order Confirmed',
      description: 'We\'ve received your order',
      completed: true,
      time: 'Just now',
    },
    {
      status: 'preparing',
      title: 'Preparing Your Order',
      description: 'Our kitchen is getting started',
      completed: false,
      time: estimatedReady ? formatDate(estimatedReady) : null,
    },
    {
      status: 'ready',
      title: 'Ready for Pickup/Delivery',
      description: 'Your order is ready',
      completed: false,
      time: estimatedReady ? formatDate(estimatedReady) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Order Status</h2>
        <div className="space-y-4">
          {timelineSteps.map((step, index) => (
            <div key={step.status} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 mt-2 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-8">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
                {step.time && (
                  <p className="text-xs text-gray-500 mt-1">Estimated: {step.time}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>What happens next?</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
          <li>You'll receive a confirmation email shortly</li>
          <li>We'll prepare your order</li>
          {estimatedReady && (
            <li>Estimated ready time: {formatDate(estimatedReady)}</li>
          )}
        </ul>
      </div>
    </div>
  )
}

