import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  Container,
  Drawer
} from '@mui/material';
import { 
  Add as AddIcon, 
  Menu as MenuIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const Chat = () => {
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('global');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const currentUserId = localStorage.getItem('userId');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Fetch rooms on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.SERVER_URL}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const newSocket = io(config.SOCKET_URL, {
      auth: {
        token
      }
    });

    setSocket(newSocket);

    newSocket.on('message', (data) => {
      try {
        const sharedKey = 'shared-secret-key';
        const decryptedContent = decryptMessage(data.content, sharedKey);
        
        setMessages(prev => ({
          ...prev,
          [data.roomId]: [
            ...(prev[data.roomId] || []),
            {
              ...data,
              content: decryptedContent
            }
          ]
        }));
      } catch (error) {
        console.error('Error decrypting message:', error);
      }
    });

    newSocket.on('roomJoined', (roomId) => {
      console.log(`Joined room: ${roomId}`);
    });

    newSocket.on('userJoined', (data) => {
      console.log(`${data.username} joined room: ${data.roomId}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message === 'Authentication error') {
        navigate('/login');
      }
    });

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again.');
        navigate('/login');
        return;
      }

      console.log('Creating room:', newRoomName);
      const response = await axios.post(
        `${config.SERVER_URL}/api/rooms`,
        { 
          name: newRoomName,
          participants: [] // Start with just the creator
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Room creation response:', response.data);

      if (response.data) {
        setRooms(prev => [...prev, response.data]);
        setNewRoomName('');
        setCreateRoomOpen(false);

        // Join the newly created room
        if (socket) {
          console.log('Joining new room:', response.data._id);
          socket.emit('joinRoom', response.data._id);
          setCurrentRoom(response.data._id);
        } else {
          console.error('Socket not connected');
          alert('Socket connection error. Please refresh the page.');
        }
      }
    } catch (error) {
      console.error('Error creating room:', {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      alert(error.response?.data?.message || 'Error creating room. Please try again.');
    }
  };

  const handleJoinRoom = (roomId) => {
    socket.emit('joinRoom', roomId);
    setCurrentRoom(roomId);
    setDrawerOpen(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket && currentRoom) {
      try {
        const sharedKey = 'shared-secret-key';
        const encryptedContent = encryptMessage(message, sharedKey);
        
        socket.emit('sendMessage', {
          content: encryptedContent,
          sender: localStorage.getItem('username'),
          room: currentRoom
        });

        setMessages(prev => ({
          ...prev,
          [currentRoom]: [
            ...(prev[currentRoom] || []),
            {
              content: message,
              sender: localStorage.getItem('username'),
              timestamp: new Date()
            }
          ]
        }));
        
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Add function to search users
  const handleSearchUsers = async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.SERVER_URL}/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Error searching users');
    }
  };

  // Add function to add participant to room
  const handleAddParticipant = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.SERVER_URL}/api/rooms/${selectedRoom._id}/participants`,
        { participants: [userId] },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Update the rooms list with the new participant
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room._id === selectedRoom._id ? response.data : room
        )
      );

      setAddParticipantOpen(false);
      setSearchUser('');
      setSearchResults([]);
      alert('Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      alert(error.response?.data?.message || 'Error adding participant');
    }
  };

  const handleMenuClose = () => {
    setSelectedRoom(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('privateKey');
    navigate('/login');
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Secure Chat
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            title="Logout"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              {currentRoom === 'global' ? 'Global Chat' : rooms.find(r => r._id === currentRoom)?.name || 'Chat'}
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, p: 2 }}>
            {(messages[currentRoom] || []).map((msg, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 1,
                  ml: msg.sender === localStorage.getItem('username') ? 'auto' : 0,
                  mr: msg.sender === localStorage.getItem('username') ? 0 : 'auto',
                  maxWidth: '70%',
                  backgroundColor: msg.sender === localStorage.getItem('username') 
                    ? 'primary.dark'
                    : 'background.paper',
                  wordBreak: 'break-word'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  {msg.sender}
                </Typography>
                <Typography variant="body1">{msg.content}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box component="form" onSubmit={sendMessage} sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              autoComplete="off"
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!message.trim()}
            >
              Send
            </Button>
          </Box>
        </Paper>

        {/* Room Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 250, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Rooms</Typography>
              <IconButton onClick={() => setCreateRoomOpen(true)}>
                <AddIcon />
              </IconButton>
            </Box>
            <Divider />
            <List>
              <ListItem
                button
                selected={currentRoom === 'global'}
                onClick={() => {
                  setCurrentRoom('global');
                  setDrawerOpen(false);
                }}
              >
                <ListItemText primary="Global Chat" />
              </ListItem>
              {rooms.map((room) => (
                <ListItem
                  key={room._id}
                  button
                  selected={currentRoom === room._id}
                  onClick={() => handleJoinRoom(room._id)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <ListItemText 
                    primary={room.name}
                    secondary={`${room.participants.length} participants`}
                  />
                  {room.creator._id === currentUserId && (
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoom(room);
                        setAddParticipantOpen(true);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Add Participant Dialog */}
        <Dialog 
          open={addParticipantOpen} 
          onClose={() => {
            setAddParticipantOpen(false);
            setSearchUser('');
            setSearchResults([]);
          }}
        >
          <DialogTitle>Add Participant</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Search Users"
              fullWidth
              value={searchUser}
              onChange={(e) => {
                setSearchUser(e.target.value);
                if (e.target.value.trim()) {
                  handleSearchUsers(e.target.value);
                } else {
                  setSearchResults([]);
                }
              }}
            />
            <List>
              {searchResults.map((user) => (
                <ListItem key={user._id} button onClick={() => handleAddParticipant(user._id)}>
                  <ListItemText 
                    primary={user.username}
                    secondary={user.email}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddParticipantOpen(false);
              setSearchUser('');
              setSearchResults([]);
            }}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Room Dialog */}
        <Dialog open={createRoomOpen} onClose={() => setCreateRoomOpen(false)}>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Room Name"
              fullWidth
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateRoomOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Chat;
