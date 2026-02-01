import { useState, useEffect } from "react";
import { X, BarChart3, Clock, Eye, ChevronRight, Loader2 } from "lucide-react";
import { analyticsService } from "../services/analyticsService";

function AnalyticsModal({ deck, onClose }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await analyticsService.getDeckStats(deck.id);
        setStats(data || []);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [deck.id]);

  const totalViews = stats.reduce((acc, curr) => acc + curr.total_views, 0);
  const totalSeconds = stats.reduce(
    (acc, curr) => acc + curr.total_time_seconds,
    0,
  );
  const avgTimePerView =
    totalViews > 0 ? (totalSeconds / totalViews).toFixed(1) : 0;

  // Find max views for scaling the bars
  const maxViews = Math.max(...stats.map((s) => s.total_views), 1);
  const maxTime = Math.max(
    ...stats.map((s) => s.total_time_seconds / (s.total_views || 1)),
    1,
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-title">
            <BarChart3 className="header-icon" />
            <div>
              <h3>Deck Analytics</h3>
              <p>{deck.title}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="modal-loading">
            <Loader2 className="animate-spin" />
            <p>Gathering insights...</p>
          </div>
        ) : (
          <div className="modal-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper blue">
                  <Eye size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Views</span>
                  <span className="stat-value">{totalViews}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper green">
                  <Clock size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Avg. Session</span>
                  <span className="stat-value">{avgTimePerView}s</span>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <div className="chart-header">
                <h4>Engagement per Slide</h4>
                <div className="chart-tabs">
                  <button
                    className={`chart-tab ${activeTab === "views" ? "active" : ""}`}
                    onClick={() => setActiveTab("views")}
                  >
                    Views
                  </button>
                  <button
                    className={`chart-tab ${activeTab === "time" ? "active" : ""}`}
                    onClick={() => setActiveTab("time")}
                  >
                    Avg. Time
                  </button>
                </div>
              </div>

              <div className="chart-body">
                {stats.length === 0 ? (
                  <div className="no-data">
                    <p>No activity recorded yet for this deck.</p>
                  </div>
                ) : (
                  <div className="bar-chart">
                    {stats.map((s) => {
                      const avgTime =
                        s.total_views > 0
                          ? s.total_time_seconds / s.total_views
                          : 0;
                      const viewPercent = (s.total_views / maxViews) * 100;
                      const timePercent = (avgTime / maxTime) * 100;

                      return (
                        <div className="chart-row" key={s.page_number}>
                          <div className="row-label">Pg {s.page_number}</div>
                          <div className="row-bar-container">
                            <div
                              className={`row-bar ${activeTab}`}
                              style={{
                                width: `${activeTab === "views" ? viewPercent : timePercent}%`,
                              }}
                            >
                              <span className="bar-value">
                                {activeTab === "views"
                                  ? s.total_views
                                  : `${avgTime.toFixed(1)}s`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="modal-footer">
          <p>Real-time data synced with PostHog ⚡</p>
          <button className="primary-btn" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 17, 21, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
        }

        .analytics-modal {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          width: 90%;
          max-width: 550px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          color: var(--accent-primary);
        }

        .header-title h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .header-title p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .modal-content {
          padding: 2rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .stat-icon-wrapper.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .chart-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .chart-header h4 {
          font-size: 1rem;
          color: var(--text-primary);
        }

        .chart-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
        }

        .chart-tab {
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: var(--transition-smooth);
        }

        .chart-tab.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .no-data {
          padding: 3rem 1rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .row-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          min-width: 40px;
        }

        .row-bar-container {
          flex: 1;
          height: 24px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          overflow: hidden;
        }

        .row-bar {
          height: 100%;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 8px;
        }

        .row-bar.views { background: linear-gradient(90deg, #6366f1, #818cf8); }
        .row-bar.time { background: linear-gradient(90deg, #10b981, #34d399); }

        .bar-value {
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-footer p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .modal-loading {
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
        }

        .primary-btn {
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default AnalyticsModal;
