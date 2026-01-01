'use client'

export default function InvoicePage() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', padding: 0, margin: 0 }}>
      <iframe
        src="/invoice-generator/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Invoice Generator"
      />
    </div>
  )
}

