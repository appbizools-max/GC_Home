import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { ChatConversation, ChatMessage } from '../../types';
import { supabase } from '../../config/supabase';
import {
  MessageSquare,
  Search,
  Filter,
  ShieldAlert,
  Send,
  User,
  Sparkles,
  Lock,
  Clock,
  CheckCheck,
  Ban,
  Archive,
  RefreshCw,
  Eye,
  AlertCircle,
  PhoneOff,
  UserCheck
} from 'lucide-react';

export const ChatManagementPage: React.FC = () => {
  const { adminUser } = useAdmin();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'blocked'>('all');
  const [adminInput, setAdminInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        if (!selectedConversation && mapped.length > 0) {
          setSelectedConversation(mapped[0]);
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
      }
    } catch (err) {
      console.warn('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime changes on both conversations and messages
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
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send Admin message / supervisory broadcast into thread
  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInput.trim() || !selectedConversation || sending) return;

    const messageText = adminInput.trim();
    setAdminInput('');
    setSending(true);

    try {
      const { data, error } = await supabase.from('chat_messages').insert([
        {
          conversation_id: selectedConversation.id,
          booking_code: selectedConversation.bookingCode,
          sender_id: adminUser?.id || 'admin_supervisor',
          sender_role: 'admin',
          sender_name: adminUser?.email || 'Operations Supervisor',
          message: messageText,
        },
      ]).select();

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
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.bookingCode.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.maidName.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans h-[calc(100vh-80px)] flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tri-Party Chat Supervision
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Mandatory Admin Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise all customer-to-maid in-app communications in real time. Direct phone calls are restricted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Container: Split View */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Left Column: Conversations List */}
        <div className="w-full md:w-[380px] border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
          {/* Filter & Search Bar */}
          <div className="p-3 border-b border-slate-200 flex flex-col gap-2 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search booking code, customer, maid..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'active', 'blocked', 'archived'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md capitalize transition cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-[#043927] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List of Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-medium">No conversations found</span>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {conv.bookingCode}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          conv.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : conv.status === 'blocked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {conv.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <span className="text-slate-900 font-semibold">{conv.customerName}</span>
                      <span className="text-slate-400 text-[10px]">↔</span>
                      <span className="text-emerald-800 font-semibold">{conv.maidName}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">
                      {conv.lastMessageSenderRole && (
                        <span className="font-semibold text-slate-700 capitalize">
                          {conv.lastMessageSenderRole}:{' '}
                        </span>
                      )}
                      {conv.lastMessage || 'No messages yet'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                      <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                        <Eye className="w-3 h-3" /> Admin Monitored
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
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Thread Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#043927] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {selectedConversation.bookingCode.slice(-3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-slate-900 font-mono">
                      {selectedConversation.bookingCode}
                    </h2>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-bold text-slate-700">
                      {selectedConversation.customerName} (Customer)
                    </span>
                    <span className="text-xs text-slate-400">↔</span>
                    <span className="text-xs font-bold text-emerald-800">
                      {selectedConversation.maidName} (Maid Partner)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Tri-Party In-App Communication • Admin Monitoring Enabled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedConversation.status === 'active' ? (
                  <button
                    onClick={() => handleUpdateStatus('blocked')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Block Chat
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('active')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Unblock / Activate
                  </button>
                )}
                <button
                  onClick={() => handleUpdateStatus('archived')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="Archive Conversation"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              <div className="flex justify-center my-1">
                <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1.5 text-[11px] text-amber-900 flex items-center gap-1.5 shadow-2xs">
                  <PhoneOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    Direct phone call links are disabled. All messages are archived for safety & dispute resolution.
                  </span>
                </div>
              </div>

              {loadingMessages ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No messages sent yet in this booking conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isAdmin = msg.senderRole === 'admin';
                  const isCustomer = msg.senderRole === 'customer';
                  const isMaid = msg.senderRole === 'maid';

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
                      {isAdmin ? (
                        <div className="max-w-md w-full bg-emerald-950 text-white rounded-xl p-3 shadow-sm border border-emerald-800 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Operations Admin Broadcast
                            </span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-50 leading-relaxed">{msg.message}</p>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[75%] rounded-2xl p-3 shadow-2xs flex flex-col gap-1 ${
                            isCustomer
                              ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'
                              : 'bg-[#043927] text-white rounded-tr-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <span
                              className={`font-black uppercase tracking-wider ${
                                isCustomer ? 'text-blue-700' : 'text-emerald-200'
                              }`}
                            >
                              {msg.senderName} ({isCustomer ? 'Customer' : 'Maid Partner'})
                            </span>
                            <span className={isCustomer ? 'text-slate-400' : 'text-emerald-300/70'}>
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

            {/* Admin Supervisory Input Box */}
            <form
              onSubmit={handleSendAdminMessage}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={adminInput}
                  onChange={e => setAdminInput(e.target.value)}
                  placeholder="Type an Admin notice or reply into this job thread..."
                  disabled={selectedConversation.status === 'blocked'}
                  className="w-full pl-3 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!adminInput.trim() || sending || selectedConversation.status === 'blocked'}
                className="px-4 py-2 bg-[#043927] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Notice</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/30">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Select a Conversation</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Choose a booking chat thread from the left to view messages and supervise the interaction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
