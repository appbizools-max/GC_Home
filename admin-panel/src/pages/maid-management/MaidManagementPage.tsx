import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Clock, CheckCircle2, Star, FileText } from 'lucide-react';
import { DocumentModal } from '../../components/DocumentModal';

export const MaidManagementPage: React.FC = () => {
  const { maids, setSelectedMaidForReview } = useAdmin();
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'all'>('pending');

  const pendingList = maids.filter(m => m.status === 'pending');
  const approvedList = maids.filter(m => m.status === 'approved');

  const filtered = maids.filter(m => {
    if (activeSubTab === 'pending') return m.status === 'pending';
    if (activeSubTab === 'approved') return m.status === 'approved';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, background: '#FFFFFF', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <button
          onClick={() => setActiveSubTab('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeSubTab === 'pending' ? '#FEF3C7' : 'transparent',
            color: activeSubTab === 'pending' ? '#D97706' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Clock size={16} /> Pending Approvals ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('approved')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeSubTab === 'approved' ? '#DCFCE7' : 'transparent',
            color: activeSubTab === 'approved' ? '#166534' : '#64748B',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <CheckCircle2 size={16} /> Active Roster ({approvedList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: activeSubTab === 'all' ? '#F1F5F9' : 'transparent',
            color: activeSubTab === 'all' ? '#0F172A' : '#64748B'
          }}
        >
          All Applications ({maids.length})
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Maid Partner</th>
              <th>Contact</th>
              <th>Primary Locality</th>
              <th>Status</th>
              <th>Rating & Jobs</th>
              <th>Applied Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.uid}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={m.photoUrl} alt={m.fullName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>{m.fullName}</strong>
                      <span style={{ fontSize: 11, color: '#64748B' }}>Aadhaar: Verified</span>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{m.phone}</td>
                <td style={{ fontSize: 13 }}>{m.serviceArea} ({m.serviceRadiusKm} km)</td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: m.status === 'approved' ? '#DCFCE7' : (m.status === 'pending' ? '#FEF3C7' : '#FEE2E2'),
                    color: m.status === 'approved' ? '#166534' : (m.status === 'pending' ? '#92400E' : '#991B1B'),
                    textTransform: 'capitalize'
                  }}>
                    {m.status}
                  </span>
                </td>
                <td>
                  {m.status === 'approved' ? (
                    <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" /> {m.rating} ({m.completedJobsCount} jobs)
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>N/A</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: '#64748B' }}>{m.appliedAt}</td>
                <td>
                  <button
                    onClick={() => setSelectedMaidForReview(m)}
                    style={{
                      padding: '6px 12px',
                      background: m.status === 'pending' ? '#1E4E3D' : '#F1F5F9',
                      color: m.status === 'pending' ? 'white' : '#334155',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FileText size={14} /> Review Documents
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DocumentModal />
    </div>
  );
};
