import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, UserCheck, User, Briefcase, DollarSign } from 'lucide-react';

export const BottomTabs: React.FC = () => {
  const { user, maidProfile, currentScreen, navigateTo } = useAuth();

  if (!user || currentScreen === 'login') return null;

  const isMaidApproved = user.role === 'maid' && maidProfile?.status === 'approved';

  if (isMaidApproved) {
    return (
      <div className="bottom-nav">
        <button
          className={`nav-item ${currentScreen === 'maid_home' ? 'active' : ''}`}
          onClick={() => navigateTo('maid_home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        <button
          className={`nav-item ${currentScreen === 'job_requests' ? 'active' : ''}`}
          onClick={() => navigateTo('job_requests')}
        >
          <Briefcase size={20} />
          <span>Requests</span>
        </button>

        <button
          className={`nav-item ${currentScreen === 'my_jobs' ? 'active' : ''}`}
          onClick={() => navigateTo('my_jobs')}
        >
          <Calendar size={20} />
          <span>My Jobs</span>
        </button>

        <button
          className={`nav-item ${currentScreen === 'earnings' ? 'active' : ''}`}
          onClick={() => navigateTo('earnings')}
        >
          <DollarSign size={20} />
          <span>Earnings</span>
        </button>

        <button
          className={`nav-item ${currentScreen === 'maid_profile' ? 'active' : ''}`}
          onClick={() => navigateTo('maid_profile')}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </div>
    );
  }

  // Customer Bottom Navigation
  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${currentScreen === 'customer_home' ? 'active' : ''}`}
        onClick={() => navigateTo('customer_home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        className={`nav-item ${currentScreen === 'my_bookings' ? 'active' : ''}`}
        onClick={() => navigateTo('my_bookings')}
      >
        <Calendar size={20} />
        <span>Bookings</span>
      </button>

      {user.maidApplicationStatus === 'none' && (
        <button
          className={`nav-item ${currentScreen === 'become_maid_info' ? 'active' : ''}`}
          onClick={() => navigateTo('become_maid_info')}
        >
          <UserCheck size={20} />
          <span>Become Maid</span>
        </button>
      )}

      {(user.maidApplicationStatus === 'pending' || user.maidApplicationStatus === 'rejected') && (
        <button
          className={`nav-item ${currentScreen === 'maid_status' ? 'active' : ''}`}
          onClick={() => navigateTo('maid_status')}
        >
          <UserCheck size={20} />
          <span>Maid Status</span>
        </button>
      )}

      <button
        className={`nav-item ${currentScreen === 'user_profile' ? 'active' : ''}`}
        onClick={() => navigateTo('user_profile')}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </div>
  );
};
