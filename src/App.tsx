// src/App.tsx
import React, { useState } from "react";

// Auth context + provider
import { AuthProvider, useAuthContext } from "./auth/AuthProvider";

// Use the standalone SignIn / SignUp components (not AuthPage)
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";

type View = "sign-in" | "sign-up";

// Simple protected dashboard shown when user is present
function Dashboard() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-slate-700">
          Welcome, {user?.user_metadata?.full_name || user?.email}
        </h1>

        <p className="mt-3 text-slate-600 text-sm">
          You are logged in. This is your secure dashboard.
        </p>

        <button
          onClick={async () => {
            const { supabase } = await import("./lib/supabaseClient");
            await supabase.auth.signOut();
          }}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// Root component that chooses between auth UI and dashboard
function AppRoot() {
  const { user } = useAuthContext();
  const [view, setView] = useState<View>("sign-in");

  // if logged in, show dashboard
  if (user) return <Dashboard />;

  // not logged in -> show either SignIn or SignUp
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left panel (info + toggles) */}
        <div className="p-8 md:p-10 bg-gradient-to-b from-sky-600 to-indigo-600 text-white flex flex-col justify-center">
          <h1 className="text-3xl font-semibold">Welcome to Scrutiny</h1>
          <p className="mt-4 text-sky-100">Secure sign-in for teachers and students.</p>

          <div className="mt-8 space-x-2">
            <button
              onClick={() => setView("sign-in")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${view === "sign-in" ? "bg-white/90 text-sky-700" : "bg-white/10 text-white/90"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setView("sign-up")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${view === "sign-up" ? "bg-white/90 text-sky-700" : "bg-white/10 text-white/90"}`}
            >
              Create account
            </button>
          </div>

          <div className="mt-6 text-sm text-sky-100">
            <p><strong>Tip:</strong> Students enter MIS, teachers enter Employee ID during sign-up.</p>
          </div>

          <div className="mt-auto text-xs text-white/60">
            <p>Built with ♥ · Electron + Vite + React</p>
          </div>
        </div>

        {/* Right panel (forms) */}
        <div className="p-8 md:p-10">
          {view === "sign-in" ? (
            <>
              <SignIn />
              <div className="mt-4 text-sm text-slate-500">
                Don't have an account?{" "}
                <button className="text-sky-600" onClick={() => setView("sign-up")}>
                  Create account
                </button>
              </div>
            </>
          ) : (
            <>
              <SignUp onAfterSignUp={() => setView("sign-in")} />
              <div className="mt-4 text-sm text-slate-500">
                Already have an account?{" "}
                <button className="text-sky-600" onClick={() => setView("sign-in")}>
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap the app in AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
