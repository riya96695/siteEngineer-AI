import { BookOpen, Download } from 'lucide-react'

const isCodes = [
  {
    name: "IS 456 — 2000",
    desc: "Plain and Reinforced Concrete — Code of Practice",
    use: "Columns, Beams, Slabs, Foundations",
    color: "#ff7a20",
    file: "IS_456_2000.pdf"
  },
  {
    name: "IS 800 — 2007",
    desc: "General Construction in Steel — Code of Practice",
    use: "Steel structures, Industrial sheds",
    color: "#3b82f6",
    file: "IS_800_2007.pdf"
  },
  {
    name: "IS 1200",
    desc: "Method of Measurement of Building Works",
    use: "Billing, Quantity estimation",
    color: "#10b981",
    file: "IS_1200.pdf"
  },
  {
    name: "IS 875",
    desc: "Code of Practice for Design Loads",
    use: "Dead load, Live load, Wind load",
    color: "#8b5cf6",
    file: "IS_875.pdf"
  },
]

export default function ISCodeLibrary() {
  return (
    <div style={{
      flex: 1,
      padding: '24px',
      overflowY: 'auto',
      background: '#1a1a1a'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
        📚 IS Code Library
      </h2>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>
        PDF download karo aur directly read karo
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {isCodes.map((code, index) => (
          <div key={index} style={{
            background: '#242424',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '20px',
            borderTop: `3px solid ${code.color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <BookOpen size={20} color={code.color} />
              <h3 style={{ color: code.color, fontSize: '16px', fontWeight: '600' }}>
                {code.name}
              </h3>
            </div>

            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '8px', lineHeight: '1.5' }}>
              {code.desc}
            </p>

            <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>
              Used for: {code.use}
            </p>

            <button
              onClick={() => window.open(`http://localhost:8000/api/is-codes/${code.file}`, '_blank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: code.color,
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Download size={14} />
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}