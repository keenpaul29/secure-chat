import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';

// Polyfill Buffer for crypto operations
window.Buffer = window.Buffer || Buffer;

// Get the root element
const container = document.getElementById('root');

// Create a root
const root = createRoot(container);

// Initial render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot Module Replacement (HMR)
if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>
    );
  });
}

// Handle runtime errors
window.addEventListener('error', (event) => {
  console.error('Runtime error:', event.error);
  
  // Show error UI if needed
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div class="error">
        <h1>Something went wrong</h1>
        <p>The application encountered an error. Please refresh the page.</p>
        ${process.env.NODE_ENV === 'development' ? `<pre>${event.error.stack}</pre>` : ''}
      </div>
    `;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Show error UI if needed
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div class="error">
        <h1>Something went wrong</h1>
        <p>The application encountered an error. Please refresh the page.</p>
        ${process.env.NODE_ENV === 'development' ? `<pre>${event.reason.stack}</pre>` : ''}
      </div>
    `;
  }
});

// Log environment info
console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', process.env.REACT_APP_API_URL);
console.log('Version:', process.env.REACT_APP_VERSION);
