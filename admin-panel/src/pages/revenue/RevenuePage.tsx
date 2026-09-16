import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Download } from 'lucide-react';

export const RevenuePage: React.FC = () => {
  const { bookings, maids } = useAdmin();

  const totalGross = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPlatformCommission = Math.round(totalGross * 0.2);
  const totalMaidPayouts = Math.round(totalGross * 0.8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #1E4E3D 0%, #2D8A68 100%)', color: 'white', padding: 20, borderRadius: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, textTransform: 'uppercase' }}>TOTAL GROSS BOOKING VALUE</span>
          <h3 style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: '#FFFFFF' }}>₹{totalGross.toLocaleString()}</h3>
          <span style={{ fontSize: 12, opacity: 0.9, display: 'block', marginTop: 4 }}>Across all service packages</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PLATFORM COMMISSION (20%)</span>
          <h3 style={{ fontSize: 32, fontWeight: 800, color: '#1E4E3D', marginTop: 4 }}>₹{totalPlatformCommission.toLocaleString()}</h3>
          <span style={{ fontSize: 12, color: '#166534', fontWeight: 600, display: 'block', marginTop: 4 }}>Net Revenue Earned</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>TOTAL MAID PAYOUTS (80%)</span>
          <h3 style={{ fontSize: 32, fontWeight: 800, color: '#075985', marginTop: 4 }}>₹{totalMaidPayouts.toLocaleString()}</h3>
          <span style={{ fontSize: 12, color: '#0369A1', fontWeight: 600, display: 'block', marginTop: 4 }}>Disbursed / Pending Payouts</span>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Per-Maid Partner Payout Ledger</h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>Breakdown of completed job earnings and pending payouts</span>
          </div>

          <button
            onClick={() => alert('Exporting CSV revenue dataset...')}
            style={{ padding: '8px 14px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Export CSV Report
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Maid Partner</th>
                <th>Bank Account</th>
                <th>Completed Jobs</th>
                <th>Gross Generated</th>
                <th>Maid Payout (80%)</th>
                <th>Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {maids.filter(m => m.status === 'approved').map(m => (
                <tr key={m.uid}>
                  <td>
                    <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>{m.fullName}</strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{m.phone}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#334155' }}>
                    {m.bankDetails.bankName}<br />
                    <span style={{ color: '#2D8A68' }}>A/C: {m.bankDetails.accountNumber}</span>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 700 }}>{m.completedJobsCount} Jobs</td>
                  <td style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>₹{(m.completedJobsCount * 750).toLocaleString()}</td>
                  <td style={{ fontSize: 15, fontWeight: 800, color: '#1E4E3D' }}>₹{(m.completedJobsCount * 600).toLocaleString()}</td>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#166534' }}>
                      Ready for Disbursement
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
