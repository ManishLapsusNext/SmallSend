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
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-deckly-background flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-deckly-primary/30 border-t-deckly-primary rounded-full animate-spin"></div>
        <p className="font-medium animate-pulse text-slate-400">
          Initializing Deckly...
        </p>
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
