# Market Oracle AI 🔮

**Multi-AI Stock Analysis Platform Powered by Javari AI**

[![Live](https://img.shields.io/badge/Status-Live-success)](https://crav-market-oracle.vercel.app)
[![AIs](https://img.shields.io/badge/AI%20Models-4-blue)](https://crav-market-oracle.vercel.app/ai-picks)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

## 🌐 Live URLs

| Page | URL |
|------|-----|
| **Landing Page** | https://crav-market-oracle.vercel.app |
| **AI Dashboard** | https://crav-market-oracle.vercel.app/ai-picks |

---

## 🚀 What is Market Oracle?

Market Oracle is a **multi-AI stock analysis platform** that aggregates predictions from four leading AI models and synthesizes them into a unified consensus using our proprietary **Javari AI** algorithm.

### Why Multi-AI?

Each AI has different strengths:

| AI Model | Personality | Strengths |
|----------|-------------|-----------|
| **GPT-4** | Conservative | Deep reasoning, nuanced analysis, high precision |
| **Claude** | Balanced | Risk awareness, clear explanations |
| **Gemini** | Technical | Pattern recognition, price targets |
| **Perplexity** | Real-time | Breaking news, web data, sentiment |

**Javari Consensus Engine** weighs each prediction based on:
- Historical accuracy by sector
- Confidence levels
- Market conditions
- Factor performance

---

## 📊 Features

### AI Pick Generation
- Real-time market data from Alpha Vantage
- Parallel AI calls (all 4 models simultaneously)
- Direction prediction (UP/DOWN/HOLD)
- Confidence scores (0-100%)
- Price targets (entry, target, stop-loss)
- Full reasoning and thesis

### Factor Analysis
Each pick includes assessment of:
- P/E Ratio interpretation
- Technical indicators (SMA50, SMA200)
- 52-week position
- Volume analysis
- Market cap context

### Javari Consensus
- Weighted voting across all AIs
- Consensus strength indicator
- Unified confidence score
- Aggregated reasoning

### Learning Pipeline
- Outcome tracking (WIN/LOSS)
- AI accuracy by sector
- Factor performance calibration
- Continuous improvement

---

## 🔌 API Reference

### Generate AI Picks

```bash
POST /api/ai-picks/generate
Content-Type: application/json

{
  "symbol": "AAPL"
}
```

**Response:**
```json
{
  "success": true,
  "symbol": "AAPL",
  "picks": [
    {
      "aiModel": "gpt4",
      "direction": "HOLD",
      "confidence": 55,
      "targetPrice": 280,
      "stopLoss": 260,
      "thesis": "...",
      "fullReasoning": "...",
      "factorAssessments": [...],
      "keyBullishFactors": [...],
      "keyBearishFactors": [...],
      "risks": [...],
      "catalysts": [...]
    }
  ],
  "consensus": {
    "consensusDirection": "HOLD",
    "javariConfidence": 52,
    "consensusStrength": "MODERATE",
    "javariReasoning": "..."
  },
  "aiStatus": {
    "gpt4": "success",
    "gemini": "success",
    "perplexity": "success",
    "claude": "failed"
  }
}
```

### Get Historical Picks

```bash
# Get recent picks
GET /api/ai-picks/generate?limit=20

# Filter by symbol
GET /api/ai-picks/generate?symbol=AAPL

# Filter by AI
GET /api/ai-picks/generate?ai=gemini
```

### Track Outcomes

```bash
# Get pending outcomes
GET /api/outcomes

# Process expired picks
POST /api/outcomes

# Force resolve a pick
POST /api/outcomes
{
  "action": "force-resolve",
  "pickId": "uuid"
}
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | Supabase PostgreSQL |
| **AI Models** | OpenAI GPT-4, Google Gemini, Anthropic Claude, Perplexity |
| **Market Data** | Alpha Vantage API |
| **Hosting** | Vercel |
| **Auth** | Supabase Auth (ready) |

---

## 📁 Project Structure

```
crav-market-oracle/
├── app/
│   ├── page.tsx              # Landing page
│   ├── ai-picks/
│   │   └── page.tsx          # AI Dashboard
│   └── api/
│       ├── ai-picks/
│       │   └── generate/
│       │       └── route.ts  # Pick generation API
│       └── outcomes/
│           └── route.ts      # Outcome tracking API
├── lib/
│   ├── ai/
│   │   └── pick-generator.ts # Multi-AI orchestration
│   ├── learning/
│   │   ├── calibration-engine.ts
│   │   └── javari-consensus.ts
│   └── types/
│       └── learning.ts       # TypeScript definitions
├── components/               # React components
├── docs/                     # Documentation
└── supabase/
    └── migrations/           # Database schema
```

---

## 🗄️ Database Schema

### market_oracle_picks
Stores individual AI predictions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ai_model | TEXT | gpt4, claude, gemini, perplexity |
| symbol | TEXT | Stock ticker |
| direction | TEXT | UP, DOWN, HOLD |
| confidence | INTEGER | 0-100 |
| entry_price | DECIMAL | Price at prediction |
| target_price | DECIMAL | Target price |
| stop_loss | DECIMAL | Stop loss price |
| thesis | TEXT | Short thesis |
| full_reasoning | TEXT | Detailed analysis |
| status | TEXT | PENDING, WIN, LOSS |
| created_at | TIMESTAMP | Creation time |
| expires_at | TIMESTAMP | Expiration time |

### market_oracle_consensus_picks
Stores Javari consensus predictions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| symbol | TEXT | Stock ticker |
| direction | TEXT | Consensus direction |
| ai_combination | TEXT[] | AIs that agreed |
| consensus_strength | DECIMAL | Agreement strength |
| javari_confidence | INTEGER | Weighted confidence |
| status | TEXT | PENDING, WIN, LOSS |

### ai_accuracy_tracking
Tracks AI performance over time.

---

## ⚙️ Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
PERPLEXITY_API_KEY=

# Market Data
ALPHA_VANTAGE_API_KEY=
```

See `.env.example` for full list.

---

## 🚀 Deployment

### Vercel (Recommended)

1. Fork this repository
2. Import to Vercel
3. Add environment variables
4. Deploy

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local

# Run development server
npm run dev
```

---

## 📈 Monetization Options

### SaaS Tiers
- **Free**: 3 analyses/day
- **Pro ($29/mo)**: Unlimited, all AIs, email alerts
- **Enterprise ($199/mo)**: API access, white-label, custom AI weights

### API Access
- Pay-per-call: $0.10/analysis
- Monthly: 1,000 calls for $50

### White-Label
- Financial advisors
- Trading platforms
- Newsletter publishers

---

## 🔐 Security

- API keys stored in environment variables
- Supabase Row Level Security enabled
- No credentials committed to repository
- Rate limiting on API endpoints

---

## 📞 Support

- **Company**: CR AudioViz AI, LLC
- **Website**: https://craudiovizai.com
- **Email**: support@craudiovizai.com

---

## 📜 License

Proprietary - CR AudioViz AI, LLC

---

## 🔄 Changelog

### December 14, 2025
- ✅ Gemini AI integrated (model: gemini-pro-latest)
- ✅ Premium landing page launched
- ✅ Production deployment live
- ✅ 3/4 AIs operational

### December 13, 2025
- ✅ Outcome tracking system
- ✅ Learning pipeline
- ✅ Factor calibration

### November 2025
- ✅ Initial release
- ✅ GPT-4 + Perplexity integration
- ✅ Dashboard UI

---

**Built with ❤️ by CR AudioViz AI**

*Your Story. Our Design.*
