'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      if (!credentialResponse.credential) throw new Error('No credential received');
      const res = await authApi.google(credentialResponse.credential);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(108,71,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Image src="/logo.png" alt="SnapLedger Logo" width={64} height={64} style={{ borderRadius: 16 }} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>SnapLedger</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button id="login-btn" className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed.')}
            useOneTap
            theme="filled_black"
            shape="rectangular"
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
