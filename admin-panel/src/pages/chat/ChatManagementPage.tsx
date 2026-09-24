import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ChatConversation, ChatMessage } from '../../types';
import { supabase } from '../../config/supabase';
import {
  MessageSquare,
  Search,
  Send,
  Clock,
  Archive,
  RefreshCw,
  Eye,
  AlertCircle,
  ChevronLeft,
  MoreVertical,
  X,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowDown,
  Info,
  Lock,
  User,
  CheckCheck,
  FileText,
} from 'lucide-react';

export const ChatManagementPage: React.FC = () => {
  const { adminUser, bookings, openBookingDetails } = useAdmin();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'restricted' | 'archived'>('all');
  const [adminInput, setAdminInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  // Smart Scrolling & Floating Notification
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);
  const [showNewMessagePill, setShowNewMessagePill] = useState<boolean>(false);

  // Action Menu & Audit Modal States
  const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showConfirmRestrictModal, setShowConfirmRestrictModal] = useState<boolean>(false);

  // Mobile Drill-down View: 'list' or 'thread'
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessagePill(false);
  };

  // Scroll listener for detecting near-bottom state
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setShowNewMessagePill(false);
    }
  };

  // Fetch all chat conversations
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        const mapped: ChatConversation[] = data.map((c: any) => ({
          id: c.id,
          bookingId: c.booking_id,
          bookingCode: c.booking_code,
          customerId: c.customer_id,
          customerName: c.customer_name,
          maidId: c.maid_id,
          maidName: c.maid_name,
          status: c.status,
          lastMessage: c.last_message,
          lastMessageAt: c.last_message_at,
          lastMessageSenderRole: c.last_message_sender_role,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        setConversations(mapped);

        // Keep current selected or pick first on desktop
        if (!selectedConversation && mapped.length > 0) {
          setSelectedConversation(mapped[0]);
        } else if (selectedConversation) {
          const updatedSelected = mapped.find(m => m.id === selectedConversation.id);
          if (updatedSelected) setSelectedConversation(updatedSelected);
        }
      }
    } catch (err) {
      console.warn('Error fetching chat conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const mapped: ChatMessage[] = data.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          bookingCode: m.booking_code,
          senderId: m.sender_id,
          senderRole: m.sender_role,
          senderName: m.sender_name,
          message: m.message,
          attachmentUrl: m.attachment_url,
          isFlagged: m.is_flagged,
          readAt: m.read_at,
          createdAt: m.created_at,
        }));
        setMessages(mapped);

        // Mark incoming messages as read in Supabase
        try {
          await supabase
            .from('chat_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', convId)
            .is('read_at', null)
            .neq('sender_role', 'admin');
        } catch (e) {
          console.warn('Error marking messages as read:', e);
        }
      }
    } catch (err) {
      console.warn('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 80);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime changes on chat_conversations and chat_messages
    const channel = supabase
      .channel('admin_chat_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
        if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [
              ...prev,
              {
                id: payload.new.id,
                conversationId: payload.new.conversation_id,
                bookingCode: payload.new.booking_code,
                senderId: payload.new.sender_id,
                senderRole: payload.new.sender_role,
                senderName: payload.new.sender_name,
                message: payload.new.message,
                attachmentUrl: payload.new.attachment_url,
                isFlagged: payload.new.is_flagged,
                readAt: payload.new.read_at,
                createdAt: payload.new.created_at,
              },
            ];
          });

          // Smart auto-scroll logic
          if (isNearBottom) {
            setTimeout(scrollToBottom, 50);
          } else {
            setShowNewMessagePill(true);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, isNearBottom]);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Send Admin Notice / Operational message into thread
  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInput.trim() || !selectedConversation || sending) return;

    const messageText = adminInput.trim();
    setAdminInput('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            conversation_id: selectedConversation.id,
            booking_code: selectedConversation.bookingCode,
            sender_id: adminUser?.id || 'admin_operations',
            sender_role: 'admin',
            sender_name: adminUser?.user_metadata?.name || 'Operations Support',
            message: messageText,
          },
        ])
        .select();

      if (!error && data && data.length > 0) {
        setMessages(prev => [
          ...prev,
          {
            id: data[0].id,
            conversationId: data[0].conversation_id,
            bookingCode: data[0].booking_code,
            senderId: data[0].sender_id,
            senderRole: data[0].sender_role,
            senderName: data[0].sender_name,
            message: data[0].message,
            createdAt: data[0].created_at,
          },
        ]);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.warn('Error sending admin message:', err);
    } finally {
      setSending(false);
    }
  };

  // Moderate conversation status
  const handleUpdateStatus = async (newStatus: 'active' | 'archived' | 'blocked') => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      if (!error) {
        setSelectedConversation(prev => (prev ? { ...prev, status: newStatus } : null));
        setConversations(prev =>
          prev.map(c => (c.id === selectedConversation.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.warn('Error updating conversation status:', err);
    } finally {
      setShowActionMenu(false);
      setShowConfirmRestrictModal(false);
    }
  };

  // Look up associated booking data
  const associatedBooking = useMemo(() => {
    if (!selectedConversation) return null;
    return bookings.find(b => b.bookingId === selectedConversation.bookingCode);
  }, [bookings, selectedConversation?.bookingCode]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      // Map 'blocked' database status to 'restricted'
      if (statusFilter === 'active' && c.status !== 'active') return false;
      if (statusFilter === 'restricted' && c.status !== 'blocked') return false;
      if (statusFilter === 'archived' && c.status !== 'archived') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = c.bookingCode.toLowerCase().includes(q);
        const matchCustomer = c.customerName.toLowerCase().includes(q);
        const matchPartner = c.maidName.toLowerCase().includes(q);
        const matchLastMsg = (c.lastMessage || '').toLowerCase().includes(q);

        return matchCode || matchCustomer || matchPartner || matchLastMsg;
      }
      return true;
    });
  }, [conversations, statusFilter, searchQuery]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-sans h-[calc(100vh-80px)] flex flex-col gap-3.5 select-none">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#0A192F] tracking-tight">
              Chat & Support
            </h1>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#123D2A] border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Admin Monitoring Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage customer and partner conversations related to bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            disabled={loadingConversations}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
            title="Refresh conversations"
          >
            <RefreshCw className={`w-4 h-4 ${loadingConversations ? 'animate-spin text-[#123D2A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Container: Split View (Responsive) */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0 relative">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-[360px] lg:w-[380px] border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 ${
            mobileView === 'thread' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Filter & Search Bar */}
          <div className="p-3 border-b border-slate-200 flex flex-col gap-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search booking code, customer, partner..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D2A] text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'restricted', label: 'Restricted' },
                { key: 'archived', label: 'Archived' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`flex-1 py-1 text-[11px] rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === tab.key
                      ? 'bg-white text-[#123D2A] shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-bold text-slate-600">No conversations found</span>
                <span className="text-[11px] text-slate-400 max-w-[200px]">
                  When customers and partners start communicating about bookings, conversations will appear here.
                </span>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConversation?.id === conv.id;
                const isRestricted = conv.status === 'blocked';
                const isArchived = conv.status === 'archived';

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMobileView('thread');
                    }}
                    className={`p-3 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-[#123D2A]'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Top Row: Booking ID & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {conv.bookingCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            isRestricted
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isArchived
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-[#123D2A] border border-emerald-200'
                          }`}
                        >
                          {isRestricted ? 'Restricted' : isArchived ? 'Archived' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Parties: Customer ↔ Partner */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium truncate">
                      <span className="font-bold text-slate-900">{conv.customerName}</span>
                      <span className="text-slate-400 text-[10px]">↔</span>
                      <span className="font-bold text-emerald-800">{conv.maidName}</span>
                    </div>

                    {/* Message Preview */}
                    <p className="text-[11px] text-slate-500 truncate leading-snug">
                      {conv.lastMessageSenderRole === 'admin' ? (
                        <span className="font-bold text-[#123D2A]">Admin Notice: </span>
                      ) : null}
                      {conv.lastMessage || 'No messages yet'}
                    </p>

                    {/* Timestamp & Status */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Monitored
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Feed */}
        {selectedConversation ? (
          <div
            className={`flex-1 flex flex-col min-h-0 bg-white ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Thread Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                  title="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="w-9 h-9 rounded-xl bg-[#123D2A] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 font-mono">
                  {selectedConversation.bookingCode.slice(-3)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openBookingDetails(selectedConversation.bookingCode)}
                      className="text-xs font-black text-[#123D2A] font-mono hover:underline cursor-pointer"
                      title="View Booking Details"
                    >
                      {selectedConversation.bookingCode}
                    </button>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedConversation.customerName}
                    </span>
                    <span className="text-slate-400 text-xs">↔</span>
                    <span className="text-xs font-bold text-emerald-800">
                      {selectedConversation.maidName} (Partner)
                    </span>

                    {associatedBooking && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                        {associatedBooking.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>Chat monitored</span>
                    <span>•</span>
                    <span className="text-slate-400">Calling restricted for safety</span>
                    {associatedBooking?.serviceName && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600 font-semibold">{associatedBooking.serviceName}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Menu (⋮) */}
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                  title="Conversation Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showActionMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-semibold text-slate-700">
                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        openBookingDetails(selectedConversation.bookingCode);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#123D2A]" />
                      <span>View Booking Details</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowActionMenu(false);
                        setShowAuditModal(true);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Audit History</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {selectedConversation.status === 'blocked' ? (
                      <button
                        onClick={() => handleUpdateStatus('active')}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Unrestrict Chat</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowActionMenu(false);
                          setShowConfirmRestrictModal(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>Restrict Chat</span>
                      </button>
                    )}

                    {selectedConversation.status !== 'archived' && (
                      <button
                        onClick={() => handleUpdateStatus('archived')}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-500" />
                        <span>Archive Conversation</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Message Feed Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 no-scrollbar relative"
            >
              {loadingMessages ? (
                <div className="text-center py-12 text-xs text-slate-400 font-medium">
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center gap-2 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Conversation Started</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    No messages have been exchanged yet. The first customer or partner message will appear here.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.senderRole === 'admin';
                  const isCustomer = msg.senderRole === 'customer';
                  const isPartner = msg.senderRole === 'maid';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isAdmin
                          ? 'items-center my-2'
                          : isCustomer
                          ? 'items-start'
                          : 'items-end'
                      }`}
                    >
                      {/* Admin Operational Notice */}
                      {isAdmin ? (
                        <div className="max-w-md w-full bg-emerald-950 text-white rounded-2xl p-3.5 shadow-sm border border-emerald-800/80 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Admin Notice
                            </span>
                            <span className="text-emerald-400 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-50 leading-relaxed font-medium">
                            {msg.message}
                          </p>
                        </div>
                      ) : (
                        /* Customer or Partner Chat Bubble */
                        <div
                          className={`max-w-[78%] rounded-2xl p-3 shadow-2xs flex flex-col gap-1 ${
                            isCustomer
                              ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                              : 'bg-[#123D2A] text-white rounded-tr-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span
                              className={`font-black uppercase tracking-wider ${
                                isCustomer ? 'text-blue-700' : 'text-emerald-200'
                              }`}
                            >
                              {msg.senderName} ({isCustomer ? 'Customer' : 'Partner'})
                            </span>
                            <span
                              className={`font-mono ${
                                isCustomer ? 'text-slate-400' : 'text-emerald-300/80'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${isCustomer ? 'text-slate-800' : 'text-emerald-50'}`}>
                            {msg.message}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating 'New Message ↓' Button */}
            {showNewMessagePill && (
              <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={scrollToBottom}
                  className="bg-[#123D2A] hover:bg-[#184a34] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer animate-bounce"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>New message</span>
                </button>
              </div>
            )}

            {/* Message Composer for Admin Notices */}
            <form
              onSubmit={handleSendAdminMessage}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={adminInput}
                  onChange={e => setAdminInput(e.target.value)}
                  placeholder={
                    selectedConversation.status === 'blocked'
                      ? 'Chat is restricted. Unrestrict to send notices.'
                      : 'Send an admin notice...'
                  }
                  disabled={selectedConversation.status === 'blocked' || sending}
                  className="w-full pl-3 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D2A] text-slate-800 placeholder-slate-400 disabled:opacity-50 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={!adminInput.trim() || sending || selectedConversation.status === 'blocked'}
                className="px-4 py-2 bg-[#123D2A] hover:bg-[#184a34] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : 'Send Admin Notice'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Empty State when no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/30">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Select a Conversation</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Choose a booking chat thread from the left to view customer and partner messages.
            </p>
          </div>
        )}
      </div>

      {/* Audit History Modal */}
      {showAuditModal && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#123D2A]" />
                <h3 className="text-sm font-black text-slate-900">
                  Audit History — {selectedConversation.bookingCode}
                </h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex flex-col gap-1">
                <span className="font-bold text-slate-800">Conversation Created</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(selectedConversation.createdAt).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-600">
                  Customer: {selectedConversation.customerName} • Partner: {selectedConversation.maidName}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex flex-col gap-1">
                <span className="font-bold text-slate-800">Message Volume</span>
                <span className="text-[11px] text-slate-600">
                  {messages.length} total messages exchanged in this thread.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex flex-col gap-1">
                <span className="font-bold text-slate-800">Current Status</span>
                <span className="text-[11px] text-slate-600 capitalize">
                  {selectedConversation.status === 'blocked' ? 'Restricted' : selectedConversation.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  Last updated: {new Date(selectedConversation.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Restrict Chat Modal */}
      {showConfirmRestrictModal && selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Restrict This Chat?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Restricting chat will prevent customer and partner from sending further messages in booking{' '}
                <span className="font-mono font-bold text-slate-800">{selectedConversation.bookingCode}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowConfirmRestrictModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus('blocked')}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Confirm Restrict
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


