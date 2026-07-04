import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import LightRays from '../components/LightRays/LightRays';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    email: '', password: '', password_confirm: '',
    first_name: '', last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [linkHover, setLinkHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await register(form);
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const errors = err.response?.data;
      const first = errors ? Object.values(errors)[0] : null;
      setError(Array.isArray(first) ? first[0] : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '13px 16px',
    color: '#ffffff', fontSize: '14px', outline: 'none',
    width: '100%', transition: 'all 0.2s',
  };

  const labelStyle = {
    color: 'rgba(255,255,255,0.4)', fontSize: '11px',
    fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  };

  const fields = [
    { key: 'first_name', label: 'First name', type: 'text', placeholder: 'Ada' },
    { key: 'last_name', label: 'Last name', type: 'text', placeholder: 'Lovelace' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'password_confirm', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden',
      background: '#050810',
    }}>
      {/* Light rays */}
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

      {/* Glow ring */}
      <div style={{
        position: 'absolute', zIndex: 0,
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}
      >
        {/* PMINDS label */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{
            color: 'rgba(255,255,255,0.9)', fontSize: '13px',
            letterSpacing: '0.2em', fontWeight: 700,
            textShadow: '0 0 20px rgba(255,255,255,0.3)',
          }}>
            PMINDS
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '24px', padding: '44px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{
              fontSize: '26px', fontWeight: 700,
              color: '#ffffff', marginBottom: '6px',
              letterSpacing: '-0.02em',
            }}>
              Create account
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
              Start building your second brain
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {fields.map((field) => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  required
                  style={inputStyle}
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
            ))}

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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: '13px',
            textAlign: 'center', marginTop: '24px',
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                color: linkHover ? '#ffffff' : 'rgba(255,255,255,0.5)',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
