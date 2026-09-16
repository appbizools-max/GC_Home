import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle2, Clock, Plus, Minus, ArrowRight } from 'lucide-react';

export const ServiceDetailsScreen: React.FC = () => {
  const { selectedService, navigateTo } = useAuth();
  const [roomsCount, setRoomsCount] = useState(2);

  if (!selectedService) {
    navigateTo('customer_home');
    return null;
  }

  const pricePerExtraRoom = selectedService.pricePerRoom || 150;
  const totalPrice = selectedService.startingPrice + (roomsCount > 1 ? (roomsCount - 1) * pricePerExtraRoom : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigateTo('customer_home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#1E293B" />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>{selectedService.name}</h2>
      </div>

      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 180 }}>
        <img
          src={selectedService.imageUrl}
          alt={selectedService.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          padding: '4px 10px',
          borderRadius: 8,
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Clock size={14} /> Duration: {selectedService.estimatedDuration}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Service Overview</h3>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: '1.5' }}>
          {selectedService.description}
        </p>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700 }}>Select Home Size (BHK / Rooms)</h4>
          <span style={{ fontSize: 12, color: '#64748B' }}>+₹{pricePerExtraRoom} per additional room</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F1F5F9', padding: '4px 10px', borderRadius: 10 }}>
          <button
            onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Minus size={16} color="#1E293B" />
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1E4E3D', minWidth: 20, textAlign: 'center' }}>
            {roomsCount}
          </span>
          <button
            onClick={() => setRoomsCount(roomsCount + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Plus size={16} color="#1E293B" />
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>What's Included</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedService.features.map((feature, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2 size={16} color="#2D8A68" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#334155' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 10,
        padding: 16,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>TOTAL PRICE</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1E4E3D' }}>₹{totalPrice}</span>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigateTo('booking_screen', { service: selectedService, roomsCount, totalPrice })}
          style={{ width: 'auto', padding: '12px 24px' }}
        >
          Book Now <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
