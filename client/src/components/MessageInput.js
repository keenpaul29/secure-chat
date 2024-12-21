import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  Typography,
  Zoom,
  Popper,
  Fade,
  ClickAwayListener,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachIcon,
  Lock as LockIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Mic as MicIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const MAX_MESSAGE_LENGTH = 5000;

const MessageInput = ({ 
  onSendMessage, 
  isLoading = false,
  disabled = false,
  placeholder = "Type a message...",
  isEncrypted = true
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [attachAnchorEl, setAttachAnchorEl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);
  const theme = useTheme();

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading || disabled || isComposing) return;
    if (message.length > MAX_MESSAGE_LENGTH) return;

    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e) => {
    // Handle Enter key (but not with Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getRemainingChars = () => {
    return MAX_MESSAGE_LENGTH - message.length;
  };

  const isOverLimit = () => {
    return message.length > MAX_MESSAGE_LENGTH;
  };

  const handleEmojiClick = (event) => {
    setEmojiAnchorEl(emojiAnchorEl ? null : event.currentTarget);
    setAttachAnchorEl(null);
  };

  const handleAttachClick = (event) => {
    setAttachAnchorEl(attachAnchorEl ? null : event.currentTarget);
    setEmojiAnchorEl(null);
  };

  const handleRecordClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  return (
    <Paper 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ 
        p: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: theme.palette.background.default
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Add emoji">
          <IconButton 
            onClick={handleEmojiClick}
            color={emojiAnchorEl ? 'primary' : 'default'}
            size="small"
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Attach file">
          <IconButton 
            onClick={handleAttachClick}
            color={attachAnchorEl ? 'primary' : 'default'}
            size="small"
          >
            <AttachIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <TextField
          inputRef={inputRef}
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={disabled ? 'Select a room to start chatting' : placeholder}
          disabled={disabled}
          size="small"
          error={isOverLimit()}
          helperText={isOverLimit() && `Message is too long by ${Math.abs(getRemainingChars())} characters`}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper
            }
          }}
          InputProps={{
            sx: { py: 1 },
            endAdornment: (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1,
                  opacity: 0.7,
                  pr: 1
                }}
              >
                {isEncrypted && (
                  <Tooltip title="Messages are encrypted">
                    <LockIcon fontSize="small" color="primary" />
                  </Tooltip>
                )}
                <Typography 
                  variant="caption" 
                  color={isOverLimit() ? 'error' : 'textSecondary'}
                >
                  {getRemainingChars()}
                </Typography>
              </Box>
            )
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, pb: 1 }}>
        <Tooltip title="Record voice message">
          <IconButton 
            onClick={handleRecordClick}
            color={isRecording ? 'error' : 'default'}
            size="small"
          >
            <MicIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={disabled ? 'Select a room to send messages' : 'Send message'}>
          <span>
            <IconButton
              color="primary"
              type="submit"
              disabled={!message.trim() || isLoading || disabled || isComposing || isOverLimit()}
              size="small"
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Emoji Picker Popper */}
      <Popper 
        open={Boolean(emojiAnchorEl)} 
        anchorEl={emojiAnchorEl}
        placement="top-start"
        transition
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={() => setEmojiAnchorEl(null)}>
            <Fade {...TransitionProps} timeout={350}>
              <Paper 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1,
                  maxWidth: 320,
                  maxHeight: 400,
                  overflow: 'auto'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Emoji picker coming soon!
                </Typography>
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>

      {/* Attachment Options Popper */}
      <Popper 
        open={Boolean(attachAnchorEl)} 
        anchorEl={attachAnchorEl}
        placement="top-start"
        transition
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={() => setAttachAnchorEl(null)}>
            <Fade {...TransitionProps} timeout={350}>
              <Paper 
                sx={{ 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <Tooltip title="Coming soon">
                  <IconButton color="primary">
                    <ImageIcon /> 
                    <Typography sx={{ ml: 1 }}>Image</Typography>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Coming soon">
                  <IconButton color="primary">
                    <FileIcon />
                    <Typography sx={{ ml: 1 }}>Document</Typography>
                  </IconButton>
                </Tooltip>
                <Tooltip title="Coming soon">
                  <IconButton color="primary">
                    <TimerIcon />
                    <Typography sx={{ ml: 1 }}>Disappearing Message</Typography>
                  </IconButton>
                </Tooltip>
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </Paper>
  );
};

export default MessageInput;
