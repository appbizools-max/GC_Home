import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { services, toggleServiceActive, addService, deleteService } = useAdmin();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Standard');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState(699);
  const [estimatedDuration, setEstimatedDuration] = useState('2 hrs');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addService({
      name,
      category,
      description,
      startingPrice: Number(startingPrice),
      estimatedDuration,
      imageUrl,
      isActive: true,
      features: ['Sweeping & Mopping', 'Surface dusting', 'Trash disposal']
    });
    setShowAddModal(false);
    setName('');
    setDescription('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Cleaning Service Catalog</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>Manage prices, active visibility, and service features shown in Customer App</span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 18px',
            background: '#1E4E3D',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Plus size={16} /> Add New Service Package
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Starting Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.serviceId}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={s.imageUrl} alt={s.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>{s.name}</strong>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{s.description.substring(0, 45)}...</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: 6 }}>
                    {s.category}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: '#334155' }}>{s.estimatedDuration}</td>
                <td style={{ fontSize: 15, fontWeight: 800, color: '#1E4E3D' }}>₹{s.startingPrice}</td>
                <td>
                  <button
                    onClick={() => toggleServiceActive(s.serviceId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: s.isActive ? '#DCFCE7' : '#F1F5F9',
                      color: s.isActive ? '#166534' : '#64748B'
                    }}
                  >
                    {s.isActive ? <ToggleRight size={18} color="#166534" /> : <ToggleLeft size={18} color="#64748B" />}
                    {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => deleteService(s.serviceId)}
                      style={{ padding: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 6, cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleCreate} style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Add New Cleaning Service</h3>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Service Name (e.g. Balcony Deep Clean)"
              required
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short Description of cleaning inclusions..."
              required
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                type="number"
                value={startingPrice}
                onChange={e => setStartingPrice(Number(e.target.value))}
                placeholder="Starting Price ₹"
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
              <input
                type="text"
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(e.target.value)}
                placeholder="Duration (e.g. 2 hrs)"
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: '#1E4E3D', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Save & Enable Service
              </button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '12px 18px', background: '#E2E8F0', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
