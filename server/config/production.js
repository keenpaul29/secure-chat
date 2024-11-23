module.exports = {
  cors: {
    origin: 'https://secure-chat-client.vercel.app/', // For development, we'll accept all origins. In production, you should specify your Vercel URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
};
