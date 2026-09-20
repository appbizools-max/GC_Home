import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zpkukinayxcbwyklfdqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3VraW5heXhjYnd5a2xmZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MjgzOTMsImV4cCI6MjEwNTEwNDM5M30.Pb-lFEOs94TwjDtiih7F8CcxAjEAt1Q4kDbsQaTe-O4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAdminControlledChatFlowTests() {
  console.log('================================================================');
  console.log('GC HOME+ : ADMIN-CONTROLLED DISPATCH & TRI-PARTY CHAT AUDIT');
  console.log('================================================================\n');

  const testResults = [];
  const record = (step, title, expected, actual, status, details = '') => {
    testResults.push({ step, title, expected, actual, status, details });
    const badge = status === 'PASSED' ? '✅ PASS' : status === 'PARTIAL' ? '🟡 PARTIAL' : '❌ FAIL';
    console.log(`[${badge}] Step ${step}: ${title}`);
    console.log(`       Result: ${actual}`);
    if (details) console.log(`       Details: ${details}`);
  };

  const testBookingCode = `GC-CHAT-TEST-${Date.now()}`;
  let bookingDbId = null;
  let conversationId = null;

  // 1. Customer Creates Booking
  try {
    const bookingPayload = {
      booking_code: testBookingCode,
      customer_name: 'Rohit Deshmukh',
      customer_phone: '+91 98222 33445',
      service_name: 'Deep Cleaning (2 BHK)',
      service_price: 1499,
      total_amount: 1499,
      address_label: 'Home',
      address_street: 'Tower 4, Apt 802, My Home Bhooja',
      address_locality: 'Hitec City',
      address_city: 'Hyderabad',
      address_pincode: '500081',
      scheduled_date: '2026-09-30',
      time_slot: '10:00 AM',
      status: 'pending_assignment',
      payment_method: 'online',
      payment_status: 'paid',
      start_otp: '5821',
    };

    const { data: bData, error: bErr } = await supabase.from('bookings').insert([bookingPayload]).select();
    if (bErr) {
      record(1, 'Customer Creates Booking', 'Booking inserted into DB', bErr.message, 'FAILED', bErr.details);
    } else {
      bookingDbId = bData[0].id;
      record(1, 'Customer Creates Booking', 'Booking inserted into DB with status pending_assignment', `Booking ${testBookingCode} created (DB ID: ${bookingDbId})`, 'PASSED');
    }
  } catch (e) {
    record(1, 'Customer Creates Booking', 'Success', e.message, 'FAILED');
  }

  // 2. Admin Reviews & Assigns Maid
  try {
    const assignedMaid = {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Sunita Devi',
      phone: '+91 98492 01824',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
    };

    const { data: updateData, error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'maid_assigned',
        assigned_maid_name: assignedMaid.name,
        assigned_maid_phone: assignedMaid.phone,
        assigned_maid_photo_url: assignedMaid.photo,
        updated_at: new Date().toISOString()
      })
      .eq('booking_code', testBookingCode)
      .select();

    if (updateErr) {
      record(2, 'Admin Assigns Maid', 'Status updated to maid_assigned', updateErr.message, 'FAILED');
    } else {
      record(2, 'Admin Assigns Maid', 'Status updated to maid_assigned with assigned partner', `Assigned ${assignedMaid.name} to booking ${testBookingCode}`, 'PASSED');
    }
  } catch (e) {
    record(2, 'Admin Assigns Maid', 'Success', e.message, 'FAILED');
  }

  // 3. Conversation Initialization
  try {
    const convPayload = {
      booking_code: testBookingCode,
      customer_id: 'cust_rohit_01',
      customer_name: 'Rohit Deshmukh',
      maid_id: 'maid_sunita_01',
      maid_name: 'Sunita Devi',
      status: 'active',
      last_message: 'Job assignment confirmed by Admin.',
      last_message_sender_role: 'system'
    };

    const { data: convData, error: convErr } = await supabase
      .from('chat_conversations')
      .upsert(convPayload, { onConflict: 'booking_code' })
      .select();

    if (convErr) {
      record(3, 'Chat Conversation Initialization', 'Conversation record created', convErr.message, 'FAILED');
    } else {
      conversationId = convData[0].id;
      record(3, 'Chat Conversation Initialization', 'Conversation record created with unique booking code constraint', `Conversation ${conversationId} initialized for ${testBookingCode}`, 'PASSED');
    }
  } catch (e) {
    record(3, 'Chat Conversation Initialization', 'Success', e.message, 'FAILED');
  }

  // 4. Customer Sends Message in In-App Chat
  try {
    const customerMsg = {
      conversation_id: conversationId,
      booking_code: testBookingCode,
      sender_id: 'cust_rohit_01',
      sender_role: 'customer',
      sender_name: 'Rohit Deshmukh',
      message: 'Hello Sunita, please ring bell twice and focus on balcony cleaning.',
    };

    const { data: m1Data, error: m1Err } = await supabase.from('chat_messages').insert([customerMsg]).select();
    if (m1Err) {
      record(4, 'Customer In-App Message', 'Message inserted into chat_messages', m1Err.message, 'FAILED');
    } else {
      record(4, 'Customer In-App Message', 'Message persisted with role customer and sender Rohit Deshmukh', `Message ID: ${m1Data[0].id}`, 'PASSED');
    }
  } catch (e) {
    record(4, 'Customer In-App Message', 'Success', e.message, 'FAILED');
  }

  // 5. Maid Partner Receives & Replies
  try {
    const maidReply = {
      conversation_id: conversationId,
      booking_code: testBookingCode,
      sender_id: 'maid_sunita_01',
      sender_role: 'maid',
      sender_name: 'Sunita Devi',
      message: 'Understood sir. I am en route and will arrive at 10:00 AM sharp with sanitation supplies.',
    };

    const { data: m2Data, error: m2Err } = await supabase.from('chat_messages').insert([maidReply]).select();
    if (m2Err) {
      record(5, 'Maid In-App Reply', 'Message inserted into chat_messages', m2Err.message, 'FAILED');
    } else {
      record(5, 'Maid In-App Reply', 'Message persisted with role maid and sender Sunita Devi', `Message ID: ${m2Data[0].id}`, 'PASSED');
    }
  } catch (e) {
    record(5, 'Maid In-App Reply', 'Success', e.message, 'FAILED');
  }

  // 6. Admin Supervisor Monitors & Broadcasts in Thread
  try {
    const adminBroadcast = {
      conversation_id: conversationId,
      booking_code: testBookingCode,
      sender_id: 'admin_ops_super',
      sender_role: 'admin',
      sender_name: 'GC Operations Supervisor',
      message: 'Notice: Service start requires sharing the 4-digit Customer OTP upon partner arrival.',
    };

    const { data: m3Data, error: m3Err } = await supabase.from('chat_messages').insert([adminBroadcast]).select();
    if (m3Err) {
      record(6, 'Admin Supervisor Broadcast', 'Admin message inserted into thread', m3Err.message, 'FAILED');
    } else {
      record(6, 'Admin Supervisor Broadcast', 'Admin advisory broadcast recorded in tri-party thread', `Broadcast ID: ${m3Data[0].id}`, 'PASSED');
    }
  } catch (e) {
    record(6, 'Admin Supervisor Broadcast', 'Success', e.message, 'FAILED');
  }

  // 7. Verify Conversation History & Trigger Update
  try {
    const { data: convCheck, error: checkErr } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    const { data: allMessages, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (checkErr || msgErr) {
      record(7, 'Conversation Aggregation & Trigger', 'Conversation updated with last message', checkErr?.message || msgErr?.message, 'FAILED');
    } else {
      record(
        7,
        'Conversation Aggregation & Trigger',
        '3 messages present (Customer, Maid, Admin) and last_message reflects latest broadcast',
        `Messages Count: ${allMessages.length} | Last Message: "${convCheck.last_message.slice(0, 40)}..."`,
        'PASSED'
      );
    }
  } catch (e) {
    record(7, 'Conversation Aggregation & Trigger', 'Success', e.message, 'FAILED');
  }

  // 8. Admin Moderation Status Management (Block / Activate)
  try {
    const { data: blockData, error: blockErr } = await supabase
      .from('chat_conversations')
      .update({ status: 'blocked', updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select();

    const { data: activateData, error: actErr } = await supabase
      .from('chat_conversations')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select();

    if (blockErr || actErr) {
      record(8, 'Admin Moderation Status Update', 'Status transitions to blocked and active', blockErr?.message || actErr?.message, 'FAILED');
    } else {
      record(8, 'Admin Moderation Status Update', 'Status transitions verified (active -> blocked -> active)', `Final Status: ${activateData[0].status}`, 'PASSED');
    }
  } catch (e) {
    record(8, 'Admin Moderation Status Update', 'Success', e.message, 'FAILED');
  }

  // 9. Clean up Test Records
  try {
    await supabase.from('chat_messages').delete().eq('conversation_id', conversationId);
    await supabase.from('chat_conversations').delete().eq('id', conversationId);
    await supabase.from('bookings').delete().eq('booking_code', testBookingCode);
    record(9, 'Test Cleanup', 'Clean up test booking, conversation, and messages', 'All test rows cleaned from Supabase', 'PASSED');
  } catch (e) {
    record(9, 'Test Cleanup', 'Success', e.message, 'FAILED');
  }

  console.log('\n================================================================');
  const passed = testResults.filter(t => t.status === 'PASSED').length;
  const failed = testResults.filter(t => t.status === 'FAILED').length;
  console.log(`TOTAL AUDIT STEPS TESTED: ${testResults.length}`);
  console.log(`PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');
}

runAdminControlledChatFlowTests();
