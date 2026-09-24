import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { GCLogo } from './common/GCLogo';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  DollarSign,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bell,
  BarChart2,
  UserCheck,
  MessageSquare,
  MapPin,
  Compass
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    logoutAdmin,
    getDashboardMetrics,
    sidebarCollapsed,
    toggleSidebarCollapse
  } = useAdmin();

  const metrics = getDashboardMetrics();
  const [bookingsExpanded, setBookingsExpanded] = useState(true);
  const [maidsExpanded, setMaidsExpanded] = useState(true);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [financialsExpanded, setFinancialsExpanded] = useState(false);

  const isBookingActive = (tabId: string) => currentTab === tabId;

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } bg-[#123D2A] text-white flex flex-col h-screen flex-shrink-0 font-sans select-none transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden no-scrollbar`}
    >
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-emerald-900/60 flex items-center justify-between min-h-[64px]">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <GCLogo size={36} />
              <div>
                <h1 className="text-base font-black text-white tracking-wider flex items-center gap-1">
                  GC HOME<span className="text-[#C9A227]">+</span>
                </h1>
                <p className="text-[10px] text-emerald-200/80 font-medium">
                  Clean Homes. Happier Families.
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebarCollapse}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full gap-1">
            <button
              onClick={toggleSidebarCollapse}
              title="Expand Sidebar"
              className="w-10 h-10 rounded-xl hover:opacity-90 flex items-center justify-center transition-all cursor-pointer"
            >
              <GCLogo size={34} compact />
            </button>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 flex flex-col gap-1 text-sm">
        {/* 1. Dashboard */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          title={sidebarCollapsed ? "Dashboard" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'dashboard'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Dashboard</span>}
        </button>

        {/* 2. Dispatch */}
        <button
          onClick={() => setCurrentTab('dispatch')}
          title={sidebarCollapsed ? "Dispatch" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'dispatch'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <Compass className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Dispatch</span>}
        </button>

        {/* 3. Bookings (Collapsible) */}
        <div>
          <button
            onClick={() => {
              if (sidebarCollapsed) toggleSidebarCollapse();
              setBookingsExpanded(!bookingsExpanded);
            }}
            title={sidebarCollapsed ? "Bookings" : undefined}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              currentTab.includes('booking')
                ? 'bg-[#184a34] text-white'
                : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <Calendar className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
              {!sidebarCollapsed && <span>Bookings</span>}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                {(metrics.pendingAssignmentsCount || 0) > 0 && (
                  <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {metrics.pendingAssignmentsCount}
                  </span>
                )}
                {bookingsExpanded ? (
                  <ChevronDown className="w-4 h-4 text-emerald-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-emerald-300" />
                )}
              </div>
            )}
          </button>

          {/* Bookings Submenu */}
          {bookingsExpanded && !sidebarCollapsed && (
            <div className="pl-8 pt-1 flex flex-col gap-1 text-xs">
              <button
                onClick={() => setCurrentTab('all-bookings')}
                className={`w-full text-left py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isBookingActive('all-bookings')
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <span>All Bookings</span>
              </button>

              <button
                onClick={() => setCurrentTab('pending-bookings')}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isBookingActive('pending-bookings')
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <span>New / Pending</span>
                {(metrics.pendingAssignmentsCount || 0) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('ongoing-bookings')}
                className={`w-full text-left py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isBookingActive('ongoing-bookings')
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <span>Ongoing</span>
              </button>

              <button
                onClick={() => setCurrentTab('completed-bookings')}
                className={`w-full text-left py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isBookingActive('completed-bookings')
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <span>Completed</span>
              </button>

              <button
                onClick={() => setCurrentTab('cancelled-bookings')}
                className={`w-full text-left py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isBookingActive('cancelled-bookings')
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <span>Cancelled</span>
              </button>

              <button
                onClick={() => setCurrentTab('rescheduled-bookings')}
                className={`w-full text-left py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isBookingActive('rescheduled-bookings')
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <span>Rescheduled</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Partners (Collapsible) */}
        <div>
          <button
            onClick={() => {
              if (sidebarCollapsed) toggleSidebarCollapse();
              setMaidsExpanded(!maidsExpanded);
            }}
            title={sidebarCollapsed ? "Partners" : undefined}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              currentTab.includes('maid') || currentTab === 'maids' || currentTab === 'pending-approvals' || currentTab === 'pending-kyc'
                ? 'bg-[#184a34] text-white shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <UserCheck className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
              {!sidebarCollapsed && <span>Partners</span>}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                {(metrics.pendingMaidApprovalsCount || 0) > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {metrics.pendingMaidApprovalsCount}
                  </span>
                )}
                {maidsExpanded ? (
                  <ChevronDown className="w-4 h-4 text-emerald-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-emerald-300" />
                )}
              </div>
            )}
          </button>

          {/* Submenu */}
          {maidsExpanded && !sidebarCollapsed && (
            <div className="pl-8 pt-1 flex flex-col gap-1 text-xs">
              <button
                onClick={() => setCurrentTab('maids')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'maids' || currentTab === 'all-maids'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                All Partners
              </button>

              <button
                onClick={() => setCurrentTab('pending-approvals')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'pending-approvals' || currentTab === 'pending-maid-details'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Pending Approvals
              </button>

              <button
                onClick={() => setCurrentTab('pending-kyc')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'pending-kyc'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Pending KYC
              </button>

              <button
                onClick={() => setCurrentTab('active-maids')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'active-maids'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Active Partners
              </button>

              <button
                onClick={() => setCurrentTab('inactive-maids')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'inactive-maids'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Inactive Partners
              </button>
            </div>
          )}
        </div>

        {/* 5. Customers */}
        <button
          onClick={() => setCurrentTab('customers')}
          title={sidebarCollapsed ? "Customers" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'customers'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <Users className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Customers</span>}
        </button>

        {/* 6. Services Catalog (Collapsible) */}
        <div>
          <button
            onClick={() => {
              if (sidebarCollapsed) toggleSidebarCollapse();
              setServicesExpanded(!servicesExpanded);
              if (currentTab !== 'services' && currentTab !== 'service-categories' && currentTab !== 'service-addons') {
                setCurrentTab('services');
              }
            }}
            title={sidebarCollapsed ? "Services Catalog" : undefined}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              currentTab.includes('service') || currentTab === 'categories' || currentTab === 'addons'
                ? 'bg-[#184a34] text-white shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <Sparkles className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
              {!sidebarCollapsed && <span>Services Catalog</span>}
            </div>
            {!sidebarCollapsed && (
              servicesExpanded ? (
                <ChevronDown className="w-4 h-4 text-emerald-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-emerald-300" />
              )
            )}
          </button>

          {/* Services Submenu */}
          {servicesExpanded && !sidebarCollapsed && (
            <div className="pl-8 pt-1 flex flex-col gap-1 text-xs">
              <button
                onClick={() => setCurrentTab('service-categories')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'service-categories' || currentTab === 'categories'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Categories
              </button>

              <button
                onClick={() => setCurrentTab('services')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'services'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Services
              </button>

              <button
                onClick={() => setCurrentTab('service-addons')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'service-addons' || currentTab === 'addons'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Add-ons
              </button>
            </div>
          )}
        </div>

        {/* 7. Service Areas */}
        <button
          onClick={() => setCurrentTab('service-areas')}
          title={sidebarCollapsed ? "Service Areas" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'service-areas' || currentTab === 'service_areas'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <MapPin className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Service Areas</span>}
        </button>

        {/* 8. Chat / Support */}
        <button
          onClick={() => setCurrentTab('chat')}
          title={sidebarCollapsed ? "Chat / Support" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'chat' || currentTab === 'chat-management'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Chat / Support</span>}
        </button>

        {/* 9. Financials (Collapsible) */}
        <div>
          <button
            onClick={() => {
              if (sidebarCollapsed) toggleSidebarCollapse();
              setFinancialsExpanded(!financialsExpanded);
            }}
            title={sidebarCollapsed ? "Financials" : undefined}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
              currentTab === 'financials' || currentTab === 'payment-reports' || currentTab === 'partner-payouts' || currentTab === 'transactions' || currentTab === 'revenue'
                ? 'bg-[#184a34] text-white shadow-sm'
                : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
            }`}
          >
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <DollarSign className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
              {!sidebarCollapsed && <span>Financials</span>}
            </div>
            {!sidebarCollapsed && (
              financialsExpanded ? (
                <ChevronDown className="w-4 h-4 text-emerald-300" />
              ) : (
                <ChevronRight className="w-4 h-4 text-emerald-300" />
              )
            )}
          </button>

          {/* Financials Submenu */}
          {financialsExpanded && !sidebarCollapsed && (
            <div className="pl-8 pt-1 flex flex-col gap-1 text-xs">
              <button
                onClick={() => setCurrentTab('payment-reports')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'payment-reports' || currentTab === 'payments'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Payments
              </button>

              <button
                onClick={() => setCurrentTab('partner-payouts')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'partner-payouts' || currentTab === 'payouts'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Partner Payouts
              </button>

              <button
                onClick={() => setCurrentTab('transactions')}
                className={`w-full text-left py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'transactions' || currentTab === 'revenue'
                    ? 'bg-emerald-800/60 text-white font-bold'
                    : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                Transactions
              </button>
            </div>
          )}
        </div>

        {/* 10. Notifications */}
        <button
          onClick={() => setCurrentTab('notifications')}
          title={sidebarCollapsed ? "Notifications" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'notifications'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Bell className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
            {!sidebarCollapsed && <span>Notifications</span>}
          </div>
          {!sidebarCollapsed && (
            <span className="bg-rose-500 text-white w-4.5 h-4.5 rounded-full text-[10px] font-extrabold flex items-center justify-center">
              3
            </span>
          )}
        </button>

        {/* 11. Reports */}
        <button
          onClick={() => setCurrentTab('reports')}
          title={sidebarCollapsed ? "Reports" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'reports'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Reports</span>}
        </button>

        {/* 12. Settings */}
        <button
          onClick={() => setCurrentTab('settings')}
          title={sidebarCollapsed ? "Settings" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          } py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-[#184a34] text-white shadow-sm'
              : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
          }`}
        >
          <Settings className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>
      </nav>

      {/* User Profile & Logout */}
      <div className="px-3 py-3 border-t border-emerald-900/60 flex items-center justify-between">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                AP
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Admin</div>
                <div className="text-[10px] text-emerald-300 font-semibold">Super Admin</div>
              </div>
            </div>

            <button
              onClick={logoutAdmin}
              title="Logout"
              className="text-emerald-200 hover:text-rose-400 p-2 rounded-lg hover:bg-emerald-900/50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-extrabold text-xs shadow-sm" title="Super Admin">
              AP
            </div>
            <button
              onClick={logoutAdmin}
              title="Logout"
              className="text-emerald-200 hover:text-rose-400 p-1.5 rounded-lg hover:bg-emerald-900/50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
