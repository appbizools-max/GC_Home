import https from 'https';

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

function querySupabase(path) {
  return new Promise((resolve) => {
    const req = https.get(SUPABASE_URL + path, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: null });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
  });
}

// Router simulation mirroring App.tsx
function simulateRouterView({ user, maidProfile, requestedScreen }) {
  const isPartnerUser = user?.role === 'maid' || user?.role === 'partner' || (maidProfile?.status === 'approved' && user?.maidApplicationStatus === 'approved');
  const isPartnerApproved = isPartnerUser && (maidProfile?.status === 'approved' || user?.maidApplicationStatus === 'approved');

  // 1. Unauthenticated
  if (!user) {
    const allowed = ['splash', 'login', 'otp', 'otp_verification', 'profile_setup', 'complete_profile', 'become_maid_info', 'maid_registration_form', 'help'];
    return allowed.includes(requestedScreen) ? requestedScreen : 'login';
  }

  // 2. Partner / Maid
  if (isPartnerUser) {
    if (isPartnerApproved) {
      const allowedPartner = ['splash', 'login', 'maid_home', 'active_job', 'my_jobs', 'earnings', 'maid_profile', 'help', 'notifications'];
      return allowedPartner.includes(requestedScreen) ? requestedScreen : 'maid_home';
    } else {
      const allowedPending = ['splash', 'login', 'maid_status', 'become_maid_info', 'maid_registration_form', 'help'];
      return allowedPending.includes(requestedScreen) ? requestedScreen : 'become_maid_info';
    }
  }

  // 3. Customer
  const customerAllowed = [
    'splash', 'login', 'otp', 'otp_verification', 'profile_setup', 'complete_profile',
    'customer_home', 'home', 'services_listing', 'service_details', 'cart_summary',
    'related_addons', 'checkout_schedule', 'address_confirmation', 'booking_summary',
    'payment', 'booking_confirmation', 'booking_tracking', 'service_completed',
    'rating_review', 'my_bookings', 'offers', 'notifications', 'help', 'user_profile',
    'become_maid_info', 'maid_registration_form', 'maid_status'
  ];
  return customerAllowed.includes(requestedScreen) ? requestedScreen : 'customer_home';
}

// Session check simulation mirroring AuthContext.tsx checkExistingSession
function determineInitialScreen({ sessionUser, dbUser, dbMaid }) {
  if (!sessionUser) return 'login';

  let authoritativeRole = sessionUser.role || 'customer';
  let maidStatus = sessionUser.maidApplicationStatus || 'none';

  if (dbUser) {
    authoritativeRole = dbUser.role || authoritativeRole;
    maidStatus = dbUser.maid_application_status || maidStatus;
  }

  if (dbMaid) {
    maidStatus = dbMaid.status || 'pending';
    if (dbMaid.status === 'approved') {
      authoritativeRole = 'maid';
    }
  }

  if (authoritativeRole === 'maid' || authoritativeRole === 'partner' || dbMaid) {
    return maidStatus === 'approved' ? 'maid_home' : 'maid_status';
  }
  return 'customer_home';
}

async function runTestSuite() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  GC HOME+ Role-Based Routing & Session Persistence Test Suite    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  }

  // ── TEST 1: Live DB Profile Verification ──
  console.log('━━━ TEST 1: Live Supabase Database Profiles ━━━');
  const ramuRes = await querySupabase('/rest/v1/user_profiles?phone=eq.%2B91%209885759886&select=id,name,role,phone');
  assert(ramuRes.status === 200 && ramuRes.body.length > 0, 'Customer Ramu exists in user_profiles', `Role: ${ramuRes.body[0]?.role}`);
  assert(ramuRes.body[0]?.role === 'customer', 'Ramu has role customer');

  const salmanRes = await querySupabase('/rest/v1/maid_profiles?phone=eq.7842836959&select=id,full_name,status,phone');
  assert(salmanRes.status === 200 && salmanRes.body.length > 0, 'Partner Salman exists in maid_profiles', `Status: ${salmanRes.body[0]?.status}`);
  assert(salmanRes.body[0]?.status === 'approved', 'Salman has status approved');

  const pavaniRes = await querySupabase('/rest/v1/maid_profiles?id=eq.2e616063-1f75-455c-8000-b143ddfc4914&select=id,full_name,status');
  assert(pavaniRes.status === 200 && pavaniRes.body.length > 0, 'Partner Pavani exists in maid_profiles', `Status: ${pavaniRes.body[0]?.status}`);
  assert(pavaniRes.body[0]?.status === 'approved', 'Pavani has status approved');

  // ── TEST 2: Cold Launch Startup Routing ──
  console.log('\n━━━ TEST 2: Cold Startup Session Persistence ━━━');
  const coldCustomer = determineInitialScreen({
    sessionUser: { uid: ramuRes.body[0].id, name: 'Ramu', phone: '+91 9885759886', role: 'customer' },
    dbUser: ramuRes.body[0],
    dbMaid: null,
  });
  assert(coldCustomer === 'customer_home', 'Cold launch with customer session opens customer_home directly (no login)');

  const coldPartner = determineInitialScreen({
    sessionUser: { uid: salmanRes.body[0].id, name: 'Salman', phone: '+91 7842836959', role: 'maid' },
    dbUser: { role: 'maid' },
    dbMaid: salmanRes.body[0],
  });
  assert(coldPartner === 'maid_home', 'Cold launch with approved partner session opens maid_home directly (no login, no customer pages)');

  const coldPendingPartner = determineInitialScreen({
    sessionUser: { uid: 'p_101', name: 'Rani', phone: '9390420247', role: 'maid' },
    dbUser: { role: 'maid' },
    dbMaid: { status: 'pending' },
  });
  assert(coldPendingPartner === 'maid_status', 'Cold launch with pending partner opens maid_status review screen');

  const coldLoggedOut = determineInitialScreen({
    sessionUser: null,
    dbUser: null,
    dbMaid: null,
  });
  assert(coldLoggedOut === 'login', 'Cold launch after logout opens login screen');

  // ── TEST 3: Strict Route Isolation & Anti-Leakage ──
  console.log('\n━━━ TEST 3: Zero Customer/Partner Page Leakage ━━━');
  
  // Partner trying to access customer routes
  const partnerOnCustomerHome = simulateRouterView({
    user: { role: 'maid', maidApplicationStatus: 'approved' },
    maidProfile: { status: 'approved' },
    requestedScreen: 'customer_home',
  });
  assert(partnerOnCustomerHome === 'maid_home', 'Partner requesting customer_home is blocked and kept on maid_home');

  const partnerOnServices = simulateRouterView({
    user: { role: 'maid', maidApplicationStatus: 'approved' },
    maidProfile: { status: 'approved' },
    requestedScreen: 'services_listing',
  });
  assert(partnerOnServices === 'maid_home', 'Partner requesting services_listing is blocked and kept on maid_home');

  const partnerOnCart = simulateRouterView({
    user: { role: 'maid', maidApplicationStatus: 'approved' },
    maidProfile: { status: 'approved' },
    requestedScreen: 'cart_summary',
  });
  assert(partnerOnCart === 'maid_home', 'Partner requesting cart_summary is blocked and kept on maid_home');

  const partnerOnMyJobs = simulateRouterView({
    user: { role: 'maid', maidApplicationStatus: 'approved' },
    maidProfile: { status: 'approved' },
    requestedScreen: 'my_jobs',
  });
  assert(partnerOnMyJobs === 'my_jobs', 'Partner requesting my_jobs is granted access');

  // Customer trying to access partner routes
  const customerOnMaidHome = simulateRouterView({
    user: { role: 'customer', maidApplicationStatus: 'none' },
    maidProfile: null,
    requestedScreen: 'maid_home',
  });
  assert(customerOnMaidHome === 'customer_home', 'Customer requesting maid_home is blocked and kept on customer_home');

  const customerOnEarnings = simulateRouterView({
    user: { role: 'customer', maidApplicationStatus: 'none' },
    maidProfile: null,
    requestedScreen: 'earnings',
  });
  assert(customerOnEarnings === 'customer_home', 'Customer requesting earnings is blocked and kept on customer_home');

  // Customer registering as partner
  const customerOnBecomeMaid = simulateRouterView({
    user: { role: 'customer', maidApplicationStatus: 'none' },
    maidProfile: null,
    requestedScreen: 'become_maid_info',
  });
  assert(customerOnBecomeMaid === 'become_maid_info', 'Customer tapping Become a Partner can view become_maid_info');

  // Unauthenticated user
  const anonOnCustomerHome = simulateRouterView({
    user: null,
    maidProfile: null,
    requestedScreen: 'customer_home',
  });
  assert(anonOnCustomerHome === 'login', 'Unauthenticated user requesting customer_home is redirected to login');

  const anonOnBecomePartner = simulateRouterView({
    user: null,
    maidProfile: null,
    requestedScreen: 'become_maid_info',
  });
  assert(anonOnBecomePartner === 'become_maid_info', 'Unauthenticated user can view become_maid_info from login screen');

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('══════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
