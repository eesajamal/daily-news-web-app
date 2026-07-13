import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ============================================
// MAIN APP
// ============================================

export default function NewsApp() {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [archives, setArchives] = useState([]);
  const [showArchives, setShowArchives] = useState(false);

  // Fetch current news on load
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Fetch news from API
  async function fetchNews() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/news/current`);
      if (!response.ok) throw new Error("Failed to fetch news");

      const data = await response.json();
      setNews(data.data);
      setLastUpdate(new Date(data.fetchedAt).toLocaleString());
      setSearchResults(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Manual refresh
  async function handleRefresh() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/news/refresh`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to refresh news");

      const data = await response.json();
      setNews(data.data);
      setLastUpdate(new Date().toLocaleString());
      setActiveCategory("overview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Search news
  async function handleSearch(query) {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/news/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  // Fetch archives list
  async function loadArchives() {
    try {
      const response = await fetch(`${API_URL}/news/archives`);
      const data = await response.json();
      setArchives(data.archives || []);
    } catch (err) {
      console.error("Failed to load archives:", err);
    }
  }

  // Load archived news
  async function loadArchivedNews(date) {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/news/archive/${date}`);
      if (!response.ok) throw new Error("Failed to load archived news");

      const data = await response.json();
      setNews(data.data);
      setLastUpdate(`${date} (Archived)`);
      setShowArchives(false);
      setActiveCategory("overview");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!news && !loading) {
    return (
      <div className="app-container loading-state">
        <div className="loader">
          <h1>📰 Daily News Update</h1>
          <p>Loading news...</p>
          <button className="btn-primary" onClick={fetchNews}>
            Load News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        loading={loading}
        onShowArchives={() => {
          setShowArchives(!showArchives);
          if (!showArchives) loadArchives();
        }}
        showArchives={showArchives}
      />

      {/* Error */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Archives Panel */}
      {showArchives && (
        <ArchivesPanel archives={archives} onSelect={loadArchivedNews} />
      )}

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} searchQuery={searchQuery} />

      {/* Main Content */}
      {searchResults !== null ? (
        <SearchResults results={searchResults} query={searchQuery} />
      ) : (
        <NewsContent
          news={news}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      )}
    </div>
  );
}

// ============================================
// HEADER COMPONENT
// ============================================

function Header({ lastUpdate, onRefresh, loading, onShowArchives, showArchives }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>📰 Daily News Update</h1>
          <p className="last-update">
            {lastUpdate ? `Last updated: ${lastUpdate}` : "Loading..."}
          </p>
        </div>
        <div className="header-right">
          <button
            className="btn-icon"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh news"
          >
            {loading ? "⏳" : "🔄"} {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className={`btn-icon ${showArchives ? "active" : ""}`}
            onClick={onShowArchives}
            title="View archives"
          >
            📚 Archive
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// SEARCH BAR
// ============================================

function SearchBar({ onSearch, searchQuery }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="🔍 Search news by keyword..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
      {searchQuery && (
        <button
          className="search-clear"
          onClick={() => onSearch("")}
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ============================================
// ARCHIVES PANEL
// ============================================

function ArchivesPanel({ archives, onSelect }) {
  return (
    <div className="archives-panel">
      <h2>📚 News Archives</h2>
      <div className="archives-list">
        {archives.length === 0 ? (
          <p>No archives available</p>
        ) : (
          archives.map((date) => (
            <button
              key={date}
              className="archive-item"
              onClick={() => onSelect(date)}
            >
              {new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// SEARCH RESULTS
// ============================================

function SearchResults({ results, query }) {
  return (
    <div className="search-results">
      <h2>
        🔍 Search Results for "{query}"
        <span className="result-count">({results.length} found)</span>
      </h2>
      {results.length === 0 ? (
        <p className="no-results">No results found. Try a different search term.</p>
      ) : (
        <div className="results-grid">
          {results.map((item, idx) => (
            <NewsCard key={idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// NEWS CONTENT
// ============================================

function NewsContent({ news, activeCategory, onCategoryChange }) {
  if (!news) return <p className="loading">Loading news...</p>;

  const categories = [
    { id: "overview", name: "📊 Overview", icon: "📊" },
    { id: "sriLanka", name: "🇱🇰 Sri Lanka", icon: "🇱🇰" },
    { id: "finance", name: "💼 Finance & Business", icon: "💼" },
    { id: "world", name: "🌍 World News", icon: "🌍" },
  ];

  return (
    <div className="news-content">
      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`tab ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Category Content */}
      <div className="category-content">
        {activeCategory === "overview" && <OverviewSection news={news} />}
        {activeCategory === "sriLanka" && (
          <SriLankaSection news={news.news.sriLanka} />
        )}
        {activeCategory === "finance" && (
          <FinanceSection news={news.news.financeBusinessWorldEconomy} />
        )}
        {activeCategory === "world" && (
          <WorldSection news={news.news.worldNews} />
        )}
      </div>
    </div>
  );
}

// ============================================
// OVERVIEW SECTION
// ============================================

function OverviewSection({ news }) {
  return (
    <div className="overview-section">
      <div className="summary-box">
        <h2>📰 Today's Summary</h2>
        <p className="summary-text">{news.summary}</p>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-number">
              {news.perspectiveStats?.dualPerspectiveNews || 0}
            </span>
            <span className="stat-label">Balanced Perspectives</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {news.perspectiveStats?.totalNews || 0}
            </span>
            <span className="stat-label">Total News Items</span>
          </div>
        </div>
      </div>

      {/* Highlighted dual perspective topics */}
      {news.perspectiveStats?.dualPerspectiveNews > 0 && (
        <div className="dual-perspective-highlight">
          <h3>⚖️ Topics with Multiple Perspectives</h3>
          <ul>
            {news.perspectiveStats?.topics?.map((topic, idx) => (
              <li key={idx}>{topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================
// SRI LANKA SECTION
// ============================================

function SriLankaSection({ news }) {
  return (
    <div className="category-section">
      <SubSection
        title="Political"
        icon="🏛️"
        items={news.political}
      />
      <SubSection
        title="Economical"
        icon="💹"
        items={news.economical}
      />
      <SubSection
        title="Other"
        icon="📰"
        items={news.other}
      />
    </div>
  );
}

// ============================================
// FINANCE SECTION
// ============================================

function FinanceSection({ news }) {
  return (
    <div className="category-section">
      <SubSection
        title="Financial Standards & Regulations"
        icon="⚖️"
        items={news.financialStandards}
      />
      <SubSection
        title="Major Finance News"
        icon="💰"
        items={news.majorFinanceNews}
      />
      <SubSection
        title="Company Decisions"
        icon="🏢"
        items={news.companyDecisions}
      />
      <SubSection
        title="Political & Economic Impacts"
        icon="🌐"
        items={news.politicalEconomicImpacts}
      />
    </div>
  );
}

// ============================================
// WORLD SECTION
// ============================================

function WorldSection({ news }) {
  return (
    <div className="category-section">
      <SubSection
        title="Headlines"
        icon="🔴"
        items={news.headlines}
      />
      <SubSection
        title="Wars & Conflicts"
        icon="⚔️"
        items={news.warsConflicts}
        isDualPerspective={true}
      />
      <SubSection
        title="Cricket"
        icon="🏏"
        items={news.sports?.cricket}
      />
      <SubSection
        title="Football"
        icon="⚽"
        items={news.sports?.football}
      />
    </div>
  );
}

// ============================================
// SUBSECTION
// ============================================

function SubSection({ title, icon, items, isDualPerspective = false }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="subsection">
      <h3 className="subsection-title">
        {icon} {title}
        <span className="item-count">({items.length})</span>
      </h3>

      <div className="items-list">
        {items.map((item, idx) => (
          <div key={idx}>
            {item.hasDualPerspective && item.perspectives ? (
              <DualPerspectiveCard item={item} />
            ) : (
              <NewsCard item={item} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// NEWS CARD (Single Perspective)
// ============================================

function NewsCard({ item }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="news-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <h4 className="card-title">{item.headline}</h4>
        <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="card-content">
          <p className="card-description">{item.description}</p>
          <p className="card-impact">
            <strong>Impact:</strong> {item.impact}
          </p>
          <p className="card-source">{item.source}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// DUAL PERSPECTIVE CARD (Multiple Perspectives)
// ============================================

function DualPerspectiveCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="dual-perspective-card">
      <div className="card-header" onClick={() => setExpanded(!expanded)}>
        <div className="perspective-badge">⚖️ Multiple Perspectives</div>
        <h4 className="card-title">{item.headline}</h4>
        <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="card-content dual-perspective-content">
          <div className="perspective-tabs">
            {item.perspectives.map((perspective, idx) => (
              <button
                key={idx}
                className={`perspective-tab ${activeTab === idx ? "active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                {perspective.side}
              </button>
            ))}
          </div>

          {item.perspectives[activeTab] && (
            <div className="perspective-details">
              <p className="perspective-description">
                {item.perspectives[activeTab].description}
              </p>

              {item.perspectives[activeTab].keyPoints && (
                <div className="key-points">
                  <strong>Key Points:</strong>
                  <ul>
                    {item.perspectives[activeTab].keyPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="perspective-source">
                {item.perspectives[activeTab].source}
              </p>
            </div>
          )}

          <div className="balance-note">
            <p>✓ {item.balanceNote}</p>
          </div>

          {item.impact && (
            <p className="card-impact">
              <strong>Why This Matters:</strong> {item.impact}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
