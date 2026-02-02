import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Share2,
  Pencil,
  Trash2,
  Plus,
  Settings,
  Check,
  X,
  Upload,
  RotateCcw,
  LogOut,
  BarChart3, // Added BarChart3
} from "lucide-react";
import { deckService } from "../services/deckService";
import { supabase } from "../services/supabase";
import defaultBanner from "../assets/banner.png";
import AnalyticsModal from "./AnalyticsModal";
import DeckDetailPanel from "./DeckDetailPanel";

function DeckList({ decks, loading, onDelete, onUpdate }) {
  const [branding, setBranding] = useState({
    room_name: "Deckly",
    banner_url:
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2000",
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showBrandingMenu, setShowBrandingMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedAnalyticsDeck, setSelectedAnalyticsDeck] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const data = await deckService.getBrandingSettings();
      if (data) {
        setBranding({
          room_name: data.room_name || "Deckly Data Room",
          banner_url: data.banner_url || null,
        });
      }
    } catch (err) {
      console.error("Error loading branding:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleStartEdit = () => {
    setEditValue(branding.room_name);
    setIsEditingTitle(true);
    setShowBrandingMenu(false);
  };

  const handleSaveTitle = async () => {
    if (editValue.trim() && editValue !== branding.room_name) {
      try {
        await deckService.updateBrandingSettings({ room_name: editValue });
        setBranding((prev) => ({ ...prev, room_name: editValue }));
      } catch (err) {
        alert("Failed to update room name: " + err.message);
      }
    }
    setIsEditingTitle(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    setUploading(true);
    setShowBrandingMenu(false);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/branding/banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("decks")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("decks").getPublicUrl(fileName);

      await deckService.updateBrandingSettings({ banner_url: publicUrl });
      setBranding((prev) => ({ ...prev, banner_url: publicUrl }));
    } catch (err) {
      alert("Failed to upload banner: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResetBranding = async () => {
    if (!window.confirm("Reset branding to defaults?")) return;

    try {
      const defaults = { room_name: "Deckly Data Room", banner_url: null };
      await deckService.updateBrandingSettings(defaults);
      setBranding(defaults);
      setShowBrandingMenu(false);
    } catch (err) {
      alert("Failed to reset branding: " + err.message);
    }
  };

  const handleCopyLink = (e, deck) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${deck.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(deck.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const bannerStyle = {
    backgroundImage: `url(${branding.banner_url || defaultBanner})`,
  };

  return (
    <div className="home-page">
      <header className="hero-section" style={bannerStyle}>
        <div className="hero-overlay"></div>

        <div className="branding-controls">
          <button
            className={`customize-btn ${showBrandingMenu ? "active" : ""} ${uploading ? "loading" : ""}`}
            onClick={() => setShowBrandingMenu(!showBrandingMenu)}
            disabled={uploading}
            title="Customize Branding"
          >
            {uploading ? (
              <div className="spinner-small"></div>
            ) : (
              <Settings size={20} />
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleBannerUpload}
          />

          {showBrandingMenu && (
            <div className="branding-menu">
              <h3>Branding Settings</h3>
              <button onClick={handleStartEdit} className="menu-item">
                <Pencil size={16} />
                <span>Edit Room Name</span>
              </button>
              <button
                className="menu-item"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={16} />
                <span>Change Banner</span>
              </button>
              <button className="menu-item" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
              <div className="menu-divider"></div>
              <button
                className="menu-item reset-btn"
                onClick={handleResetBranding}
              >
                <RotateCcw size={16} />
                <span>Reset Defaults</span>
              </button>
            </div>
          )}
        </div>

        <div className="hero-content">
          <div className="title-container">
            {isEditingTitle ? (
              <div className="title-editor">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  autoFocus
                />
                <div className="editor-actions">
                  <button
                    onClick={handleSaveTitle}
                    className="save-btn"
                    title="Save"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="cancel-btn"
                    title="Cancel"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="title-display">
                <h1>{branding.room_name}</h1>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="home-container">
        <div className="deck-list">
          {loading ? (
            <div className="loading">
              <p>Loading decks...</p>
            </div>
          ) : !decks || decks.length === 0 ? (
            <div className="empty-state">
              <h2>No decks available</h2>
              <p>Check back later for updates</p>
            </div>
          ) : (
            <div className="deck-grid">
              {decks.map((deck) => (
                <div key={deck.id} className="deck-card-wrapper">
                  <Link
                    to={`/${deck.slug}`}
                    className={`deck-card ${selectedDeck?.id === deck.id ? "active" : ""}`}
                  >
                    <div className="deck-thumbnail">
                      {deck.pages && deck.pages.length > 0 && (
                        <img
                          src={deck.pages[0]}
                          alt=""
                          className="thumbnail-preview"
                        />
                      )}
                    </div>
                    <div className="deck-card-content">
                      <div className="deck-header-row">
                        <h2>{deck.title}</h2>
                        <div className="card-actions">
                          <button
                            className={`share-deck-btn ${copiedId === deck.id ? "copied" : ""}`}
                            onClick={(e) => handleCopyLink(e, deck)}
                            title="Copy Link"
                          >
                            <Share2 size={16} />
                            <div className="copied-toast">Copied!</div>
                          </button>

                          <button
                            className="analytics-deck-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedAnalyticsDeck(deck);
                            }}
                            title="View Analytics"
                          >
                            <BarChart3 size={16} />
                          </button>

                          <button
                            className="edit-deck-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedDeck(deck);
                            }}
                            title="Quick Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="delete-deck-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDelete(deck);
                            }}
                            title="Delete Deck"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {deck.description ? (
                        <p>{deck.description}</p>
                      ) : (
                        <p>Manage and share this pitch deck.</p>
                      )}
                      <div className="view-link">
                        View Deck <span>→</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Link to="/admin" className="fab-button" title="Upload New Deck">
        <Plus size={32} />
      </Link>

      {selectedDeck && (
        <DeckDetailPanel
          deck={selectedDeck}
          onClose={() => setSelectedDeck(null)}
          onDelete={(deck) => {
            onDelete(deck);
            setSelectedDeck(null);
          }}
          onShowAnalytics={(deck) => {
            setSelectedAnalyticsDeck(deck);
          }}
          onUpdate={(updatedDeck) => {
            onUpdate(updatedDeck);
            setSelectedDeck(updatedDeck);
          }}
        />
      )}

      {selectedAnalyticsDeck && (
        <AnalyticsModal
          deck={selectedAnalyticsDeck}
          onClose={() => setSelectedAnalyticsDeck(null)}
        />
      )}
    </div>
  );
}

export default DeckList;
