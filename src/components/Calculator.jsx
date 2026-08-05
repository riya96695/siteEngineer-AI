import { useState } from 'react'
import { Calculator as CalcIcon } from 'lucide-react'

export default function Calculator() {
  const [activeCalc, setActiveCalc] = useState('concrete')
  const [result, setResult] = useState(null)

  // Concrete Calculator state
  const [grade, setGrade] = useState('M25')
  const [volume, setVolume] = useState('')

  // Steel Calculator state
  const [diameter, setDiameter] = useState('16')
  const [length, setLength] = useState('')
  const [nos, setNos] = useState('')

  // Brick Calculator state
  const [wallLength, setWallLength] = useState('')
  const [wallHeight, setWallHeight] = useState('')
  const [thickness, setThickness] = useState('half')

  // Concrete calculation function
  // Ratios — IS code ke according standard mix ratios hain
  const calcConcrete = () => {
    const ratios = {
      M15: [1, 2, 4],
      M20: [1, 1.5, 3],
      M25: [1, 1, 2],
      M30: [1, 0.75, 1.5]
    }
    const [c, s, a] = ratios[grade]
    const total = c + s + a
    const dryVol = parseFloat(volume) * 1.54
    const cementBags = (dryVol * c / total) / 0.0347
    const sand = dryVol * s / total
    const aggregate = dryVol * a / total
    setResult({
      type: 'concrete',
      cement: cementBags.toFixed(1),
      sand: sand.toFixed(2),
      aggregate: aggregate.toFixed(2),
      grade, volume
    })
  }

  // Steel weight formula — D²/162 × L × N
  // D = diameter, L = length, N = number of bars
  const calcSteel = () => {
    const weight = (Math.pow(parseFloat(diameter), 2) / 162) * parseFloat(length) * parseFloat(nos)
    setResult({
      type: 'steel',
      weight: weight.toFixed(2),
      diameter, length, nos
    })
  }

  // Brick calculation
  const calcBrick = () => {
    const area = parseFloat(wallLength) * parseFloat(wallHeight)
    const bricks = thickness === 'half' ? area * 55 : area * 110
    const mortar = thickness === 'half' ? area * 0.03 : area * 0.06
    setResult({
      type: 'brick',
      bricks: Math.round(bricks),
      mortar: mortar.toFixed(2),
      wallLength, wallHeight
    })
  }

  // Reusable input style
  const inputStyle = {
    width: '100%',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ddd',
    fontSize: '13px',
    outline: 'none',
    marginTop: '6px'
  }

  const labelStyle = {
    fontSize: '12px',
    color: '#888',
    display: 'block'
  }

  const tabStyle = (active) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: active ? '#ff7a20' : '#242424',
    color: active ? '#fff' : '#888',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? '500' : 'normal'
  })

  return (
    <div style={{
      flex: 1,
      padding: '24px',
      overflowY: 'auto',
      background: '#1a1a1a'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
        🧮 Material Calculator
      </h2>
      <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>
        IS code ke according material quantity calculate karo
      </p>

      {/* 3 tabs — Concrete, Steel, Brick */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button style={tabStyle(activeCalc === 'concrete')} onClick={() => { setActiveCalc('concrete'); setResult(null) }}>
          🏗️ Concrete Mix
        </button>
        <button style={tabStyle(activeCalc === 'steel')} onClick={() => { setActiveCalc('steel'); setResult(null) }}>
          🔩 Steel Weight
        </button>
        <button style={tabStyle(activeCalc === 'brick')} onClick={() => { setActiveCalc('brick'); setResult(null) }}>
          🧱 Brick & Mortar
        </button>
      </div>

      {/* Calculator form */}
      <div style={{
        background: '#242424',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '480px'
      }}>

        {/* Concrete Calculator */}
        {activeCalc === 'concrete' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Concrete Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} style={inputStyle}>
                <option>M15</option>
                <option>M20</option>
                <option>M25</option>
                <option>M30</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Volume (cubic meters)</label>
              <input type="number" placeholder="e.g. 2.5" value={volume} onChange={e => setVolume(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={calcConcrete} style={{
              padding: '10px', borderRadius: '8px', border: 'none',
              background: '#ff7a20', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>Calculate</button>
          </div>
        )}

        {/* Steel Calculator */}
        {activeCalc === 'steel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Bar Diameter (mm)</label>
              <select value={diameter} onChange={e => setDiameter(e.target.value)} style={inputStyle}>
                {[8, 10, 12, 16, 20, 25, 32].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Length (meters)</label>
              <input type="number" placeholder="e.g. 3" value={length} onChange={e => setLength(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Number of bars</label>
              <input type="number" placeholder="e.g. 8" value={nos} onChange={e => setNos(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={calcSteel} style={{
              padding: '10px', borderRadius: '8px', border: 'none',
              background: '#ff7a20', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>Calculate</button>
          </div>
        )}

        {/* Brick Calculator */}
        {activeCalc === 'brick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Wall Length (m)</label>
              <input type="number" placeholder="e.g. 5" value={wallLength} onChange={e => setWallLength(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Wall Height (m)</label>
              <input type="number" placeholder="e.g. 3" value={wallHeight} onChange={e => setWallHeight(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Wall Thickness</label>
              <select value={thickness} onChange={e => setThickness(e.target.value)} style={inputStyle}>
                <option value="half">Half brick (115mm)</option>
                <option value="one">One brick (230mm)</option>
              </select>
            </div>
            <button onClick={calcBrick} style={{
              padding: '10px', borderRadius: '8px', border: 'none',
              background: '#ff7a20', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>Calculate</button>
          </div>
        )}
      </div>

      {/* Result box — tabhi dikhega jab calculate karo */}
      {result && (
        <div style={{
          marginTop: '16px',
          background: '#ff7a2015',
          border: '1px solid #ff7a2040',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '480px'
        }}>
          <h4 style={{ color: '#ff7a20', marginBottom: '12px' }}>📊 Result:</h4>

          {result.type === 'concrete' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#ddd', fontSize: '13px' }}>
                {result.volume} m³ of <strong>{result.grade}</strong> ke liye:
              </p>
              <p style={{ color: '#ddd', fontSize: '13px' }}>🏭 Cement: <strong style={{ color: '#ff7a20' }}>{result.cement} bags</strong> (50kg each)</p>
              <p style={{ color: '#ddd', fontSize: '13px' }}>🏖️ Sand: <strong style={{ color: '#ff7a20' }}>{result.sand} m³</strong></p>
              <p style={{ color: '#ddd', fontSize: '13px' }}>🪨 Aggregate: <strong style={{ color: '#ff7a20' }}>{result.aggregate} m³</strong></p>
            </div>
          )}

          {result.type === 'steel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#ddd', fontSize: '13px' }}>
                {result.nos} bars of {result.diameter}mm × {result.length}m:
              </p>
              <p style={{ color: '#ddd', fontSize: '13px' }}>⚖️ Total Weight: <strong style={{ color: '#ff7a20' }}>{result.weight} kg</strong></p>
            </div>
          )}

          {result.type === 'brick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#ddd', fontSize: '13px' }}>
                {result.wallLength}m × {result.wallHeight}m wall ke liye:
              </p>
              <p style={{ color: '#ddd', fontSize: '13px' }}>🧱 Bricks: <strong style={{ color: '#ff7a20' }}>{result.bricks} bricks</strong></p>
              <p style={{ color: '#ddd', fontSize: '13px' }}>🪣 Mortar: <strong style={{ color: '#ff7a20' }}>{result.mortar} m³</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}