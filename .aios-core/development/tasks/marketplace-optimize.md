# Task: Marketplace Listing Optimization

**Task ID:** marketplace-optimize
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Audit existing marketplace listings and provide comprehensive optimization recommendations. This task identifies gaps, improvement opportunities, and quick wins for increased visibility and conversion.

## Inputs (Elicitation Required)

```yaml
listing:
  channel: string                 # Channel (amazon|mercadolivre|shopee|shein|tiktokshop|kaway)
  url: string                     # Listing URL (optional)
  asin_sku: string                # Product identifier
  current_title: string           # Existing title
  current_description: string     # Existing description
  current_images: integer         # Number of images
  current_price: string           # Current price point
  current_rating: float           # Current rating/reviews

context:
  target_region: string           # Geographic target
  competitor_count: integer       # Number of competitors (if known)
  sales_volume: string            # Current sales (if known)
  problem_areas: list[string]     # Specific concerns (optional)
```

## Execution Steps

### Step 1: Validate Listing Access
- [ ] URL is accessible or ASIN/SKU correctly identified
- [ ] Product information complete
- [ ] Target region and channel match
- [ ] Current metrics documented

### Step 2: Load Channel Knowledge Base
- [ ] Load `marketplace-{channel}-kb.md`
- [ ] Extract optimization priorities for channel
- [ ] Understand algorithm factors
- [ ] Review conversion optimization best practices

### Step 3: Audit Title Optimization
**Analyze current title for:**
- [ ] Primary keyword placement (should be first 3-5 words)
- [ ] Keyword relevance and specificity
- [ ] Natural language vs. keyword stuffing
- [ ] Brand positioning in title
- [ ] Character utilization (aiming for 80%+ of limit)
- [ ] Channel-specific formatting

**Scoring Criteria:**
- Excellent (80-100): Keywords optimized, natural flow
- Good (60-79): Some optimization possible
- Fair (40-59): Significant optimization needed
- Poor (0-39): Complete rewrite recommended

### Step 4: Audit Description Optimization
**Analyze for:**
- [ ] Problem-solution structure clarity
- [ ] Feature-to-benefit translation
- [ ] Secondary keyword integration (natural)
- [ ] Length optimization for channel
- [ ] Mobile readability
- [ ] Trust signals and credibility indicators
- [ ] Call-to-action presence and clarity
- [ ] Formatting (bullets vs. narrative appropriateness)

### Step 5: Image Analysis (if applicable)
- [ ] Number of images vs. channel best practice
- [ ] Image quality and clarity
- [ ] First image impact (primary selling image)
- [ ] Lifestyle/context images included
- [ ] Zoom-ability and detail shots
- [ ] Consistency in image quality
- [ ] Text overlays (if applicable)

### Step 6: Competitive Benchmarking
- [ ] Compare with top 3-5 competing listings
- [ ] Identify gaps vs. competition
- [ ] Note competitor strengths/weaknesses
- [ ] Identify unique differentiation opportunities
- [ ] Price positioning analysis

### Step 7: Generate Optimization Recommendations

**Categorize by Impact:**
- **CRITICAL** (Quick wins, high impact) - Title, primary keywords, trust signals
- **HIGH** (Medium-term optimization) - Description structure, secondary keywords
- **MEDIUM** (Nice-to-have improvements) - Formatting, imagery
- **LOW** (Nice-to-have) - Advanced A+ content, brand enhancements

**For each recommendation, specify:**
- Current state
- Recommended state
- Expected impact (conversion lift %, ranking improvement)
- Implementation effort (quick/medium/complex)
- Channel-specific rationale

### Step 8: Calculate Optimization Score
**Scoring Matrix (0-100):**
- Title optimization: 20 points
- Description optimization: 25 points
- Keyword strategy: 20 points
- Visual presentation: 15 points
- Trust signals: 10 points
- Channel-specific best practices: 10 points

**Score Interpretation:**
- 80-100: Excellent, minimal changes needed
- 60-79: Good, optimization recommended
- 40-59: Fair, significant improvements possible
- 0-39: Poor, comprehensive overhaul needed

### Step 9: Prioritize Quick Wins
- [ ] Identify highest-impact changes that take < 1 hour
- [ ] Sequence changes for phased implementation
- [ ] Estimate implementation time per change
- [ ] Plan A/B testing if applicable

## Output Format

```markdown
## Marketplace Listing Optimization Report

**Channel:** [Channel Name]
**ASIN/SKU:** [Product Identifier]
**Target Region:** [Region]
**Current Score:** [X/100]

---

## Executive Summary

**Current State:** [Brief 2-3 sentence overview]
**Optimization Potential:** [Expected improvement percentage]
**Priority Focus:** [Top 2-3 areas for immediate improvement]

---

## Detailed Audit Results

### Title Optimization
**Current Title:** [Quote existing]
**Score:** [X/20]

**Findings:**
- Primary keyword placement: [Analysis]
- Keyword relevance: [Analysis]
- Character utilization: [X/255 (or channel max)]
- Natural language score: [Good/Fair/Poor]

**Recommendations (CRITICAL):**
1. [Specific recommendation with rationale]
2. [Specific recommendation with rationale]

**Recommended Title:**
\`\`\`
[OPTIMIZED TITLE]
\`\`\`

---

### Description Optimization
**Current Length:** [X words]
**Score:** [X/25]

**Findings:**
- Structure flow: [Analysis]
- Keyword integration: [Natural/Over-optimized/Under-optimized]
- Trust signals: [Present/Absent]
- Channel fit: [Analysis]

**Recommendations (HIGH):**
1. [Specific recommendation]
2. [Specific recommendation]

**Key Improvement Areas:**
- [Area 1]: [Current state] → [Recommended state]
- [Area 2]: [Current state] → [Recommended state]

---

### Keyword Strategy
**Score:** [X/20]

**Primary Keywords:** [List with current usage]
**Secondary Keywords:** [List with integration opportunities]
**Missing Keyword Opportunities:** [List]

**Optimization Actions:**
1. [Keyword integration in title]
2. [Keyword optimization in description]

---

### Competitive Benchmarking
**Top Competitors:** [List 3]
**Competitive Gaps:** [Key differences vs. competitors]
**Differentiation Opportunities:** [Unique positioning angles]

---

### Implementation Roadmap

#### Phase 1: Quick Wins (< 1 hour)
- [ ] Update: [Change 1] - Impact: +X%
- [ ] Update: [Change 2] - Impact: +X%

#### Phase 2: Medium-term (1-3 days)
- [ ] Update: [Change 3] - Impact: +X%
- [ ] Implement: [Change 4] - Impact: +X%

#### Phase 3: Long-term (1-2 weeks)
- [ ] Strategy: [Change 5] - Impact: +X%
- [ ] Content: [Change 6] - Impact: +X%

---

## Metrics & Expectations

**Current Performance:**
- Estimated ranking position: [X]
- Estimated monthly views: [X]
- Estimated conversion rate: [X]%

**Post-Optimization Targets:**
- Expected ranking improvement: [X positions]
- Expected view increase: [X]%
- Expected conversion lift: [X]%

---

## Channel-Specific Notes
[Channel-specific insights and recommendations]

```

## Decision Checkpoints

| Checkpoint | Question | Proceed If |
|-----------|----------|-----------|
| Listing Valid | Is listing accessible and complete? | YES |
| Channel Rules | Are channel best practices understood? | YES |
| Audit Complete | Are all sections analyzed? | YES |
| Recommendations Clear | Are actions specific and prioritized? | YES |
| Score Calculated | Is 0-100 score determined? | YES |
| ROI Estimated | Are impact estimates reasonable? | YES |

## Success Criteria

- [ ] Comprehensive audit of all listing elements
- [ ] Clear scoring with specific rationale
- [ ] Competitive benchmarking included
- [ ] Prioritized recommendations (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Quick wins identified and sequenced
- [ ] Implementation roadmap provided
- [ ] Expected impact quantified
- [ ] Channel-specific rationale explained
- [ ] Ready for immediate implementation

## Related Tasks

- `marketplace-geo-title.md` - Generate optimized title
- `marketplace-geo-description.md` - Generate optimized description
- `marketplace-audit.md` - Complete listing audit
- `marketplace-ads.md` - ADS strategy to complement organic

## Channel Knowledge Base References

- `marketplace-amazon-kb.md` - Amazon ranking factors
- `marketplace-mercadolivre-kb.md` - MercadoLivre algorithm
- `marketplace-shopee-kb.md` - Shopee optimization best practices
- `marketplace-shein-kb.md` - Shein positioning strategy
- `marketplace-tiktokshop-kb.md` - TikTok Shop engagement factors
- `marketplace-kaway-kb.md` - Kaway premium standards
