const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
    validate: {
      validator: function(v) {
        return v != null && v.length > 0;
      },
      message: 'Message content cannot be empty'
    }
  },
  sender: {
    type: String,
    required: [true, 'Sender is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return v != null && v.length > 0;
      },
      message: 'Sender cannot be empty'
    }
  },
  roomId: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Room ID is required'],
    validate: {
      validator: function(v) {
        return v === 'global' || mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Room ID must be either "global" or a valid ObjectId'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  metadata: {
    encrypted: {
      type: Boolean,
      default: true
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String
  }
}, {
  timestamps: true,
  strict: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save middleware to ensure timestamp
messageSchema.pre('save', function(next) {
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  next();
});

// Static method to get messages for a room
messageSchema.statics.getRoomMessages = async function(roomId, limit = 100) {
  return this.find({ roomId })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
};

// Static method to get global messages
messageSchema.statics.getGlobalMessages = async function(limit = 100) {
  return this.find({ roomId: 'global' })
    .sort({ timestamp: 1 })
    .limit(limit)
    .lean();
};

// Static method to get messages after a certain timestamp
messageSchema.statics.getMessagesSince = async function(roomId, timestamp) {
  return this.find({
    roomId,
    timestamp: { $gt: timestamp }
  })
    .sort({ timestamp: 1 })
    .lean();
};

// Create model
const Message = mongoose.model('Message', messageSchema);

// Initialize indexes after connection is established
mongoose.connection.once('connected', async () => {
  try {
    // First, ensure any existing data is valid
    const messages = await Message.find({});
    const invalidMessages = messages.filter(msg => !msg.content || !msg.sender || !msg.roomId);
    
    if (invalidMessages.length > 0) {
      console.log('Found invalid messages, cleaning up...');
      await Message.deleteMany({ 
        $or: [
          { content: null }, 
          { sender: null }, 
          { roomId: null }
        ] 
      });
    }

    // Then create indexes
    await Message.collection.createIndex(
      { roomId: 1, timestamp: 1 },
      { 
        background: true,
        name: 'room_time'
      }
    );

    await Message.collection.createIndex(
      { sender: 1, timestamp: 1 },
      { 
        background: true,
        name: 'sender_time'
      }
    );

    await Message.collection.createIndex(
      { roomId: 1, sender: 1, timestamp: 1 },
      { 
        background: true,
        name: 'room_sender_time'
      }
    );

    await Message.collection.createIndex(
      { type: 1, timestamp: 1 },
      { 
        background: true,
        name: 'type_time'
      }
    );

    await Message.collection.createIndex(
      { 'metadata.edited': 1, timestamp: 1 },
      { 
        background: true,
        sparse: true,
        name: 'edited_time'
      }
    );

    // TTL index to automatically delete old messages
    await Message.collection.createIndex(
      { timestamp: 1 },
      { 
        expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
        background: true,
        name: 'message_ttl'
      }
    );

    console.log('Message indexes initialized successfully');
  } catch (err) {
    console.error('Error initializing Message indexes:', err);
    // Don't throw the error - let the application continue
  }
});

module.exports = Message;
