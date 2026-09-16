import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Sparkles, MapPin, ChevronRight, UserCheck } from 'lucide-react';

export const CustomerHomeScreen: React.FC = () => {
  const { services, navigateTo, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Location Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={18} color="#2D8A68" />
          <div>
            <span style={{ fontSize: 11, color: '#6B7280', display: 'block' }}>DELIVERING TO</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Bellandur, Bengaluru</span>
          </div>
        </div>
        {user?.maidApplicationStatus === 'none' && (
          <button
            onClick={() => navigateTo('become_maid_info')}
            style={{
              padding: '6px 12px',
              background: '#EBF8F2',
              border: '1px solid #BBE9D2',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              color: '#1E4E3D',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            <UserCheck size={14} /> Earn with Us
          </button>
        )}
      </div>

      {/* Promotional Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E4E3D 0%, #2D8A68 100%)',
        borderRadius: 16,
        padding: '18px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(45, 138, 104, 0.25)'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '75%' }}>
          <span style={{ fontSize: 10, fontWeight: 800, background: '#BBE9D2', color: '#1E4E3D', padding: '3px 8px', borderRadius: 10, textTransform: 'uppercase' }}>
            GC Guarantee
          </span>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginTop: 8, marginBottom: 4, color: '#FFFFFF' }}>
            Genuine & Care Home Cleaning
          </h3>
          <p style={{ fontSize: 12, opacity: 0.9 }}>
            Verified background-checked maids with eco-safe chemicals.
          </p>
        </div>
        <Sparkles size={80} style={{ position: 'absolute', right: -10, bottom: -15, opacity: 0.15 }} />
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: 12 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search cleaning services (Basic, Deep Clean)..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            fontSize: 13,
            outline: 'none',
            background: '#FFFFFF'
          }}
        />
      </div>

      {/* Service List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Cleaning Packages</h3>
          <span style={{ fontSize: 12, color: '#2D8A68', fontWeight: 600 }}>{filteredServices.length} Services</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredServices.map(service => (
            <div
              key={service.serviceId}
              className="card"
              onClick={() => navigateTo('service_details', { service })}
              style={{
                display: 'flex',
                gap: 14,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                padding: 12
              }}
            >
              <img
                src={service.imageUrl}
                alt={service.name}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 12,
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{service.name}</h4>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: '#F1F5F9', borderRadius: 6, color: '#475569' }}>
                      {service.estimatedDuration}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {service.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>STARTS FROM</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#2D8A68' }}>₹{service.startingPrice}</span>
                  </div>
                  <button
                    style={{
                      padding: '6px 12px',
                      background: '#1E4E3D',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer'
                    }}
                  >
                    View <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
