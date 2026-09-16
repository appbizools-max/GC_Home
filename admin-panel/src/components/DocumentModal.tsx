import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { X, CheckCircle2, XCircle, ShieldCheck, FileText, Landmark, MapPin, Phone } from 'lucide-react';

export const DocumentModal: React.FC = () => {
  const { selectedMaidForReview, setSelectedMaidForReview, approveMaid, rejectMaid } = useAdmin();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!selectedMaidForReview) return null;

  const m = selectedMaidForReview;

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejectMaid(m.uid, rejectionReason || 'Government ID proof unreadable.');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#FFFFFF',
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        borderRadius: 20,
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', background: '#1E4E3D', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#BBE9D2', color: '#1E4E3D', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
              Maid Application Review
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 4, color: '#FFFFFF' }}>{m.fullName}</h3>
          </div>
          <button onClick={() => setSelectedMaidForReview(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile & Contact Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'center', background: '#F8FAFC', padding: 16, borderRadius: 12 }}>
            <img src={m.photoUrl} alt={m.fullName} style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'cover' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div><Phone size={14} color="#2D8A68" style={{ display: 'inline', marginRight: 6 }} /> <strong>Mobile:</strong> {m.phone}</div>
              <div><MapPin size={14} color="#2D8A68" style={{ display: 'inline', marginRight: 6 }} /> <strong>Address:</strong> {m.address}</div>
              <div><strong>Primary Locality:</strong> {m.serviceArea} ({m.serviceRadiusKm} km radius)</div>
              <div><strong>Applied Date:</strong> {m.appliedAt}</div>
            </div>
          </div>

          {/* Document Verification Grid */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Uploaded Verification Documents</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid #E2E8F0', padding: 12, borderRadius: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Government ID (Aadhaar Card)</span>
                <img src={m.idProofUrl} alt="Govt ID" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8 }} />
              </div>

              <div style={{ border: '1px solid #E2E8F0', padding: 12, borderRadius: 12, background: '#F8FAFC' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Bank Payout Account</span>
                <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><strong>Holder:</strong> {m.bankDetails.accountName}</div>
                  <div><strong>Account No:</strong> {m.bankDetails.accountNumber}</div>
                  <div><strong>IFSC:</strong> {m.bankDetails.ifscCode}</div>
                  <div><strong>Bank:</strong> {m.bankDetails.bankName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Safety Declaration */}
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} color="#166534" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
              ✓ Physical Fitness & Health Chemical Safety Declaration Signed by Maid
            </span>
          </div>

          {/* Reject Form Input */}
          {showRejectForm && (
            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#FEF2F2', padding: 14, borderRadius: 10, border: '1px solid #FCA5A5' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>Enter Rejection Reason for Maid:</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Government ID photo is blurred. Please upload a clear photo of your Aadhaar."
                required
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: '8px', background: '#991B1B', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Confirm Rejection
                </button>
                <button type="button" onClick={() => setShowRejectForm(false)} style={{ padding: '8px 12px', background: '#E2E8F0', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Action Buttons */}
          {!showRejectForm && (
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button
                onClick={() => approveMaid(m.uid)}
                style={{ flex: 1, padding: '14px', background: '#166534', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <CheckCircle2 size={18} /> Approve Maid Application
              </button>

              <button
                onClick={() => setShowRejectForm(true)}
                style={{ flex: 1, padding: '14px', background: '#991B1B', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <XCircle size={18} /> Reject Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
