'use client'

interface PaymentMethodSelectorProps {
  selectedMethod: string | null
  onSelect: (method: string) => void
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  const paymentMethods = [
    { id: 'ideal', name: 'iDeal', icon: '💳' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🔵' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition min-h-[44px] touch-manipulation ${
              selectedMethod === method.id
                ? 'border-[#C9653B] bg-[#C9653B]/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={() => onSelect(method.id)}
              className="mr-3 w-5 h-5"
            />
            <span className="text-2xl mr-3">{method.icon}</span>
            <span className="font-medium">{method.name}</span>
          </label>
        ))}
      </div>
      
      {/* Trust Signals */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 mb-1">Your payment is secure</p>
            <p className="text-xs text-green-700">
              All transactions are encrypted and secure. We never store your payment details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

