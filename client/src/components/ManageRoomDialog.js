import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const ManageRoomDialog = ({ 
  open, 
  room, 
  onClose, 
  onUpdateRoom,
  currentUserId 
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        config.getApiUrl(`users/search?query=${searchQuery}`),
        config.getRequestConfig(token)
      );
      
      // Filter out users who are already participants
      const existingParticipantIds = room.participants.map(p => p.id);
      const filteredResults = response.data.results.filter(
        user => !existingParticipantIds.includes(user.id)
      );
      
      setSearchResults(filteredResults);
      setError('');
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Error searching users');
      setSearchResults([]);
    }
  }, [searchQuery, room?.participants]);

  useEffect(() => {
    if (open && searchQuery.trim().length >= 2) {
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for search
      const newTimeout = setTimeout(handleSearch, 500);
      setSearchTimeout(newTimeout);

      return () => {
        if (newTimeout) {
          clearTimeout(newTimeout);
        }
      };
    } else {
      setSearchResults([]);
    }
  }, [open, searchQuery, handleSearch, searchTimeout]);

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        config.getApiUrl(`rooms/${room.id}/participants`),
        { participants: selectedUsers.map(u => u.id) },
        config.getRequestConfig(token)
      );

      onUpdateRoom(response.data);
      setSelectedUsers([]);
      setSearchQuery('');
      setActiveTab(0);
    } catch (error) {
      console.error('Error adding participants:', error);
      setError(error.response?.data?.message || 'Error adding participants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        config.getApiUrl(`rooms/${room.id}/participants/${userId}`),
        config.getRequestConfig(token)
      );

      onUpdateRoom(response.data);
    } catch (error) {
      console.error('Error removing participant:', error);
      setError(error.response?.data?.message || 'Error removing participant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    setSearchQuery('');
    setSelectedUsers([]);
    setError('');
    onClose();
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="span">
            {room?.name}
          </Typography>
          <Chip
            icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
            label="Your Room"
            size="small"
            color="primary"
          />
        </Box>
      </DialogTitle>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Participants" />
        <Tab label="Add People" />
      </Tabs>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeTab === 0 && (
          <List>
            {room?.participants.map((participant) => (
              <ListItem key={participant.id}>
                <Avatar sx={{ mr: 2 }}>
                  {participant.username[0].toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {participant.username}
                      {participant.id === room.creator.id && (
                        <Chip
                          icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
                          label="Creator"
                          size="small"
                          color="primary"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption">
                        {formatLastActive(participant.lastActive)}
                      </Typography>
                    </Box>
                  }
                />
                {participant.id !== currentUserId && 
                 participant.id !== room.creator.id && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Remove from room">
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        disabled={isLoading}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}

        {activeTab === 1 && (
          <Box>
            <TextField
              autoFocus
              fullWidth
              label="Search Users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              placeholder="Type at least 2 characters..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 2 }}
            />

            {searchResults.length > 0 && (
              <List>
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <ListItem
                      key={user.id}
                      button
                      onClick={() => {
                        if (isSelected) {
                          setSelectedUsers(prev => 
                            prev.filter(u => u.id !== user.id)
                          );
                        } else {
                          setSelectedUsers(prev => [...prev, user]);
                        }
                      }}
                    >
                      <Avatar sx={{ mr: 2 }}>
                        {user.username[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={user.username}
                        secondary={user.email}
                      />
                      {isSelected && (
                        <ListItemSecondaryAction>
                          <CheckIcon color="primary" />
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <Typography color="text.secondary" align="center">
                No users found
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
        {activeTab === 1 && (
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
            onClick={handleAddParticipants}
            disabled={selectedUsers.length === 0 || isLoading}
          >
            Add Selected ({selectedUsers.length})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ManageRoomDialog;
