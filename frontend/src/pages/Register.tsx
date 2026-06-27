import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fields = [
    { key: 'first_name', label: 'First name', type: 'text', placeholder: 'Ada' },
    { key: 'last_name', label: 'Last name', type: 'text', placeholder: 'Lovelace' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { key: 'password_confirm', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0A0F1E' }}>

      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1E293B 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

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
        <div className="rounded-xl p-8"
          style={{ background: '#111827', border: '1px solid #1E293B' }}>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#F8FAFC' }}>
              Create account
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Start building your second brain
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
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
            ))}

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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: '#94A3B8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#06B6D4' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
