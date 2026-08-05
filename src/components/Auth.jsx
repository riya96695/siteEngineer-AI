import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) setError(error.message)

      } else {
        // Signup
        const { error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) setError(error.message)
        else setError('✅ Check your email to verify!')
      }

    } catch (e) {
      setError('Something went wrong!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a1a'
    }}>
      <div style={{
        background: '#242424',
        border: '1px solid #333',
        borderRadius: '16px',
        padding: '32px',
        width: '360px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#ff7a20', fontSize: '22px', fontWeight: '600' }}>
            🏗️ SiteEngineer AI
          </h1>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
            Junior engineers ka AI assistant
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: '#1a1a1a',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: '8px',
              borderRadius: '6px', border: 'none',
              background: isLogin ? '#ff7a20' : 'none',
              color: isLogin ? '#fff' : '#888',
              cursor: 'pointer', fontSize: '13px',
              fontWeight: isLogin ? '500' : 'normal',
              transition: 'all 0.2s'
            }}>
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: '8px',
              borderRadius: '6px', border: 'none',
              background: !isLogin ? '#ff7a20' : 'none',
              color: !isLogin ? '#fff' : '#888',
              cursor: 'pointer', fontSize: '13px',
              fontWeight: !isLogin ? '500' : 'normal',
              transition: 'all 0.2s'
            }}>
            Sign Up
          </button>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="engineer@site.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: '8px', color: '#ddd',
              fontSize: '13px', outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.border = '1px solid #ff7a20'}
            onBlur={e => e.target.style.border = '1px solid #333'}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{
              width: '100%', padding: '10px 14px',
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: '8px', color: '#ddd',
              fontSize: '13px', outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.border = '1px solid #ff7a20'}
            onBlur={e => e.target.style.border = '1px solid #333'}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: error.includes('✅') ? '#ff7a2015' : '#ff000015',
            border: `1px solid ${error.includes('✅') ? '#ff7a20' : '#ff0000'}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: error.includes('✅') ? '#ff7a20' : '#ff6666',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? '#555' : '#ff7a20',
            border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '14px',
            fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}