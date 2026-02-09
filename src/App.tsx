import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Viewer from "./pages/Viewer";
import ManageDeck from "./pages/ManageDeck";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

const AppContent = () => {
  const { session, loading, initializationError } = useAuth();
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      timeout = setTimeout(() => setShowSlowMessage(true), 8000);
    }
    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading || initializationError === "connection_slow") {
    return (
      <div className="min-h-screen bg-deckly-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 mb-8 relative">
          <div className="absolute inset-0 border-4 border-deckly-primary/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-deckly-primary rounded-full animate-spin"></div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {showSlowMessage || initializationError === "connection_slow"
            ? "Waking up the Database..."
            : "Initializing Deckly..."}
        </h2>

        <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mb-8">
          {showSlowMessage || initializationError === "connection_slow"
            ? "Supabase free-tier projects sometimes take a few seconds to wake up after being idle. Thanks for your patience!"
            : "Gathering your pitch decks and insights."}
        </p>

        {(showSlowMessage || initializationError === "connection_slow") && (
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10 transition-all active:scale-95"
          >
            Refresh if it's too slow
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deckly-background text-slate-200 selection:bg-deckly-primary/30 selection:text-deckly-primary">
      <Routes>
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!session ? <Signup /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={session ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/upload"
          element={session ? <ManageDeck /> : <Navigate to="/login" />}
        />
        <Route path="/:slug" element={<Viewer />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
