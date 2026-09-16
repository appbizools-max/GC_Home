import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, UserCheck, ShieldCheck, DollarSign, Calendar, ArrowRight } from 'lucide-react';

export const BecomeMaidInfoScreen: React.FC = () => {
  const { navigateTo } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigateTo('customer_home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>Join as a Maid Partner</h2>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #1E4E3D 0%, #2D8A68 100%)',
        borderRadius: 16,
        padding: 20,
        color: 'white',
        textAlign: 'center'
      }}>
        <UserCheck size={48} style={{ margin: '0 auto 10px auto', opacity: 0.9 }} />
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>Earn up to ₹30,000 / month</h3>
        <p style={{ fontSize: 13, opacity: 0.9 }}>Flexible working hours, weekly bank payouts, and insurance coverage.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { icon: DollarSign, title: 'Weekly Direct Bank Payouts', desc: 'Get paid guaranteed every Monday directly to your bank account.' },
          { icon: Calendar, title: 'Choose Your Own Hours', desc: 'Work full-time or part-time in your preferred locality radius.' },
          { icon: ShieldCheck, title: 'Health & Safety First', desc: 'Safety protocols, health declarations, and free eco-friendly cleaning kits.' }
        ].map((b, idx) => {
          const IconComponent = b.icon;
          return (
            <div key={idx} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#EBF8F2',
                color: '#2D8A68',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconComponent size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{b.title}</h4>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{b.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn-primary"
        onClick={() => navigateTo('maid_registration_form')}
        style={{ marginTop: 8 }}
      >
        Fill Maid Partner Application <ArrowRight size={18} />
      </button>
    </div>
  );
};
