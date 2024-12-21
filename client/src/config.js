const config = {
  SERVER_URL: process.env.NODE_ENV === 'production'
    ? 'https://secure-chat-server.onrender.com'
    : 'http://localhost:5001',
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://secure-chat-server.onrender.com'
    : 'http://localhost:5001',
  SHARED_KEY: 'shared-secret-key',
  MESSAGE_LIMIT: 100,
  SOCKET_OPTIONS: {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    secure: process.env.NODE_ENV === 'production',
    rejectUnauthorized: false,
    withCredentials: true
  },
  API_TIMEOUT: 10000,
  ENCRYPTION: {
    enabled: true,
    algorithm: 'aes-256-gcm'
  },
  // Helper functions
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  getApiUrl: (endpoint) => `${config.SERVER_URL}/api/${endpoint}`,
  getSocketUrl: () => config.SOCKET_URL,
  getRequestConfig: (token) => ({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: config.API_TIMEOUT,
    withCredentials: true
  })
};

// Validate config
Object.freeze(config);

export default config;
