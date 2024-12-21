const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Initialize schema with strict validation and no default values
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    validate: {
      validator: function(v) {
        return v != null && v.length > 0;
      },
      message: 'Username cannot be empty'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    validate: {
      validator: function(v) {
        return v != null && v.length > 0;
      },
      message: 'Email cannot be empty'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  publicKey: {
    type: String,
    required: [true, 'Public key is required']
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  strict: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Method to handle failed login attempts
userSchema.methods.handleFailedLogin = async function() {
  this.loginAttempts += 1;
  
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + (60 * 60 * 1000)); // Lock for 1 hour
  }
  
  await this.save();
};

// Method to handle successful login
userSchema.methods.handleSuccessfulLogin = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = new Date();
  this.lastActive = new Date();
  await this.save();
};

// Method to update last active timestamp
userSchema.methods.updateActivity = async function() {
  this.lastActive = new Date();
  await this.save();
};

// Static method to search users
userSchema.statics.searchUsers = async function(query, currentUserId) {
  return this.find({
    $and: [
      { _id: { $ne: currentUserId } },
      { active: true },
      {
        $or: [
          { username: new RegExp(query, 'i') },
          { email: new RegExp(query, 'i') }
        ]
      }
    ]
  })
  .select('username email')
  .limit(10)
  .sort({ lastActive: -1 });
};

// Create model
const User = mongoose.model('User', userSchema);

// Initialize indexes after connection is established
mongoose.connection.once('connected', async () => {
  try {
    // First, ensure any existing data is valid
    const users = await User.find({});
    const invalidUsers = users.filter(user => !user.username || !user.email);
    
    if (invalidUsers.length > 0) {
      console.log('Found invalid users, cleaning up...');
      await User.deleteMany({ $or: [{ username: null }, { email: null }] });
    }

    // Then create indexes
    await User.collection.createIndex(
      { username: 1 },
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 },
        sparse: true,
        background: true,
        name: 'username_unique'
      }
    );

    await User.collection.createIndex(
      { email: 1 },
      { 
        unique: true,
        collation: { locale: 'en', strength: 2 },
        sparse: true,
        background: true,
        name: 'email_unique'
      }
    );

    await User.collection.createIndex(
      { active: 1, lastActive: -1 },
      { 
        background: true,
        name: 'active_lastActive'
      }
    );

    console.log('User indexes initialized successfully');
  } catch (err) {
    console.error('Error initializing User indexes:', err);
    // Don't throw the error - let the application continue
  }
});

module.exports = User;
