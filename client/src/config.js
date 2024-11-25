const config = {
  SERVER_URL: process.env.NODE_ENV === 'production' 
    ? 'https://secure-chat-server.onrender.com' // Replace with your Render.com URL after deployment
    : 'http://localhost:5001',
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://secure-chat-server.onrender.com' // Replace with your Render.com URL after deployment
    : 'http://localhost:5001'
};

export default config;
