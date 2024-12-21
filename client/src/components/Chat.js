import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Container,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import config from '../config';
import { encryptMessage, decryptMessage } from '../utils/encryption';

// Import components
import RoomList from './RoomList';
import CreateRoomDialog from './CreateRoomDialog';
import ManageRoomDialog from './ManageRoomDialog';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const Chat = () => {
  // State
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState({});
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('global');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [manageRoomOpen, setManageRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const currentUserId = localStorage.getItem('userId');
  const currentUsername = localStorage.getItem('username');
  const navigate = useNavigate();

  // Message handlers
  const handleIncomingMessage = useCallback(async (data) => {
    try {
      console.log('Received message:', data);
      const decryptedContent = data.type === 'system' ? 
        data.content : 
        await decryptMessage(data.content, config.SHARED_KEY);

      setMessages(prev => {
        const roomMessages = prev[data.roomId] || [];
        if (roomMessages.some(msg => msg._id === data._id)) {
          return prev;
        }

        return {
          ...prev,
          [data.roomId]: [
            ...roomMessages,
            {
              ...data,
              content: decryptedContent,
              metadata: {
                ...data.metadata,
                encrypted: data.type !== 'system'
              }
            }
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        };
      });
    } catch (error) {
      console.error('Error handling message:', error);
      setError('Error processing message');
    }
  }, []);

  // Fetch message history
  const fetchMessageHistory = useCallback(async (roomId) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        config.getApiUrl(`messages/${roomId}`),
        config.getRequestConfig(token)
      );

      // Handle the new response format which includes messages and metadata
      const { messages: responseMessages = [], metadata = {} } = response.data || {};

      if (!Array.isArray(responseMessages)) {
        console.error('Invalid messages format:', response.data);
        throw new Error('Invalid response format');
      }

      const decryptedMessages = await Promise.all(
        responseMessages.map(async msg => ({
          ...msg,
          content: msg.type === 'system' ? 
            msg.content : 
            await decryptMessage(msg.content, config.SHARED_KEY),
          metadata: {
            ...msg.metadata,
            encrypted: msg.type !== 'system'
          }
        }))
      );

      setMessages(prev => ({
        ...prev,
        [roomId]: decryptedMessages
      }));

      // Update room info if available
      if (metadata?.room) {
        setRooms(prev => 
          prev.map(room => 
            room.id === metadata.room.id ? 
              { ...room, ...metadata.room } : 
              room
          )
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        setCurrentRoom('global');
        socket?.emit('joinGlobalChat');
      }
      setError('Error loading messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [socket]);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          config.getApiUrl('rooms'),
          config.getRequestConfig(token)
        );
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Error loading rooms');
        }
      }
    };

    fetchRooms();
  }, [navigate]);

  // Socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!socket) {
      const newSocket = io(config.SOCKET_URL, {
        auth: { token },
        ...config.SOCKET_OPTIONS
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnecting(false);
        setIsReconnecting(false);
        setConnectionAttempts(0);
        newSocket.emit('joinGlobalChat');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionAttempts(prev => prev + 1);
        setIsReconnecting(true);
        if (error.message === 'Authentication error') {
          navigate('/login');
        } else {
          setError('Connection error');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsReconnecting(true);
      });

      newSocket.on('message', handleIncomingMessage);
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setError(error.message);
      });
      newSocket.on('userJoined', (data) => {
        handleIncomingMessage({
          id: Date.now().toString(),
          content: `${data.username} joined the room`,
          timestamp: new Date().toISOString(),
          type: 'system',
          roomId: data.roomId
        });
      });
      newSocket.on('userLeft', (data) => {
        handleIncomingMessage({
          id: Date.now().toString(),
          content: `${data.username} left the room`,
          timestamp: new Date().toISOString(),
          type: 'system',
          roomId: data.roomId
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.off('message');
        newSocket.off('error');
        newSocket.off('connect_error');
        newSocket.off('userJoined');
        newSocket.off('userLeft');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.close();
      };
    }
  }, [navigate, socket, handleIncomingMessage]);

  // Load initial messages when room changes
  useEffect(() => {
    if (currentRoom && !isReconnecting) {
      fetchMessageHistory(currentRoom);
    }
  }, [currentRoom, fetchMessageHistory, isReconnecting]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || !socket || !currentRoom || isReconnecting) return;

    setIsSendingMessage(true);
    try {
      const encryptedContent = await encryptMessage(
        content,
        config.SHARED_KEY
      );

      socket.emit('sendMessage', {
        content: encryptedContent,
        sender: currentUsername,
        roomId: currentRoom,
        timestamp: new Date().toISOString(),
        metadata: {
          encrypted: true
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Room handlers
  const handleCreateRoom = async (roomData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        config.getApiUrl('rooms'),
        roomData,
        config.getRequestConfig(token)
      );

      setRooms(prev => [...prev, response.data]);
      setCurrentRoom(response.data.id);
      socket?.emit('joinRoom', response.data.id);
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      setCurrentRoom(roomId);
      if (roomId === 'global') {
        socket?.emit('joinGlobalChat');
      } else {
        socket?.emit('joinRoom', roomId);
      }
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Error joining room');
    }
  };

  const handleUpdateRoom = (updatedRoom) => {
    setRooms(prev => 
      prev.map(room => 
        room.id === updatedRoom.id ? updatedRoom : room
      )
    );
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.clear();
    navigate('/login');
  };

  if (isConnecting) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Connecting to server...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {isReconnecting && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            p: 1,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <WifiOffIcon />
          <Typography>
            Connection lost. Attempting to reconnect...
            {connectionAttempts > 0 && ` (Attempt ${connectionAttempts})`}
          </Typography>
        </Box>
      )}

      <AppBar 
        position="fixed"
        sx={{
          top: isReconnecting ? '40px' : 0,
          transition: 'top 0.3s'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {currentRoom === 'global' ? 'Global Chat' : 
                rooms.find(r => r.id === currentRoom)?.name || 'Chat'}
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              title="Logout"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <RoomList
          rooms={rooms}
          currentRoom={currentRoom}
          currentUserId={currentUserId}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={() => setCreateRoomOpen(true)}
          onManageRoom={(room) => {
            setSelectedRoom(room);
            setManageRoomOpen(true);
          }}
        />
      </Drawer>

      <Container 
        maxWidth="md" 
        sx={{ 
          mt: isReconnecting ? 12 : 8,
          mb: 2,
          transition: 'margin-top 0.3s'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            height: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            opacity: isReconnecting ? 0.7 : 1,
            transition: 'opacity 0.3s'
          }}
        >
          <MessageList
            messages={messages[currentRoom] || []}
            currentUsername={currentUsername}
            isLoading={isLoadingMessages}
            error={error}
          />

          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isSendingMessage}
            disabled={!currentRoom || isReconnecting}
            placeholder={isReconnecting ? 'Reconnecting...' : undefined}
          />
        </Paper>
      </Container>

      <CreateRoomDialog
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      {selectedRoom && (
        <ManageRoomDialog
          open={manageRoomOpen}
          room={selectedRoom}
          currentUserId={currentUserId}
          onClose={() => {
            setManageRoomOpen(false);
            setSelectedRoom(null);
          }}
          onUpdateRoom={handleUpdateRoom}
        />
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;
