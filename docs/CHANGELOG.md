# Changelog

All notable changes to Market Oracle AI are documented in this file.

---

## [1.0.0] - December 14, 2025

### 🚀 Production Release

**Market Oracle AI is LIVE!**

### Added
- **Multi-AI Analysis Engine**
  - GPT-4 integration (OpenAI)
  - Claude integration (Anthropic)
  - Gemini integration (Google AI) - using `gemini-pro-latest`
  - Perplexity integration (real-time web data)

- **Javari Consensus System**
  - Weighted voting algorithm
  - Historical accuracy-based weights
  - Consensus strength indicators
  - Unified confidence scoring

- **Premium Landing Page**
  - Hero section with value proposition
  - AI model showcase cards
  - Quick stock analysis input
  - Feature highlights
  - CR AudioViz AI branding

- **AI Dashboard** (`/ai-picks`)
  - Stock symbol input
  - Real-time multi-AI analysis
  - Expandable pick cards
  - Factor assessments display
  - Bullish/bearish factors
  - Risks and catalysts
  - Javari consensus verdict

- **API Endpoints**
  - `POST /api/ai-picks/generate` - Generate new picks
  - `GET /api/ai-picks/generate` - Get historical picks
  - `GET /api/outcomes` - Get pending outcomes
  - `POST /api/outcomes` - Process expired picks

- **Database Schema**
  - `market_oracle_picks` - Individual AI predictions
  - `market_oracle_consensus_picks` - Javari consensus
  - `ai_accuracy_tracking` - Performance metrics
  - `factor_performance` - Factor calibration

- **Learning Pipeline**
  - Outcome tracking (WIN/LOSS)
  - AI accuracy by sector
  - Factor performance calibration
  - Continuous improvement system

- **Documentation**
  - README.md - Overview and quick start
  - API.md - Complete API reference
  - SETUP.md - Installation and deployment
  - ARCHITECTURE.md - System design
  - LEARNING_SYSTEM.md - AI learning pipeline

### Technical Details
- Next.js 14 with App Router
- TypeScript strict mode
- Tailwind CSS styling
- Supabase PostgreSQL database
- Vercel serverless deployment
- Google AI SDK for Gemini

### Fixed
- Gemini API 404 error - changed model from `gemini-1.5-flash` to `gemini-pro-latest`
- Production domain alias configuration

### Known Issues
- Claude API requires credits (resets weekly)
- Alpha Vantage rate limit (5 calls/minute on free tier)

---

## [0.9.0] - December 13, 2025

### Added
- Outcome tracking system
- Learning pipeline foundation
- Factor calibration engine
- Database migrations for tracking tables

---

## [0.8.0] - December 12, 2025

### Added
- AI Dashboard with pick generation
- GPT-4 and Perplexity integration
- Basic Javari consensus logic
- Pick storage in Supabase

---

## [0.5.0] - November 2025

### Added
- Initial project setup
- Next.js 14 boilerplate
- Supabase connection
- Basic API structure

---

## Roadmap

### v1.1.0 (Planned)
- [ ] User authentication
- [ ] Subscription management
- [ ] Email alerts for picks
- [ ] Custom watchlists

### v1.2.0 (Planned)
- [ ] Mobile responsive improvements
- [ ] Push notifications
- [ ] Social sharing
- [ ] Community voting

### v2.0.0 (Planned)
- [ ] Real-time WebSocket updates
- [ ] Advanced charting
- [ ] Portfolio tracking
- [ ] White-label API

---

## Version Format

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** - Breaking changes
- **MINOR** - New features (backwards compatible)
- **PATCH** - Bug fixes

---

**Built by CR AudioViz AI, LLC**
