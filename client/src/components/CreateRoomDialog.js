import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useTheme,
  Zoom
} from '@mui/material';
import {
  Info as InfoIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const steps = ['Room Details', 'Privacy Settings', 'Review'];

const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 200;

const CreateRoomDialog = ({ open, onClose, onCreateRoom }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate room name
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    if (name.length < 2) {
      setError('Room name must be at least 2 characters');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setError(`Room name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await onCreateRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        maxParticipants
      });
      
      // Reset form
      handleClose();
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.response?.data?.message || 'Error creating room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setName('');
    setDescription('');
    setIsPrivate(true);
    setMaxParticipants(50);
    setError('');
    onClose();
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getRemainingChars = (text, limit) => {
    return limit - text.length;
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Zoom in={true}>
            <Box>
              <TextField
                autoFocus
                label="Room Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                error={name.length > MAX_NAME_LENGTH}
                helperText={`${getRemainingChars(name, MAX_NAME_LENGTH)} characters remaining`}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {isPrivate ? (
                        <Tooltip title="Private Room">
                          <LockIcon color="primary" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Public Room">
                          <PublicIcon color="action" />
                        </Tooltip>
                      )}
                    </Box>
                  )
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                error={description.length > MAX_DESCRIPTION_LENGTH}
                helperText={`${getRemainingChars(description, MAX_DESCRIPTION_LENGTH)} characters remaining`}
              />
            </Box>
          </Zoom>
        );

      case 1:
        return (
          <Zoom in={true}>
            <Box>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  mb: 2,
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 2
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      disabled={isLoading}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>Private Room</Typography>
                      <Tooltip title="Private rooms are only accessible to invited participants">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {isPrivate ? (
                    'Only invited participants can join this room'
                  ) : (
                    'Anyone with access to the chat can join this room'
                  )}
                </Typography>
              </Paper>

              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupIcon />
                  <Typography>Participant Limit</Typography>
                </Box>

                <TextField
                  type="number"
                  fullWidth
                  value={maxParticipants}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 2 && value <= 100) {
                      setMaxParticipants(value);
                    }
                  }}
                  disabled={isLoading}
                  inputProps={{ min: 2, max: 100 }}
                  helperText="Maximum number of participants (2-100)"
                />
              </Paper>
            </Box>
          </Zoom>
        );

      case 2:
        return (
          <Zoom in={true}>
            <Box>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Room Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography>{name}</Typography>
                  </Box>
                  {description && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography>{description}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Privacy
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isPrivate ? <LockIcon /> : <PublicIcon />}
                      <Typography>
                        {isPrivate ? 'Private Room' : 'Public Room'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Participant Limit
                    </Typography>
                    <Typography>{maxParticipants} users</Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Zoom>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">Create New Room</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </Button>
        )}
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading || 
              name.length > MAX_NAME_LENGTH || 
              description.length > MAX_DESCRIPTION_LENGTH}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            Create Room
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!name.trim() || name.length > MAX_NAME_LENGTH}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoomDialog;
