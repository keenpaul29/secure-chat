import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  Box,
  Tooltip,
  Chip,
  Avatar,
  AvatarGroup,
  Paper,
  Zoom,
  useTheme
} from '@mui/material';
import {
  Public as PublicIcon,
  Lock as LockIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Circle as CircleIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';

const RoomList = ({ 
  rooms = [], 
  currentRoom, 
  currentUserId, 
  onJoinRoom, 
  onCreateRoom, 
  onManageRoom 
}) => {
  const theme = useTheme();

  // Format last activity time
  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'No activity';
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
      console.error('Error formatting timestamp:', error);
      return 'Unknown';
    }
  };

  // Check if user is room creator
  const isCreator = (room) => {
    return room?.creator?.id === currentUserId;
  };

  // Get participant count safely
  const getParticipantCount = (room) => {
    return room?.participants?.length || 0;
  };

  // Get room name safely
  const getRoomName = (room) => {
    return room?.name || 'Unnamed Room';
  };

  // Get active participants (mock data for now)
  const getActiveParticipants = (room) => {
    return room?.participants?.filter(p => p.lastActive > Date.now() - 5 * 60 * 1000) || [];
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          background: theme.palette.background.gradient,
          color: 'white'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Secure Chat
          </Typography>
          <Tooltip title="Create New Room">
            <IconButton 
              onClick={onCreateRoom}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            {localStorage.getItem('username')?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {localStorage.getItem('username')}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Online
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ px: 0 }}>
          {/* Global Chat */}
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <ListItem
              button
              selected={currentRoom === 'global'}
              onClick={() => onJoinRoom('global')}
              sx={{ 
                borderRadius: 2,
                mb: 1,
                bgcolor: currentRoom === 'global' ? 'action.selected' : 'background.paper',
                '&:hover': {
                  bgcolor: currentRoom === 'global' ? 'action.selected' : 'action.hover'
                }
              }}
            >
              <ListItemIcon>
                <PublicIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Global Chat
                  </Typography>
                }
                secondary="Public channel for all users"
              />
              <Tooltip title="Notifications enabled">
                <IconButton size="small">
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItem>
          </Zoom>

          <Divider sx={{ my: 2 }}>
            <Chip 
              label="Private Rooms" 
              size="small"
              sx={{ px: 1 }}
            />
          </Divider>

          {/* Private Rooms */}
          {rooms.map((room, index) => (
            <Zoom 
              key={room.id} 
              in={true} 
              style={{ transitionDelay: `${150 + index * 50}ms` }}
            >
              <ListItem
                button
                selected={currentRoom === room.id}
                onClick={() => onJoinRoom(room.id)}
                sx={{ 
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: currentRoom === room.id ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    bgcolor: currentRoom === room.id ? 'action.selected' : 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  <LockIcon color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {getRoomName(room)}
                      </Typography>
                      {isCreator(room) && (
                        <Chip
                          icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
                          label="Owner"
                          size="small"
                          color="primary"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                          {getParticipantCount(room)} participants
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                          {formatLastActivity(room.lastActivity)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <AvatarGroup 
                    max={3}
                    sx={{
                      '& .MuiAvatar-root': {
                        width: 24,
                        height: 24,
                        fontSize: '0.75rem'
                      }
                    }}
                  >
                    {getActiveParticipants(room).map(participant => (
                      <Tooltip 
                        key={participant.id}
                        title={`${participant.username} (Active)`}
                      >
                        <Avatar
                          sx={{ 
                            width: 24, 
                            height: 24,
                            bgcolor: theme.palette.primary.main
                          }}
                        >
                          {participant.username[0].toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                  {isCreator(room) && (
                    <Tooltip title="Manage Room">
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageRoom(room);
                        }}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            </Zoom>
          ))}

          {rooms.length === 0 && (
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2
              }}>
                <LockIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No private rooms yet
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Create a room to start chatting securely with others
                </Typography>
                <Tooltip title="Create New Room">
                  <IconButton 
                    onClick={onCreateRoom}
                    color="primary"
                    sx={{ 
                      bgcolor: 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Zoom>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default RoomList;
