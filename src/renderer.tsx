import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global styles, now with Tailwind
import App from './App'; // Import the new App component

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    {/* The App component now contains the AuthProvider 
      and the logic to show Login or your main app.
    */}
    <App />
  </React.StrictMode>
);