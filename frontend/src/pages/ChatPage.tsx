import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Toast } from '../components/Toast';
import { Send, Paperclip, CheckCheck, Loader2 } from 'lucide-react';
import { ChatMessage, ChatRoom } from '../types';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Typing indicators
  const [typingStatus, setTypingStatus] = useState<{ name: string; isTyping: boolean } | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all user active rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/chats/active');
        setRooms(res.data);
        if (res.data.length > 0) {
          setSelectedRoom(res.data[0]);
        }
      } catch (err) {
        setToastMessage('Failed to load chat channels');
        setToastType('error');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  // Fetch messages when room selection changes
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chats/messages/${selectedRoom.id}`);
        setMessages(res.data);
        scrollToBottom();

        // Emit read receipt when room is opened
        if (socket && user) {
          socket.emit('read_receipt', { chatId: selectedRoom.id, userId: user.id });
        }
      } catch (err) {
        console.error('Failed to load messages');
      }
    };

    fetchMessages();

    // Join room in Socket
    if (socket) {
      socket.emit('join_room', selectedRoom.id);
    }
  }, [selectedRoom, socket]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('new_message', (msg: ChatMessage) => {
      if (selectedRoom && msg.id && !messages.some((m) => m.id === msg.id)) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
        // Emit read receipt automatically if active
        socket.emit('read_receipt', { chatId: selectedRoom.id, userId: user.id });
      }
    });

    socket.on('typing_status', (data: { name: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingStatus({ name: data.name, isTyping: true });
      } else {
        setTypingStatus(null);
      }
    });

    socket.on('messages_read', (data: { chatId: string; userId: string }) => {
      if (selectedRoom && data.chatId === selectedRoom.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId !== data.userId ? { ...m, isRead: true } : m))
        );
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_status');
      socket.off('messages_read');
    };
  }, [socket, selectedRoom, messages, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = () => {
    if (!inputValue.trim() || !socket || !selectedRoom || !user) return;

    socket.emit('send_message', {
      chatId: selectedRoom.id,
      senderId: user.id,
      content: inputValue,
    });

    // Reset typing status on submit
    socket.emit('typing', { chatId: selectedRoom.id, name: user.name, isTyping: false });

    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!socket || !selectedRoom || !user) return;

    // Send typing notification
    socket.emit('typing', { chatId: selectedRoom.id, name: user.name, isTyping: true });

    // Debounce clear typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { chatId: selectedRoom.id, name: user.name, isTyping: false });
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] border-b border-google-gray-200 dark:border-google-gray-800">
      {/* Rooms Sidebar */}
      <div className="w-1/3 border-r border-google-gray-200 bg-white dark:border-google-gray-800 dark:bg-google-surface-dark flex flex-col">
        <div className="p-4 border-b border-google-gray-250 dark:border-google-gray-800">
          <h3 className="font-bold text-google-gray-800 dark:text-white">Active Doubt Threads</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-google-gray-100 dark:divide-google-gray-850">
          {loadingRooms ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-google-blue" /></div>
          ) : rooms.length === 0 ? (
            <p className="text-center text-xs text-google-gray-500 py-6">No chat threads found.</p>
          ) : (
            rooms.map((room) => {
              const displayName =
                user?.role === 'STUDENT'
                  ? room.mentor?.user.profile?.name || 'Mentor Support'
                  : room.student?.user.profile?.name || 'Student Query';
              const isSelected = selectedRoom?.id === room.id;

              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-4 hover:bg-google-gray-50 transition-colors flex items-center justify-between outline-none ${
                    isSelected ? 'bg-google-blue-light dark:bg-google-blue/10' : ''
                  }`}
                >
                  <div>
                    <h4 className="font-semibold text-sm text-google-gray-850 dark:text-white">{displayName}</h4>
                    <p className="text-xs text-google-gray-500 mt-0.5 truncate max-w-[150px]">
                      {room.messages && room.messages[0] ? room.messages[0].content : 'Active room'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-google-gray-50 dark:bg-google-gray-900">
        {selectedRoom ? (
          <>
            {/* Header */}
            <div className="h-14 border-b border-google-gray-200 bg-white dark:border-google-gray-800 dark:bg-google-surface-dark px-6 flex items-center justify-between">
              <h4 className="font-bold text-sm text-google-gray-800 dark:text-white">
                {user?.role === 'STUDENT'
                  ? selectedRoom.mentor?.user.profile?.name || 'Mentor Support'
                  : selectedRoom.student?.user.profile?.name || 'Student'}
              </h4>
              {typingStatus && (
                <span className="text-xs text-google-green italic">{typingStatus.name} is typing...</span>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md rounded-2xl p-4 shadow-sm relative ${
                        isMine
                          ? 'bg-google-blue text-white rounded-tr-none dark:bg-google-blue-dark dark:text-google-gray-900'
                          : 'bg-white text-google-gray-850 rounded-tl-none dark:bg-google-surface-dark dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          <CheckCheck className={`h-3 w-3 ${msg.isRead ? 'text-google-green' : 'opacity-70'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t border-google-gray-200 dark:border-google-gray-800 dark:bg-google-surface-dark flex items-center gap-3">
              <button className="rounded-full p-2 text-google-gray-500 hover:bg-google-gray-150 dark:hover:bg-google-gray-800">
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 rounded-full border border-google-gray-300 py-2.5 px-4 text-sm text-google-gray-850 outline-none dark:bg-google-gray-850 dark:border-google-gray-700 dark:text-white"
              />
              <button
                onClick={handleSend}
                className="rounded-full bg-google-blue text-white p-2.5 hover:bg-google-blue/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-google-gray-500">
            Select a doubt support channel from the left pane to start chatting.
          </div>
        )}

        {toastMessage && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setToastMessage('')}
          />
        )}
      </div>
    </div>
  );
};
