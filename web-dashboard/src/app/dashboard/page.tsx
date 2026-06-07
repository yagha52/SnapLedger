'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api';
import { useState } from 'react';
import { Search, Trash2, Download, Edit2 } from 'lucide-react';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', search],
    queryFn: async () => {
      const res = await invoicesApi.getAll({ search });
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setDeletingId(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: any }) => invoicesApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setEditId(null);
    }
  });

  const handleSaveEdit = (id: number) => {
    updateMutation.mutate({ id, payload: editForm });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const handleExportCSV = () => {
    if (!invoices || invoices.length === 0) return;
    const headers = ['Date', 'Merchant', 'Category', 'Total Amount', 'Currency'];
    const rows = invoices.map((inv: any) => [
      new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString(),
      `"${(inv.merchantName || '').replace(/"/g, '""')}"`,
      `"${inv.category || ''}"`,
      inv.totalAmount || 0,
      inv.currency || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'snapledger_invoices.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Food & Dining': return 'badge-yellow';
      case 'Transport': return 'badge-purple';
      case 'Health': return 'badge-green';
      case 'Shopping': return 'badge-red';
      case 'Entertainment': return 'badge-purple';
      case 'Utilities': return 'badge-gray';
      case 'Education': return 'badge-green';
      case 'Travel': return 'badge-yellow';
      default: return 'badge-gray';
    }
  };

  const total = invoices?.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0) ?? 0;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Invoices</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and view all your scanned bills.</p>
        </div>
        {/* Summary pill instead of the dummy button */}
        {invoices && invoices.length > 0 && (
          <div className="stat-card" style={{ padding: '12px 24px', margin: 0 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{invoices.length} invoices · Total: </span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {total.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search merchants..."
              style={{ paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            className="btn-outline" 
            onClick={handleExportCSV} 
            disabled={!invoices || invoices.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Total Amount</th>
                <th>Receipt</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
              ) : invoices?.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No invoices found. Scan a bill on the mobile app!</td></tr>
              ) : (
                invoices?.map((inv: any) => {
                  if (editId === inv.id) {
                    return (
                      <tr key={inv.id} style={{ background: 'var(--surface-light)' }}>
                        <td>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</td>
                        <td>
                          <input className="input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.merchantName || ''} onChange={e => setEditForm({...editForm, merchantName: e.target.value})} />
                        </td>
                        <td>
                          <select className="input" style={{ padding: '6px 10px', fontSize: 13 }} value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                            <option value="Food & Dining">Food & Dining</option>
                            <option value="Transport">Transport</option>
                            <option value="Health">Health</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Education">Education</option>
                            <option value="Travel">Travel</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="number" className="input" style={{ width: 100, padding: '6px 10px', fontSize: 13 }} value={editForm.totalAmount || ''} onChange={e => setEditForm({...editForm, totalAmount: parseFloat(e.target.value)})} />
                            <input className="input" style={{ width: 60, padding: '6px 10px', fontSize: 13 }} value={editForm.currency || ''} onChange={e => setEditForm({...editForm, currency: e.target.value})} />
                          </div>
                        </td>
                        <td>-</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 13, minWidth: 60, justifyContent: 'center' }} onClick={() => handleSaveEdit(inv.id)}>Save</button>
                            <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 13, minWidth: 60, justifyContent: 'center' }} onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={inv.id} style={{ opacity: deletingId === inv.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                      <td>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{inv.merchantName || 'Unknown'}</td>
                      <td>
                        <span className={`badge ${getCategoryColor(inv.category)}`}>
                          {inv.category || 'Other'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {inv.totalAmount ? `${Number(inv.totalAmount).toLocaleString()} ${inv.currency}` : '-'}
                      </td>
                      <td>
                        {inv.imageUrl ? (
                          <a href={inv.imageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>View Image</a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No image</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => { setEditId(inv.id); setEditForm(inv); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '6px', borderRadius: 6,
                            marginRight: 8, transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-light)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          title="Edit invoice"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#ff4d6d', padding: '6px', borderRadius: 6,
                            opacity: deletingId === inv.id ? 0.5 : 1,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,77,109,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          title="Delete invoice"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
