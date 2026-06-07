'use client';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6c47ff', '#22d3a5', '#ff4d6d', '#fbbf24', '#a78bfa', '#38bdf8'];

export default function AnalyticsPage() {
  // Only render charts after the component has mounted in the browser.
  // Recharts uses DOM measurements; on the server there is no DOM so width = -1.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await invoicesApi.analytics();
      return res.data;
    }
  });

  if (isLoading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading analytics...</div>;
  if (!analytics) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>No data available yet.</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Spending Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Visualize your expenses and discover spending trends.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Spent (This Month)</div>
          <div className="stat-value gradient-text">{analytics.totalThisMonth.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Invoices Scanned</div>
          <div className="stat-value">{analytics.totalInvoices}</div>
        </div>
      </div>

      {/* Charts — only rendered after mount so the DOM has real dimensions */}
      {mounted && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Bar Chart */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Monthly Spending</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8 }}
                  itemStyle={{ color: 'var(--text)' }}
                  formatter={(v: any) => [v.toLocaleString(), 'Amount']}
                />
                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Expense by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="category"
                >
                  {analytics.categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v: any) => [v.toLocaleString(), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 16 }}>
              {analytics.categoryBreakdown.map((entry: any, index: number) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                  <span style={{ color: 'var(--text-muted)' }}>{entry.category}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
