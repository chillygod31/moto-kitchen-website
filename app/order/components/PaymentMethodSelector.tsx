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
    { 
      id: 'ideal', 
      name: 'iDEAL',
      disabled: true,
      comingSoon: true,
      logo: (
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="36" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M8 12H32M8 8H32M8 16H32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      id: 'card', 
      name: 'Card',
      disabled: false,
      comingSoon: false,
      logo: (
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="6" width="36" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M2 10H38" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
        </svg>
      )
    },
    { 
      id: 'paypal', 
      name: 'PayPal',
      disabled: true,
      comingSoon: true,
      logo: (
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 8C8 8 10 6 14 6C18 6 20 8 20 12C20 16 18 18 14 18H10L8 22H4L6 18H8V8Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M24 8V14C24 14 26 16 30 16C32 16 34 15 34 13C34 11 32 10 30 10C28 10 26 11 26 13" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-row gap-3">
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-lg transition min-h-[60px] touch-manipulation relative ${
              method.disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : selectedMethod === method.id
                ? 'border-[#C9653B] bg-[#C9653B]/5 cursor-pointer'
                : 'border-gray-300 hover:border-gray-400 cursor-pointer'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={() => !method.disabled && onSelect(method.id)}
              disabled={method.disabled}
              className="sr-only"
            />
            <div className={`mb-2 transition ${selectedMethod === method.id ? 'text-[#C9653B]' : 'text-gray-400 grayscale'}`}>
              {method.logo}
            </div>
            <span className={`text-xs font-medium ${selectedMethod === method.id ? 'text-[#C9653B]' : 'text-gray-600'}`}>
              {method.name}
            </span>
            {method.comingSoon && (
              <span className="absolute top-1 right-1 text-[8px] font-semibold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                Coming soon
              </span>
            )}
          </label>
        ))}
      </div>
      
      {/* Trust Signals */}
      <div className="bg-[#FAF6EF] border border-[#E7E1D9] rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-gray-700">
            Secure checkout via encrypted payments. We never store card details.
          </p>
        </div>
      </div>
    </div>
  )
}

