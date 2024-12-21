module.exports = {
  // CORS Configuration
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'If-None-Match', 
      'If-Modified-Since'
    ],
    exposedHeaders: [
      'ETag', 
      'Last-Modified'
    ]
  },

  // Cache Configuration
  cache: {
    // Static assets cache (1 year)
    static: {
      maxAge: 31536000,
      immutable: true
    },
    // API response cache
    api: {
      private: true,
      mustRevalidate: true,
      maxAge: 0
    },
    // No cache for dynamic content
    dynamic: {
      noStore: true
    }
  },

  // Compression Configuration
  compression: {
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Compression level (1-9, higher = better compression but slower)
    level: 6,
    // Only compress these MIME types
    mimeTypes: [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/x-javascript',
      'application/xml',
      'application/xml+rss',
      'application/x-httpd-php'
    ]
  },

  // Rate Limiting Configuration
  rateLimit: {
    // 15 minutes window
    windowMs: 15 * 60 * 1000,
    // Limit each IP to 100 requests per window
    max: 100,
    // Return rate limit info in headers
    standardHeaders: true,
    // Return remaining time in header
    legacyHeaders: false,
    // Message when limit reached
    message: 'Too many requests from this IP, please try again later'
  },

  // Security Configuration
  security: {
    // JWT settings
    jwt: {
      expiresIn: '24h',
      algorithm: 'HS256'
    },
    // Password hashing
    bcrypt: {
      saltRounds: 10
    },
    // Request size limits
    requestLimits: {
      json: '1mb',
      urlencoded: '1mb'
    }
  },

  // Logging Configuration
  logging: {
    // Morgan format
    format: ':method :url :status :response-time ms - :user :body',
    // Skip logging for these paths
    skip: {
      paths: ['/health', '/metrics'],
      condition: (req, res) => res.statusCode < 400
    }
  },

  // MongoDB Configuration
  mongodb: {
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Connection pool size
      poolSize: 10,
      // Keep alive
      keepAlive: true,
      keepAliveInitialDelay: 300000
    }
  },

  // Socket.IO Configuration
  socketio: {
    // Ping timeout
    pingTimeout: 60000,
    // Ping interval
    pingInterval: 25000,
    // Upgrade timeout
    upgradeTimeout: 30000,
    // Buffer size
    maxHttpBufferSize: 1e8,
    // Transports
    transports: ['websocket', 'polling'],
    // Allow upgrades
    allowUpgrades: true,
    // Path
    path: '/socket.io',
    // Cookie
    cookie: {
      name: 'io',
      path: '/',
      httpOnly: true,
      secure: false
    }
  },

  // Message Configuration
  messages: {
    // Maximum message length
    maxLength: 5000,
    // Messages per request
    limit: 100,
    // Message retention (days)
    retention: 30,
    // Cache duration (seconds)
    cacheDuration: 60
  },

  // Room Configuration
  rooms: {
    // Maximum participants
    maxParticipants: 50,
    // Maximum rooms per user
    maxPerUser: 10,
    // Room name constraints
    name: {
      minLength: 2,
      maxLength: 50
    }
  },

  // User Configuration
  users: {
    // Username constraints
    username: {
      minLength: 3,
      maxLength: 30
    },
    // Password constraints
    password: {
      minLength: 8
    },
    // Login attempts before lockout
    maxLoginAttempts: 5,
    // Lockout duration (hours)
    lockoutDuration: 1
  },

  // Feature Flags
  features: {
    fileUpload: false,
    userPresence: true,
    messageEdit: true,
    messageDelete: true,
    roomArchive: false
  }
};
