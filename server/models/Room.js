const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [2, 'Room name must be at least 2 characters'],
    maxlength: [50, 'Room name cannot exceed 50 characters'],
    validate: {
      validator: function(v) {
        return v != null && v.length > 0;
      },
      message: 'Room name cannot be empty'
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  maxParticipants: {
    type: Number,
    default: 50,
    min: [2, 'Room must allow at least 2 participants'],
    max: [100, 'Room cannot exceed 100 participants']
  }
}, {
  timestamps: true,
  strict: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add creator to participants automatically
roomSchema.pre('save', function(next) {
  if (this.isNew && !this.participants.includes(this.creator)) {
    this.participants.push(this.creator);
  }
  this.lastActivity = new Date();
  next();
});

// Update lastActivity when messages are sent
roomSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  return this.save();
};

// Helper method to check if a user has access to the room
roomSchema.methods.hasAccess = function(userId) {
  if (!userId) return false;
  if (!this.isPrivate) return true;
  if (this.creator.equals(userId)) return true;
  return this.participants.some(p => p.equals(userId));
};

// Helper method to add participants
roomSchema.methods.addParticipants = async function(userIds) {
  const uniqueIds = [...new Set(userIds)];
  
  // Check max participants limit
  if (this.participants.length + uniqueIds.length > this.maxParticipants) {
    throw new Error(`Room cannot exceed ${this.maxParticipants} participants`);
  }

  uniqueIds.forEach(userId => {
    if (!this.participants.includes(userId)) {
      this.participants.push(userId);
    }
  });
  
  this.lastActivity = new Date();
  return this.save();
};

// Helper method to remove participants
roomSchema.methods.removeParticipant = async function(userId) {
  if (this.creator.equals(userId)) {
    throw new Error('Cannot remove room creator');
  }
  
  this.participants = this.participants.filter(p => !p.equals(userId));
  
  if (this.participants.length === 0) {
    await this.model('Room').deleteOne({ _id: this._id });
    return null;
  }
  
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get user's rooms
roomSchema.statics.getUserRooms = async function(userId) {
  return this.find({
    $or: [
      { participants: userId },
      { isPrivate: false }
    ]
  })
  .populate('participants', 'username email lastActive')
  .populate('creator', 'username email')
  .sort({ lastActivity: -1 });
};

// Create model
const Room = mongoose.model('Room', roomSchema);

// Initialize indexes after connection is established
mongoose.connection.once('connected', async () => {
  try {
    // First, ensure any existing data is valid
    const rooms = await Room.find({});
    const invalidRooms = rooms.filter(room => !room.name || !room.creator);
    
    if (invalidRooms.length > 0) {
      console.log('Found invalid rooms, cleaning up...');
      await Room.deleteMany({ $or: [{ name: null }, { creator: null }] });
    }

    // Then create indexes
    await Room.collection.createIndex(
      { name: 1 },
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 },
        sparse: true,
        background: true,
        name: 'name_unique'
      }
    );

    await Room.collection.createIndex(
      { creator: 1, lastActivity: -1 },
      { 
        background: true,
        name: 'creator_lastActivity'
      }
    );

    await Room.collection.createIndex(
      { participants: 1, lastActivity: -1 },
      { 
        background: true,
        name: 'participants_lastActivity'
      }
    );

    await Room.collection.createIndex(
      { isPrivate: 1, lastActivity: -1 },
      { 
        background: true,
        name: 'privacy_lastActivity'
      }
    );

    console.log('Room indexes initialized successfully');
  } catch (err) {
    console.error('Error initializing Room indexes:', err);
    // Don't throw the error - let the application continue
  }
});

module.exports = Room;
