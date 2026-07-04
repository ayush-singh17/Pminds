import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import LightRays from '../components/LightRays/LightRays';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [linkHover, setLinkHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(form);
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden',
      background: '#050810', flexDirection: 'column',
    }}>
      {/* Light rays background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#404040"
          raysSpeed={0.4}
          lightSpread={0.8}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.12}
          noiseAmount={0.03}
          distortion={0.03}
          fadeDistance={1.2}
          saturation={1.2}
        />
      </div>

      {/* Glow ring behind card */}
      <div style={{
        position: 'absolute', zIndex: 0,
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '24px' }}
      >
        <p style={{
          color: 'rgba(255,255,255,0.9)', fontSize: '13px',
          letterSpacing: '0.2em', fontWeight: 700,
          textShadow: '0 0 20px rgba(255,255,255,0.3)',
        }}>
          PMINDS
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '400px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '24px', padding: '44px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '26px', fontWeight: 700,
            color: '#ffffff', marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>
            Welcome back
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
            Sign in to your PMinds account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              color: 'rgba(255,255,255,0.4)', fontSize: '11px',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '13px 16px',
                color: '#ffffff', fontSize: '14px', outline: 'none',
                width: '100%', transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.25)';
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              color: 'rgba(255,255,255,0.4)', fontSize: '11px',
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '13px 16px',
                color: '#ffffff', fontSize: '14px', outline: 'none',
                width: '100%', transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.25)';
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#F43F5E', fontSize: '12px',
              padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(244,63,94,0.1)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              padding: '14px', borderRadius: '12px',
              background: btnHover
                ? 'linear-gradient(135deg, #5d97f5 0%, #0666d4 50%, #8B5CF6 100%)'
                : 'linear-gradient(135deg, #032582 0%, #6366f1 100%)',
              border: 'none', color: '#ffffff',
              fontSize: '14px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px', width: '100%',
              transition: 'all 0.3s',
              boxShadow: btnHover
                ? '0 8px 24px rgba(6,182,212,0.4)'
                : '0 4px 12px rgba(6,182,212,0.2)',
              transform: btnHover ? 'translateY(-1px)' : 'translateY(0)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            onMouseEnter={() => setLinkHover(true)}
            onMouseLeave={() => setLinkHover(false)}
            style={{
              color: linkHover ? '#ffffff' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
