import React, { useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Tooltip,
  Fade,
  Zoom,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Lock as LockIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';

const MessageList = ({ 
  messages = [], 
  currentUsername,
  isLoading,
  error
}) => {
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    try {
      const date = new Date(message.timestamp).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    } catch (error) {
      console.error('Error grouping message:', error);
      return groups;
    }
  }, {});

  // Format message time
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday ${date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else {
        return date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
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
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography color="text.secondary">
          Loading messages...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error"
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
          color: 'text.secondary',
          gap: 2
        }}
      >
        <LockIcon sx={{ fontSize: 48, opacity: 0.5 }} />
        <Typography variant="h6" color="text.secondary">
          No messages yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start the conversation securely
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url("/chat-bg.png")',
        backgroundSize: '400px',
        backgroundRepeat: 'repeat'
      }}
    >
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <Box key={date}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              mt: 1
            }}
          >
            <Zoom in={true}>
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 5,
                  backgroundColor: theme.palette.chat.system,
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {date}
                </Typography>
              </Paper>
            </Zoom>
          </Box>

          {dateMessages.map((msg, index) => {
            const isCurrentUser = msg.sender === currentUsername;
            const showAvatar = index === 0 || 
              dateMessages[index - 1].sender !== msg.sender;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <Zoom 
                  key={msg.id} 
                  in={true}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      my: 1
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 5,
                        backgroundColor: theme.palette.chat.system,
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {msg.content}
                      </Typography>
                    </Paper>
                  </Box>
                </Zoom>
              );
            }

            return (
              <Fade 
                key={msg.id} 
                in={true} 
                timeout={300}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                    mb: 1,
                    position: 'relative'
                  }}
                >
                  {!isCurrentUser && showAvatar && (
                    <Zoom in={true}>
                      <Avatar
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          mr: 1,
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {msg.sender[0].toUpperCase()}
                      </Avatar>
                    </Zoom>
                  )}

                  <Box
                    sx={{
                      maxWidth: '70%',
                      ml: !isCurrentUser && !showAvatar ? 5 : 0
                    }}
                  >
                    {showAvatar && (
                      <Typography
                        variant="caption"
                        sx={{
                          ml: 1,
                          color: 'text.secondary',
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        {isCurrentUser ? 'You' : msg.sender}
                      </Typography>
                    )}

                    <Tooltip 
                      title={formatMessageTime(msg.timestamp)}
                      placement={isCurrentUser ? 'left' : 'right'}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          backgroundColor: isCurrentUser 
                            ? theme.palette.primary.main 
                            : theme.palette.background.paper,
                          color: isCurrentUser 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.text.primary,
                          borderRadius: 2,
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            ...(isCurrentUser ? {
                              right: -8,
                              borderWidth: '8px 0 8px 8px',
                              borderColor: `transparent transparent transparent ${theme.palette.primary.main}`
                            } : {
                              left: -8,
                              borderWidth: '8px 8px 8px 0',
                              borderColor: `transparent ${theme.palette.background.paper} transparent transparent`
                            })
                          }
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {msg.content}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 0.5,
                            mt: 0.5,
                            opacity: 0.7
                          }}
                        >
                          {msg.metadata?.encrypted && (
                            <Tooltip title="Encrypted">
                              <LockIcon sx={{ fontSize: 12 }} />
                            </Tooltip>
                          )}
                          {msg.metadata?.edited && (
                            <Tooltip title={`Edited ${formatRelativeTime(msg.metadata.editedAt)}`}>
                              <EditIcon sx={{ fontSize: 12 }} />
                            </Tooltip>
                          )}
                          {isCurrentUser && (
                            <Tooltip title={msg.delivered ? 'Delivered' : 'Sent'}>
                              {msg.delivered ? (
                                <DoneAllIcon sx={{ fontSize: 12 }} />
                              ) : (
                                <DoneIcon sx={{ fontSize: 12 }} />
                              )}
                            </Tooltip>
                          )}
                          <Typography variant="caption">
                            {formatRelativeTime(msg.timestamp)}
                          </Typography>
                        </Box>
                      </Paper>
                    </Tooltip>
                  </Box>
                </Box>
              </Fade>
            );
          })}
        </Box>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
