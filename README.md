## Secure Chat Application

A real-time, end-to-end encrypted chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- 🔐 End-to-end encryption for messages
- 👥 Private chat rooms
- 🔍 User search functionality
- 👤 User authentication with JWT
- 🚀 Real-time messaging with Socket.IO
- ⏰ Auto-logout on inactivity
- 🌙 Dark mode UI

## Tech Stack

- **Frontend:**
  - React.js
  - Material-UI
  - Socket.IO Client
  - Axios
  - React Router

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB
  - Socket.IO
  - JWT Authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd secure-chat-app
   ```

2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   
   Create `.env` file in the server directory:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

## Project Structure

```
secure-chat-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utility functions
│   │   └── config.js      # Configuration
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Server configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── server.js          # Server entry point
│   └── package.json
└── package.json           # Root package.json
```

## Deployment

### Server Deployment (Render.com)

1. Create a new Web Service
2. Connect your repository
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `NODE_ENV=production`

### Client Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the client directory
3. Follow the prompts

## Security Features

- JWT authentication
- Password hashing
- End-to-end encryption for messages
- Auto-logout on inactivity
- Secure session management

## Development

- Run backend only: `npm run server`
- Run frontend only: `npm run client`
- Run both: `npm run dev`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.#   s e c u r e - c h a t 
 
 
