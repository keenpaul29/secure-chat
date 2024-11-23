module.exports = {
  cors: {
    origin: 'https://secure-chat-h08ur4wea-keenpaul29s-projects.vercel.app', // For development, we'll accept all origins. In production, you should specify your Vercel URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
};
