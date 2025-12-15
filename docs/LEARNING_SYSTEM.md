# Market Oracle AI - Learning System

**The Self-Improving AI Stock Analysis Engine**

Last Updated: December 14, 2025

---

## Overview

Market Oracle AI doesn't just make predictions—it **learns from them**. Our learning pipeline tracks every pick, measures outcomes, and continuously calibrates AI weights to improve accuracy over time.

---

## System Components

### 1. Outcome Tracking

Every AI pick has a lifecycle:

```
PENDING → (time passes) → WIN or LOSS
```

**Outcome Determination:**
```typescript
// For UP predictions
if (exitPrice >= targetPrice) → WIN
if (exitPrice <= stopLoss) → LOSS
if (expired && exitPrice > entryPrice) → WIN
if (expired && exitPrice <= entryPrice) → LOSS

// For DOWN predictions (inverse logic)
if (exitPrice <= targetPrice) → WIN
if (exitPrice >= stopLoss) → LOSS
```

### 2. AI Accuracy Tracking

We track each AI's performance:

| Metric | Description |
|--------|-------------|
| Total Picks | Number of resolved predictions |
| Correct Picks | Predictions that were WIN |
| Accuracy | Correct / Total (percentage) |
| Avg Confidence | Mean confidence on predictions |
| Sector Accuracy | Performance by sector |

**Database Table:** `ai_accuracy_tracking`
```sql
ai_model: TEXT
sector: TEXT (nullable for overall)
total_picks: INTEGER
correct_picks: INTEGER
accuracy: DECIMAL
avg_confidence: DECIMAL
last_updated: TIMESTAMP
```

### 3. Factor Performance

We track which factors are predictive:

| Factor | Description |
|--------|-------------|
| P/E Ratio | Price-to-earnings assessment |
| Technical SMA | Moving average signals |
| 52-Week Position | Range position analysis |
| Volume | Volume vs average |
| Momentum | Recent price action |

**Learning Questions:**
- When an AI says "P/E is bullish," how often is it right?
- Do technical signals work better for tech stocks?
- Which factors are most predictive by sector?

---

## Calibration Engine

### How It Works

1. **Collect Historical Data**
   - Get all resolved picks for an AI
   - Group by sector

2. **Calculate Accuracy**
   ```typescript
   accuracy = correctPicks / totalPicks
   ```

3. **Identify Best/Worst Sectors**
   ```typescript
   bestSectors = sectors.filter(s => s.accuracy > 0.6)
   worstSectors = sectors.filter(s => s.accuracy < 0.4)
   ```

4. **Generate Adjustments**
   - If AI is overconfident: reduce confidence weight
   - If AI excels in sector: boost weight for that sector
   - If AI struggles: reduce weight

5. **Apply to Future Predictions**
   - Calibration data feeds into prompt
   - Javari weights adjusted

### Calibration Prompt Injection

```typescript
const calibration = await getLatestCalibration('gpt4');

// Adds to prompt:
// "Your historical accuracy: Tech 72%, Finance 58%
//  Best sectors: Technology, Healthcare
//  Consider being more conservative on Finance picks"
```

---

## Javari Consensus Algorithm

### Weight Calculation

```typescript
function calculateWeight(ai: AIModel): number {
  const baseWeight = 1.0;
  
  // Accuracy adjustment
  const accuracyFactor = ai.accuracy / 0.5; // 50% is baseline
  
  // Confidence calibration
  const confidenceFactor = ai.calibratedConfidence / ai.rawConfidence;
  
  // Sector bonus
  const sectorBonus = ai.bestSectors.includes(stock.sector) ? 1.2 : 1.0;
  
  return baseWeight * accuracyFactor * confidenceFactor * sectorBonus;
}
```

### Consensus Building

```typescript
function buildConsensus(picks: AIPick[]): Consensus {
  // 1. Calculate weighted votes
  const votes = {
    UP: 0,
    DOWN: 0,
    HOLD: 0
  };
  
  for (const pick of picks) {
    const weight = calculateWeight(pick.aiModel);
    votes[pick.direction] += weight * pick.confidence;
  }
  
  // 2. Determine winner
  const direction = Object.keys(votes)
    .reduce((a, b) => votes[a] > votes[b] ? a : b);
  
  // 3. Calculate strength
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const strength = votes[direction] / total;
  
  // 4. Unified confidence
  const javariConfidence = strength * 100 * 
    (picks.filter(p => p.direction === direction).length / picks.length);
  
  return { direction, strength, javariConfidence };
}
```

### Consensus Strength Levels

| Strength | Description |
|----------|-------------|
| STRONG | 80%+ agreement, high confidence |
| MODERATE | 60-80% agreement |
| WEAK | 40-60% agreement |
| SPLIT | <40% agreement (no consensus) |

---

## Learning Pipeline Flow

```
┌────────────────────────────────────────────────────────────┐
│                    PICK GENERATION                         │
│  AI Models → Predictions → Javari Consensus → Database    │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼ (1 week passes)
┌────────────────────────────────────────────────────────────┐
│                   OUTCOME TRACKING                         │
│  Fetch Current Price → Compare to Target → WIN/LOSS       │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  ACCURACY UPDATE                           │
│  Update AI Stats → Sector Breakdown → Factor Performance  │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    CALIBRATION                             │
│  Recalculate Weights → Update Prompts → Adjust Javari     │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
                    IMPROVED PREDICTIONS
```

---

## Cron Jobs

### Process Outcomes (Every 6 Hours)
```typescript
// /api/cron/process-outcomes
1. Find picks where expires_at < NOW() AND status = 'PENDING'
2. Fetch current prices
3. Determine WIN/LOSS
4. Update picks
5. Update accuracy tracking
```

### Daily Calibration (Midnight)
```typescript
// /api/cron/daily-calibration
1. Calculate accuracy for each AI
2. Group by sector
3. Identify patterns
4. Update calibration weights
5. Log performance report
```

### Weekly Report (Sunday)
```typescript
// /api/cron/weekly-report
1. Compile weekly stats
2. Compare AI performance
3. Identify improving/declining AIs
4. Generate insights
5. (Optional) Email to admins
```

---

## Performance Metrics

### AI Leaderboard

We track which AI is performing best:

| AI | This Week | This Month | All Time |
|----|-----------|------------|----------|
| GPT-4 | 62% | 58% | 56% |
| Gemini | 55% | 52% | 54% |
| Perplexity | 68% | 61% | 59% |
| Claude | 60% | 57% | 55% |
| **Javari** | **71%** | **65%** | **62%** |

*Note: Javari typically outperforms individual AIs by 5-10% due to consensus.*

### Sector Performance

| Sector | Best AI | Accuracy |
|--------|---------|----------|
| Technology | Perplexity | 72% |
| Finance | GPT-4 | 64% |
| Healthcare | Claude | 61% |
| Energy | Gemini | 58% |

---

## Future Improvements

### Planned Enhancements

1. **Reinforcement Learning**
   - Train AI weights based on outcomes
   - Automatic parameter tuning

2. **Factor Attribution**
   - Which factors contributed to WIN/LOSS
   - Factor weight optimization

3. **Confidence Calibration**
   - Map AI confidence to actual probability
   - Reduce overconfidence bias

4. **Ensemble Methods**
   - Dynamic AI selection per stock
   - Sector-specific AI routing

5. **A/B Testing**
   - Test different weight configurations
   - Measure impact on accuracy

---

## Monitoring

### Key Metrics to Watch

- **Overall Accuracy**: Target 60%+
- **Javari vs Individual**: Should be 5%+ better
- **Confidence Calibration**: Predicted confidence should match actual win rate
- **Sector Variance**: Identify weak spots

### Alerts

- If any AI drops below 40% accuracy
- If Javari underperforms individual AIs
- If no outcomes processed in 24 hours

---

**The system gets smarter every day. Every pick is a learning opportunity.**
