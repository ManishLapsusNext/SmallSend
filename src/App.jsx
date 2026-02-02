import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./services/supabase";
import Home from "./pages/Home";
import Viewer from "./pages/Viewer";
import ManageDeck from "./pages/ManageDeck";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing Deckly...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
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
    </Router>
  );
}

export default App;
