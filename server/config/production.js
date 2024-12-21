module.exports = {
  // CORS Configuration - More restrictive in production
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    ],
    maxAge: 24 * 60 * 60 // 24 hours
  },

  // Cache Configuration - Aggressive in production
  cache: {
    // Static assets cache (1 year)
    static: {
      maxAge: 31536000,
      immutable: true,
      etag: true,
      lastModified: true
    },
    // API response cache
    api: {
      private: true,
      mustRevalidate: true,
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 60
    },
    // No cache for dynamic content
    dynamic: {
      noStore: true
    }
  },

  // Compression Configuration - Maximum compression in production
  compression: {
    // Compress everything above 500 bytes
    threshold: 500,
    // Maximum compression
    level: 9,
    // Compress all text-based content
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
      'application/x-httpd-php',
      'application/vnd.ms-fontobject',
      'application/x-font-ttf',
      'application/x-font-opentype',
      'image/svg+xml',
      'image/x-icon',
      'application/x-font-woff'
    ]
  },

  // Rate Limiting Configuration - Stricter in production
  rateLimit: {
    // 15 minutes window
    windowMs: 15 * 60 * 1000,
    // Limit each IP to 50 requests per window
    max: 50,
    // Return rate limit info in headers
    standardHeaders: true,
    // Return remaining time in header
    legacyHeaders: false,
    // Message when limit reached
    message: 'Too many requests, please try again later'
  },

  // Security Configuration - Enhanced in production
  security: {
    // JWT settings
    jwt: {
      expiresIn: '12h', // Shorter token life in production
      algorithm: 'HS256'
    },
    // Password hashing
    bcrypt: {
      saltRounds: 12 // More rounds in production
    },
    // Request size limits
    requestLimits: {
      json: '500kb',
      urlencoded: '500kb'
    },
    // Additional security headers
    headers: {
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      contentSecurity: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    }
  },

  // Logging Configuration - Minimal in production
  logging: {
    // Morgan format
    format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    // Skip successful requests
    skip: {
      paths: ['/health', '/metrics'],
      condition: (req, res) => res.statusCode < 400
    }
  },

  // MongoDB Configuration - Optimized for production
  mongodb: {
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Larger connection pool
      poolSize: 20,
      // Keep alive
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      // Read preference
      readPreference: 'secondaryPreferred',
      // Write concern
      w: 'majority',
      wtimeout: 10000
    }
  },

  // Socket.IO Configuration - Optimized for production
  socketio: {
    // Shorter timeouts
    pingTimeout: 30000,
    pingInterval: 15000,
    upgradeTimeout: 15000,
    // Smaller buffer size
    maxHttpBufferSize: 5e7,
    // WebSocket preferred
    transports: ['websocket'],
    // Allow upgrades
    allowUpgrades: true,
    // Path
    path: '/socket.io',
    // Secure cookie
    cookie: {
      name: 'io',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    }
  },

  // Message Configuration - Stricter limits in production
  messages: {
    // Maximum message length
    maxLength: 3000,
    // Messages per request
    limit: 50,
    // Message retention (days)
    retention: 90,
    // Cache duration (seconds)
    cacheDuration: 300
  },

  // Room Configuration - Stricter limits in production
  rooms: {
    // Maximum participants
    maxParticipants: 30,
    // Maximum rooms per user
    maxPerUser: 5,
    // Room name constraints
    name: {
      minLength: 2,
      maxLength: 30
    }
  },

  // User Configuration - Stricter in production
  users: {
    // Username constraints
    username: {
      minLength: 3,
      maxLength: 20
    },
    // Password constraints
    password: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: true
    },
    // Login attempts before lockout
    maxLoginAttempts: 3,
    // Lockout duration (hours)
    lockoutDuration: 24
  },

  // Feature Flags - Limited in production
  features: {
    fileUpload: false,
    userPresence: true,
    messageEdit: false,
    messageDelete: false,
    roomArchive: true
  }
};
