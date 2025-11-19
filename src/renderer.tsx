import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// Import your components
import Dashboard, { StudentDashboard } from './components/StudentDashboard.tsx';
import { TeacherDashboard } from './components/TeacherDashboard.tsx';
import AuthPage from './auth/AuthPage.tsx';
import { SignIn, SignUp } from '@supabase/auth-ui-react';
import { AuthProvider } from './auth/AuthProvider.tsx';
import App from "./App.tsx";
import { supabase } from './lib/supabaseClient.ts';

// SECURITY: Clear all persistent data on app launch
// This ensures the app starts fresh every time for security reasons
(async () => {
  try {
    console.log('[Security] Clearing all persistent data on app launch...');
    
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
      console.log('[Security] localStorage cleared');
    }
    
    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
      console.log('[Security] sessionStorage cleared');
    }
    
    // Sign out from Supabase to clear any auth state
    await supabase.auth.signOut();
    console.log('[Security] Supabase session cleared');
    
    console.log('[Security] All persistent data cleared successfully');
  } catch (error) {
    console.error('[Security] Error clearing persistent data:', error);
    // Continue anyway to not block app startup
  }
  
  // Now render the app with clean state
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      {/* The App component now contains the AuthProvider 
        and the logic to show Login or your main app.
      */}
      <App />
    </React.StrictMode>
  );
})();