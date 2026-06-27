import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0A0F1E' }}>

      {/* Dot field background */}
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1E293B 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glow */}
      <div className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Card */}
        <div className="rounded-xl p-8"
          style={{ background: '#111827', border: '1px solid #1E293B' }}>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#F8FAFC' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Sign in to your PMinds account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: '#0A0F1E',
                  border: '1px solid #1E293B',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                onBlur={(e) => e.target.style.borderColor = '#1E293B'}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: '#0A0F1E',
                  border: '1px solid #1E293B',
                  color: '#F8FAFC',
                }}
                onFocus={(e) => e.target.style.borderColor = '#06B6D4'}
                onBlur={(e) => e.target.style.borderColor = '#1E293B'}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#F43F5E' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg py-2.5 text-sm font-medium transition-all mt-2"
              style={{
                background: loading ? '#0e7490' : '#06B6D4',
                color: '#0A0F1E',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: '#94A3B8' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#06B6D4' }}>
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
