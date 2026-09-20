import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Send, ShieldCheck, Sparkles, Lock, MessageSquare, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { ChatMessage, ChatConversation, Booking, UserRole } from '../types';

interface InAppChatModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking;
  currentUserRole: 'customer' | 'maid';
  currentUserId: string;
  currentUserName: string;
}

export const InAppChatModal: React.FC<InAppChatModalProps> = ({
  visible,
  onClose,
  booking,
  currentUserRole,
  currentUserId,
  currentUserName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const targetPartnerName =
    currentUserRole === 'customer'
      ? booking.assignedMaidName || 'Assigned Maid Partner'
      : booking.customerName || 'Customer';

  // Initialize or fetch conversation
  useEffect(() => {
    if (!visible || !booking) return;

    let isMounted = true;

    const initConversation = async () => {
      try {
        setLoading(true);

        // Check if conversation exists for this booking_code
        let { data: existingConv, error: convError } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('booking_code', booking.bookingId)
          .maybeSingle();

        if (!existingConv) {
          // Auto-create conversation
          const newConvPayload = {
            booking_code: booking.bookingId,
            customer_id: booking.customerId,
            customer_name: booking.customerName || 'Customer',
            maid_id: booking.assignedMaidId || 'unassigned',
            maid_name: booking.assignedMaidName || 'Partner',
            status: 'active',
            last_message: 'Chat initialized for booking.',
            last_message_sender_role: 'system',
          };

          const { data: createdConv, error: createErr } = await supabase
            .from('chat_conversations')
            .upsert(newConvPayload, { onConflict: 'booking_code' })
            .select()
            .single();

          if (!createErr && createdConv) {
            existingConv = createdConv;
          }
        }

        if (isMounted && existingConv) {
          setConversation(existingConv);

          // Fetch messages
          const { data: existingMessages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', existingConv.id)
            .order('created_at', { ascending: true });

          if (isMounted && existingMessages) {
            setMessages(
              existingMessages.map((m: any) => ({
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
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Error in initConversation:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initConversation();

    // Subscribe to realtime messages for this booking
    const channel = supabase
      .channel(`chat_room_${booking.bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_code=eq.${booking.bookingId}`,
        },
        (payload: any) => {
          if (!isMounted) return;
          const newMsg: ChatMessage = {
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
          };

          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [visible, booking?.bookingId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending || !conversation) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const payload = {
        conversation_id: conversation.id,
        booking_code: booking.bookingId,
        sender_id: currentUserId,
        sender_role: currentUserRole,
        sender_name: currentUserName,
        message: textToSend,
      };

      const { data, error } = await supabase.from('chat_messages').insert([payload]).select();

      if (!error && data && data.length > 0) {
        const createdMsg: ChatMessage = {
          id: data[0].id,
          conversationId: data[0].conversation_id,
          bookingCode: data[0].booking_code,
          senderId: data[0].sender_id,
          senderRole: data[0].sender_role,
          senderName: data[0].sender_name,
          message: data[0].message,
          createdAt: data[0].created_at,
        };

        setMessages(prev => {
          if (prev.some(m => m.id === createdMsg.id)) return prev;
          return [...prev, createdMsg];
        });
      }
    } catch (err) {
      console.warn('Error sending chat message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{targetPartnerName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{targetPartnerName}</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSubtitle}>
                  {currentUserRole === 'customer' ? 'Maid Partner' : 'Customer'} • #{booking.bookingId}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Security / Admin Supervision Strip */}
        <View style={styles.safetyStrip}>
          <Lock size={12} color="#065F46" />
          <Text style={styles.safetyStripText}>
            🔒 In-App Communication • Monitored by GC HOME+ Operations Admin
          </Text>
        </View>

        {/* Messages Feed */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.noticeCard}>
            <ShieldCheck size={16} color="#043927" />
            <Text style={styles.noticeText}>
              For your safety, direct phone sharing is prohibited. Coordinate arrival, gate entry, and cleaning instructions securely here.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#043927" style={{ marginVertical: 20 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare size={32} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Say hello to coordinate service arrival and specific room instructions!
              </Text>
            </View>
          ) : (
            messages.map(msg => {
              const isMe = msg.senderId === currentUserId || msg.senderRole === currentUserRole;
              const isAdmin = msg.senderRole === 'admin';

              if (isAdmin) {
                return (
                  <View key={msg.id} style={styles.adminMessageCard}>
                    <View style={styles.adminHeader}>
                      <Sparkles size={12} color="#F59E0B" />
                      <Text style={styles.adminTitle}>Admin Operations Notice</Text>
                    </View>
                    <Text style={styles.adminBody}>{msg.message}</Text>
                    <Text style={styles.adminTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                );
              }

              return (
                <View
                  key={msg.id}
                  style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}
                >
                  <View
                    style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
                  >
                    <Text style={[styles.senderLabel, isMe ? styles.senderLabelMe : styles.senderLabelOther]}>
                      {msg.senderName}
                    </Text>
                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                      {msg.message}
                    </Text>
                    <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#043927',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  safetyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  safetyStripText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    paddingBottom: 24,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#043927',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  senderLabelMe: {
    color: '#A7F3D0',
  },
  senderLabelOther: {
    color: '#0369A1',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#0F172A',
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: '#D1FAE5',
  },
  timeTextOther: {
    color: '#94A3B8',
  },
  adminMessageCard: {
    backgroundColor: '#022C22',
    borderWidth: 1,
    borderColor: '#065F46',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  adminTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCD34D',
    textTransform: 'uppercase',
  },
  adminBody: {
    fontSize: 12,
    color: '#ECFDF5',
    lineHeight: 16,
  },
  adminTime: {
    fontSize: 9,
    color: '#6EE7B7',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#043927',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
