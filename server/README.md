# Secure Chat Server

A high-performance, secure WebSocket-based chat server built with Node.js, Express, Socket.IO, and MongoDB.

## Features

### Core Features
- Real-time messaging with WebSocket support
- End-to-end encryption
- Private rooms
- User authentication and authorization
- Message persistence
- Room management
- User presence tracking
- Activity monitoring

### Performance Features
- Response caching with ETags
- Content compression
- Connection pooling
- Rate limiting
- Load balancing ready
- Memory optimization
- Performance monitoring
- Resource cleanup

### Security Features
- JWT authentication
- Request validation
- Error handling
- CORS protection
- Input sanitization
- XSS prevention
- CSRF protection
- Rate limiting

## Prerequisites

- Node.js >= 14.0.0
- MongoDB >= 4.4
- npm >= 6.14.0

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd secure-chat/server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`

## Development

### Quick Start
```bash
# Start development server
npm run dev

# Start with debugger
npm run dev:debug

# Start with file watching
npm run dev:watch
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Maintenance
```bash
# Clean dependencies
npm run clean

# Clean all (including logs and build)
npm run clean:all

# Reinstall dependencies
npm run reinstall

# Restart server
npm run restart

# Check environment
npm run check
```

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Server
PORT=5001
NODE_ENV=development
LOG_LEVEL=debug

# Database
MONGO_URI=mongodb://...
MONGO_POOL_SIZE=10

# Security
JWT_SECRET=your-secret
ALLOWED_ORIGINS=http://localhost:3000

# Performance
COMPRESSION_LEVEL=6
STATIC_CACHE_MAX_AGE=31536000
```

### Cache Configuration

The server implements a multi-layer caching strategy:

1. Static Assets
- 1 year max age
- Immutable responses
- ETags enabled

2. API Responses
- Private caching
- Must revalidate
- ETags for validation
- Conditional requests

3. Database
- Connection pooling
- Query caching
- Index optimization

### Performance Optimization

1. Response Compression
- gzip/deflate/brotli
- Threshold: 1KB
- Level: 6 (dev) / 9 (prod)

2. Connection Pooling
- MongoDB: 10 connections
- Keepalive enabled
- Timeout handling

3. Rate Limiting
- 100 requests/15min (dev)
- 50 requests/15min (prod)
- Custom error messages

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update user

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms` - Get user's rooms
- `GET /api/rooms/:id` - Get specific room
- `POST /api/rooms/:id/participants` - Add participants
- `DELETE /api/rooms/:id/participants/:userId` - Remove participant
- `DELETE /api/rooms/:id/leave` - Leave room

### Messages
- `GET /api/messages/:roomId` - Get room messages
  - Supports pagination
  - Conditional requests
  - ETags for caching
  - Compression enabled

## WebSocket Events

### Client -> Server
- `joinRoom` - Join room
- `leaveRoom` - Leave room
- `sendMessage` - Send message
- `typing` - User typing

### Server -> Client
- `message` - New message
- `userJoined` - User joined
- `userLeft` - User left
- `typing` - User typing
- `error` - Error occurred

## Performance Monitoring

The server includes built-in performance monitoring:

1. Metrics Collection
- Request latency
- Memory usage
- CPU usage
- Active connections
- Cache hit rates

2. Error Tracking
- Error rates
- Stack traces
- User impact
- Recovery time

3. Resource Usage
- Connection pools
- Memory allocation
- File descriptors
- Network I/O

## Security

See [SECURITY.md](SECURITY.md) for security policies and procedures.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Socket.IO team
- MongoDB team
- Express.js team
- Node.js community

## Support

For support, email support@securechat.com or join our Slack channel.
