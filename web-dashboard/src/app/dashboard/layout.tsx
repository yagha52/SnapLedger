'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, PieChart, LogOut, FileText } from 'lucide-react';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--surface-2)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 8px', marginBottom: 32 }}>
          <h2 className="gradient-text" style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            📄 SnapLedger
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10,
            background: pathname === '/dashboard' ? 'rgba(108,71,255,0.1)' : 'transparent',
            color: pathname === '/dashboard' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: pathname === '/dashboard' ? 600 : 500,
            textDecoration: 'none', transition: 'all 0.2s'
          }}>
            <FileText size={18} /> Invoices
          </Link>
          <Link href="/dashboard/analytics" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10,
            background: pathname === '/dashboard/analytics' ? 'rgba(108,71,255,0.1)' : 'transparent',
            color: pathname === '/dashboard/analytics' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: pathname === '/dashboard/analytics' ? 600 : 500,
            textDecoration: 'none', transition: 'all 0.2s'
          }}>
            <PieChart size={18} /> Analytics
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', border: 'none' }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
