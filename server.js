require("dotenv").config();
const express = require("express");
const cors = require("cors");
const schedule = require("node-schedule");
const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

// ============================================
// INITIALIZATION
// ============================================

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directories exist
const dataDir = path.join(__dirname, "data");
const archiveDir = path.join(dataDir, "archives");
const logsDir = path.join(dataDir, "logs");

[dataDir, archiveDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configuration
const CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4-6",
  scheduleTime: process.env.SCHEDULE_TIME || "0 9 * * *", // 9 AM daily
};

// In-memory cache (consider Redis for production)
let currentNews = null;
let lastFetchTime = null;

// ============================================
// LOGGER
// ============================================

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);

  const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + "\n");
}

// ============================================
// NEWS FETCHING WITH DUAL PERSPECTIVES
// ============================================

async function fetchNewsWithDualPerspectives() {
  const client = new Anthropic({
    apiKey: CONFIG.apiKey,
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const systemPrompt = `You are a professional news curator specializing in balanced, verified news with dual perspectives on controversial topics.

YOUR CORE RESPONSIBILITY:
For ANY topic with two or more legitimate perspectives (political conflicts, wars, policy debates, controversial events), you MUST include BOTH perspectives with equal weight and credibility.

EXAMPLES OF DUAL PERSPECTIVE TOPICS:
- Palestine-Israel conflicts → Include Palestinian perspective AND Israeli perspective
- Ukraine-Russia situation → Include Ukrainian perspective AND Russian perspective  
- Political events → Include opposing party perspectives
- Policy decisions → Include supporter AND critic perspectives
- Controversial figures → Include supporters AND critics
- Any geopolitical issue → Include all legitimate perspectives

RULES FOR SOURCES:
- Tier 1 (Highest Priority): Reuters, Bloomberg, AP, BBC, Financial Times, The Guardian
- Tier 2 (Regional): Daily FT, The Island, Business Today, The Hindu, Dawn, Al Jazeera, Middle East Eye
- EXCLUDE: Tabloids, unverified blogs, propaganda, state-only sources for wars
- CITE SOURCES: Always include [Source: X] for each perspective
- VERIFICATION: Include if corroborated by 2+ sources OR 1 official source

OUTPUT FORMAT - MUST BE VALID JSON:
{
  "date": "${dateStr}",
  "generatedAt": "ISO timestamp",
  "news": {
    "sriLanka": {
      "political": [
        {
          "headline": "Brief title",
          "description": "1-2 sentence explanation",
          "source": "[Source name]",
          "impact": "Why this matters",
          "hasDualPerspective": false
        }
      ],
      "economical": [],
      "other": []
    },
    "financeBusinessWorldEconomy": {
      "financialStandards": [],
      "majorFinanceNews": [],
      "companyDecisions": [],
      "politicalEconomicImpacts": []
    },
    "worldNews": {
      "headlines": [],
      "warsConflicts": [
        {
          "headline": "Brief title of the conflict/event",
          "hasDualPerspective": true,
          "perspectives": [
            {
              "side": "Perspective A label (e.g., Palestinian View)",
              "description": "This perspective believes/reports...",
              "keyPoints": ["Point 1", "Point 2"],
              "source": "[Source name]",
              "emotion": "factual/concerned/critical"
            },
            {
              "side": "Perspective B label (e.g., Israeli View)",
              "description": "This perspective believes/reports...",
              "keyPoints": ["Point 1", "Point 2"],
              "source": "[Source name]",
              "emotion": "factual/concerned/defensive"
            }
          ],
          "impact": "Why both perspectives matter",
          "balanceNote": "Both perspectives are legitimate viewpoints held by major parties"
        }
      ],
      "sports": {
        "cricket": [],
        "football": []
      }
    }
  },
  "summary": "2-3 sentence overview of the most significant news",
  "perspectiveStats": {
    "totalNews": 0,
    "dualPerspectiveNews": 0,
    "topics": ["list of controversial topics covered"]
  }
}

CRITICAL REMINDERS:
1. NEVER take one-sided stance on conflicts
2. ALWAYS include multiple legitimate perspectives for controversial topics
3. Label each perspective clearly (e.g., "View A", "View B", or specific names)
4. Include diverse sources - not all sources favor one side
5. Be factual and neutral in descriptions
6. If a topic has 3+ perspectives, include the major ones (up to 3)`;

  const userPrompt = `Please compile comprehensive daily news updates from ${dateStr} across all categories.

SPECIAL EMPHASIS ON DUAL PERSPECTIVES:
- Any news item about wars, conflicts, political events, or controversial decisions MUST include perspectives from all major parties involved
- Include "Palestinian view", "Israeli view" for Middle East coverage
- Include "Ukrainian view", "Russian view" for Ukraine coverage  
- Include different political party perspectives for political news
- Include supporter and critic perspectives for controversial topics
- Be absolutely balanced - give equal prominence to all legitimate viewpoints

Focus on:
1. Sri Lanka's political developments, economic indicators, and major headlines
2. Global finance, business decisions, major economic shifts, and their impacts
3. World's significant headlines, ongoing conflicts/wars (with dual perspectives), and major sports events

Search for news from yesterday (${dateStr}) only. Be thorough but concise.
Return ONLY valid JSON, no markdown formatting.`;

  try {
    log("INFO", "Starting news fetch with dual perspectives for " + dateStr);

    const response = await client.messages.create({
      model: CONFIG.model,
      max_tokens: 5000,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    let newsContent = "";
    for (const block of response.content) {
      if (block.type === "text") {
        newsContent = block.text;
        break;
      }
    }

    // Clean JSON
    newsContent = newsContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Parse and validate JSON
    let newsData;
    try {
      newsData = JSON.parse(newsContent);
    } catch (e) {
      log("ERROR", "Failed to parse JSON response: " + e.message);
      throw new Error("Invalid JSON from Claude API");
    }

    log("INFO", "News fetch completed successfully");
    log("INFO", `Dual perspective stories: ${newsData.perspectiveStats?.dualPerspectiveNews || 0}`);
    
    return newsData;
  } catch (error) {
    log("ERROR", "Failed to fetch news: " + error.message);
    throw error;
  }
}

// ============================================
// SAVE AND CACHE NEWS
// ============================================

function saveNews(newsData) {
  const filename = `news-${newsData.date}.json`;
  const filepath = path.join(archiveDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(newsData, null, 2));
  
  // Update cache
  currentNews = newsData;
  lastFetchTime = new Date().toISOString();
  
  log("INFO", `News saved to ${filepath}`);
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    lastNewsUpdate: lastFetchTime,
  });
});

// Get current news
app.get("/api/news/current", (req, res) => {
  if (!currentNews) {
    return res.status(404).json({
      error: "No news available yet",
      message: "News will be fetched at the scheduled time",
    });
  }

  res.json({
    success: true,
    data: currentNews,
    fetchedAt: lastFetchTime,
  });
});

// Get news by date
app.get("/api/news/archive/:date", (req, res) => {
  const { date } = req.params;
  const filename = `news-${date}.json`;
  const filepath = path.join(archiveDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({
      error: "News not found",
      date: date,
    });
  }

  const newsData = JSON.parse(fs.readFileSync(filepath, "utf8"));
  res.json({
    success: true,
    data: newsData,
  });
});

// List available archives
app.get("/api/news/archives", (req, res) => {
  const files = fs.readdirSync(archiveDir);
  const archives = files
    .filter(f => f.startsWith("news-") && f.endsWith(".json"))
    .map(f => f.replace("news-", "").replace(".json", ""))
    .sort()
    .reverse();

  res.json({
    success: true,
    archives: archives,
    total: archives.length,
  });
});

// Manual refresh (trigger news fetch)
app.post("/api/news/refresh", async (req, res) => {
  try {
    log("INFO", "Manual refresh triggered");
    const newsData = await fetchNewsWithDualPerspectives();
    saveNews(newsData);

    res.json({
      success: true,
      message: "News refreshed successfully",
      data: newsData,
    });
  } catch (error) {
    log("ERROR", "Manual refresh failed: " + error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Search news
app.get("/api/news/search", (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      error: "Search query too short",
    });
  }

  if (!currentNews) {
    return res.status(404).json({
      error: "No news available",
    });
  }

  const searchTerm = q.toLowerCase();
  const results = [];

  // Search through all news items
  const searchInCategory = (category, categoryName) => {
    if (Array.isArray(category)) {
      category.forEach(item => {
        if (
          item.headline.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm)
        ) {
          results.push({
            ...item,
            category: categoryName,
          });
        }
      });
    } else if (typeof category === "object") {
      Object.entries(category).forEach(([key, value]) => {
        searchInCategory(value, `${categoryName} > ${key}`);
      });
    }
  };

  Object.entries(currentNews.news).forEach(([key, value]) => {
    searchInCategory(value, key);
  });

  res.json({
    success: true,
    query: q,
    results: results,
    total: results.length,
  });
});

// Get stats
app.get("/api/stats", (req, res) => {
  if (!currentNews) {
    return res.json({
      error: "No news available yet",
    });
  }

  res.json({
    success: true,
    date: currentNews.date,
    generatedAt: currentNews.generatedAt,
    perspectiveStats: currentNews.perspectiveStats,
    lastFetch: lastFetchTime,
  });
});

// ============================================
// SCHEDULER
// ============================================

function startScheduler() {
  log("INFO", "Initializing scheduler...");

  const job = schedule.scheduleJob(CONFIG.scheduleTime, async () => {
    log("INFO", "=== Scheduled news update started ===");
    try {
      const newsData = await fetchNewsWithDualPerspectives();
      saveNews(newsData);
      log("INFO", "=== Scheduled news update completed ===");
    } catch (error) {
      log("ERROR", `=== Scheduled news update failed: ${error.message} ===`);
    }
  });

  log("INFO", `✅ Scheduler active. Next run: ${job.nextInvocation()}`);
  return job;
}

// ============================================
// SERVER STARTUP
// ============================================

function start() {
  log("INFO", "🚀 Daily News Web App Starting...");

  if (!CONFIG.apiKey) {
    log("ERROR", "ANTHROPIC_API_KEY not set!");
    process.exit(1);
  }

  // Start scheduler
  startScheduler();

  // Start Express server
  app.listen(PORT, () => {
    log("INFO", `✅ Server running on http://localhost:${PORT}`);
    log("INFO", "📡 API available at http://localhost:${PORT}/api");
    log("INFO", "💡 Use /api/news/refresh to manually fetch news");
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    log("INFO", "Shutting down gracefully...");
    process.exit(0);
  });
}

start();
