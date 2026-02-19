# Task: Marketplace Listing Audit

**Task ID:** marketplace-audit
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Perform comprehensive audit of marketplace listing health, performance, compliance, and optimization opportunities. This task provides complete visibility into listing quality across all dimensions.

## Inputs (Elicitation Required)

```yaml
listing:
  channel: string                 # Channel (amazon|mercadolivre|shopee|shein|tiktokshop|kaway)
  url: string                     # Listing URL
  asin_sku: string                # Product identifier
  category: string                # Product category
  language: string                # Listing language

data:
  current_metrics: dict           # Current metrics (views, conversions, etc.)
  review_count: integer           # Number of reviews/ratings
  average_rating: float           # Star rating (out of 5)
  sales_velocity: string          # Sales trend (increasing/stable/declining)
  competitors_count: integer      # Competing listings in category

scope:
  include_competitor: boolean     # Compare with competitors?
  include_forecast: boolean       # Include performance forecast?
  depth: string                   # Quick/Standard/Comprehensive
```

## Execution Steps

### Step 1: Validate Listing Access
- [ ] URL is accessible or ASIN/SKU correctly identified
- [ ] Listing is active and not suppressed
- [ ] All data sources accessible
- [ ] Audit scope and depth appropriate

### Step 2: Load Channel Knowledge Base
- [ ] Load `marketplace-{channel}-kb.md`
- [ ] Extract audit criteria specific to channel
- [ ] Understand compliance requirements
- [ ] Review health score factors

### Step 3: Audit Content Quality

**Title Analysis:**
- [ ] Word count (optimal 40-60 words typical)
- [ ] Primary keyword placement (first 3 words)
- [ ] Keyword naturalness (not stuffed)
- [ ] Special characters/formatting compliance
- [ ] Brand presence appropriateness
- [ ] Character limit compliance

**Score:** [X/10]

**Description Analysis:**
- [ ] Structure clarity (hook-benefits-details flow)
- [ ] Word count (optimal 100-300 words typical)
- [ ] Keyword integration (1-2% density)
- [ ] Benefit-focus (value proposition clear)
- [ ] Trust signals (warranty, return policy, etc.)
- [ ] Call-to-action presence
- [ ] Mobile readability
- [ ] Grammar and spelling

**Score:** [X/10]

**Product Information:**
- [ ] All required fields completed
- [ ] Specifications accurate and complete
- [ ] Variant options properly configured
- [ ] Measurements/sizing consistent
- [ ] Material/care information accurate
- [ ] Category appropriate
- [ ] Tags/attributes optimized

**Score:** [X/10]

### Step 4: Audit Visual Assets

**Images:**
- [ ] Number of images (optimal 6-10 for most channels)
- [ ] Primary image quality (sharp, centered, well-lit)
- [ ] Image variety (multiple angles, lifestyle, context)
- [ ] Zoom functionality test
- [ ] File size optimization
- [ ] Consistency in lighting/background
- [ ] Text overlay appropriateness
- [ ] Percentage of lifestyle images (recommend 30-40%)

**Score:** [X/10]

**Video (if applicable):**
- [ ] Video presence (recommended for certain categories)
- [ ] Video quality (resolution, stability)
- [ ] Video length (15-90 seconds optimal)
- [ ] Product demonstration (clear value shown)
- [ ] Engagement hooks (opening 3 seconds critical)
- [ ] Audio quality and clarity
- [ ] Captions/subtitles (accessibility)

**Score:** [X/10]

### Step 5: Audit Performance Indicators

**Sales Health:**
- [ ] Current sales velocity (units/week)
- [ ] Revenue trend (increasing/stable/declining)
- [ ] Sell-through rate (stock depletion speed)
- [ ] Stock level status
- [ ] Days to sell (inventory turnover)

**Customer Engagement:**
- [ ] Review count (volume indicates sales velocity)
- [ ] Average rating (aim 4.2+ stars)
- [ ] Review sentiment analysis (positive/neutral/negative %)
- [ ] Review recency (recent activity signals)
- [ ] Response rate (questions answered %)

**Competitive Position:**
- [ ] Market share position (rank in category)
- [ ] Price positioning vs. competitors
- [ ] Ranking on primary keywords
- [ ] Visibility in category browse

**Score:** [X/10]

### Step 6: Audit Compliance & Policy

**Content Compliance:**
- [ ] No prohibited words/claims
- [ ] No brand violations or counterfeits
- [ ] Health/safety claims compliant
- [ ] Pricing/discount claims compliant
- [ ] Return policy clearly stated
- [ ] Warranty information accurate

**Policy Compliance:**
- [ ] Seller metrics meet minimum standards
- [ ] Response time acceptable
- [ ] Return/refund policies compliant
- [ ] Shipping information accurate
- [ ] No active policy violations
- [ ] Account in good standing

**Score:** [X/10]

### Step 7: Competitive Benchmarking

**Identify Top 3-5 Competitors:**
- [ ] Similar products (same price range, specs)
- [ ] Analyze title keywords
- [ ] Analyze description approach
- [ ] Compare rating and review count
- [ ] Review image strategies
- [ ] Analyze pricing strategy
- [ ] Note unique value propositions

**Competitiveness Analysis:**
- [ ] Strengths vs. competitors
- [ ] Weaknesses vs. competitors
- [ ] Differentiation gaps
- [ ] Opportunity areas

**Score:** [X/10]

### Step 8: Calculate Overall Health Score

**Scoring Matrix (0-100):**
```
Content Quality:        [30%] = [X] points
Visual Assets:          [20%] = [X] points
Performance Metrics:    [20%] = [X] points
Compliance:             [15%] = [X] points
Competitive Position:   [15%] = [X] points
---
TOTAL HEALTH SCORE:     [100%] = [X]/100
```

**Score Interpretation:**
- 80-100: Excellent health, monitor for improvements
- 60-79: Good, optimization recommended
- 40-59: Fair, significant improvements possible
- 0-39: Poor, comprehensive revamp needed

### Step 9: Identify Risks & Opportunities

**RISKS (address urgently):**
- [ ] Compliance violations (suspension risk)
- [ ] Policy violations (account risk)
- [ ] Quality issues (conversion impact)
- [ ] Competitive disadvantages (visibility risk)

**OPPORTUNITIES (quick wins):**
- [ ] Title optimization potential
- [ ] Description enhancement
- [ ] Image addition/improvement
- [ ] Keyword expansion
- [ ] Review generation strategy

### Step 10: Generate Improvement Roadmap

**Prioritize by:**
1. Risk mitigation (compliance first)
2. Impact potential (high-impact improvements)
3. Implementation effort (quick wins first)
4. Timeline feasibility

## Output Format

```markdown
# Marketplace Listing Audit Report

**Channel:** [Channel Name]
**Product:** [Product Name]
**ASIN/SKU:** [Identifier]
**Audit Date:** [Date]
**Target Region:** [Region]

---

## Executive Summary

**Overall Health Score:** [X]/100 ([Rating])

**Current Status:** [Brief assessment of listing health]

**Critical Issues:** [Any compliance/risk issues - list if exists]

**Top Opportunities:** [3 highest-impact improvements]

**Estimated Improvement Potential:** [X]% revenue lift with full optimization

---

## Detailed Audit Results

### 1. Content Quality Audit

**Score:** [X]/10

#### Title Analysis
**Current Title:** "[Quote existing title]"

**Findings:**
- Primary keyword placement: [Analysis]
- Keyword relevance: [Analysis]
- Character utilization: [X/max characters]
- Naturalness score: [Good/Fair/Poor]

**Issues:**
- [Issue 1 if any]
- [Issue 2 if any]

**Recommendations:**
1. [Specific action]
2. [Specific action]

#### Description Analysis
**Current Length:** [X words]

**Findings:**
- Structure clarity: [Good/Fair/Poor] - [Explanation]
- Keyword integration: [Natural/Over-optimized/Under-optimized]
- Trust signals present: [Yes/No/Partial]
- Mobile readability: [Good/Fair/Poor]
- Value proposition clarity: [Clear/Unclear]

**Issues:**
- [Issue 1]
- [Issue 2]

**Recommendations:**
1. [Specific action]
2. [Specific action]

#### Product Information
**Status:** [Complete/Incomplete]

**Fields Checked:**
- Specifications: [Status]
- Variant options: [Status]
- Measurements: [Status]
- Category: [Status]
- Tags/attributes: [Status]

**Gaps:**
- [Missing field or inaccurate data]

---

### 2. Visual Assets Audit

**Score:** [X]/10

#### Images
**Current Count:** [X] images

**Findings:**
- Primary image quality: [Excellent/Good/Fair/Poor]
- Image variety: [Good/Fair/Poor] - [Specific gap]
- Zoom functionality: [Present/Absent]
- Lifestyle images: [X]% (recommend 30-40%)
- Consistency: [Good/Fair/Poor]

**Issues:**
- [Issue 1]
- [Issue 2]

**Recommendations:**
1. [Add/improve image type]
2. [Specific improvement]

#### Video (if applicable)
**Current Status:** [Present/Absent]

**Findings:**
- Quality: [Excellent/Good/Fair/Poor]
- Engagement: [Strong/Moderate/Weak]
- Clarity: [Clear/Unclear]
- Accessibility: [Captions yes/no]

**Recommendations:**
1. [Specific action]

---

### 3. Performance Metrics

**Score:** [X]/10

#### Sales Performance
- Current sales velocity: [X units/week]
- Trend: [Increasing/Stable/Declining]
- Days to sell (avg): [X days]
- Current stock: [X units]
- Sell-through rate: [X]%

**Status:** [Healthy/Concerning/Excellent]

#### Customer Engagement
- Review count: [X] reviews
- Average rating: [X]/5.0 stars
- Rating trend: [Improving/Stable/Declining]
- Recent reviews: [X in last 30 days]
- Sentiment: [Positive %] / [Neutral %] / [Negative %]

**Status:** [Excellent/Good/Fair/Poor]

#### Competitive Position
- Rank in category: [X out of X listings]
- Price positioning: [Below/At/Above market average]
- Keyword visibility: [X of Y primary keywords ranking]

**Status:** [Strong/Competitive/Vulnerable]

---

### 4. Compliance & Policy Audit

**Score:** [X]/10

**Content Compliance:**
- ✓ No prohibited words/claims
- ✓ No brand violations
- ✓ Policy-compliant claims
- ✓ Clear return policy
- ✓ Accurate warranty info

**Status:** [✓ Compliant / ✗ Issues found]

**Policy Compliance:**
- Seller rating: [X.X/5.0]
- Response time: [X hours avg]
- Return/refund rate: [X]%
- Account status: [Good standing/At risk]

**Status:** [✓ Compliant / ✗ Issues found]

**Issues:**
- [If any compliance issues exist, list them]

**Immediate Actions (if needed):**
- [Action 1]
- [Action 2]

---

### 5. Competitive Benchmarking

**Score:** [X]/10

#### Top Competitors
1. [Competitor 1 name] - Rating: [X]/5, Reviews: [X], Price: $[X]
2. [Competitor 2 name] - Rating: [X]/5, Reviews: [X], Price: $[X]
3. [Competitor 3 name] - Rating: [X]/5, Reviews: [X], Price: $[X]

#### Competitive Strengths
- [Strength 1]: [Your advantage]
- [Strength 2]: [Your advantage]

#### Competitive Weaknesses
- [Weakness 1]: [How competitors outperform]
- [Weakness 2]: [How competitors outperform]

#### Differentiation Opportunities
- [Opportunity 1]: [How to differentiate]
- [Opportunity 2]: [How to differentiate]

---

## Health Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Content Quality | [X]/10 | 30% | [X] |
| Visual Assets | [X]/10 | 20% | [X] |
| Performance | [X]/10 | 20% | [X] |
| Compliance | [X]/10 | 15% | [X] |
| Competition | [X]/10 | 15% | [X] |
| **TOTAL** | | **100%** | **[X]/100** |

---

## Critical Issues & Mitigation

### CRITICAL (Address Immediately)
- [ ] Issue: [Compliance violation]
  - Risk: [Account suspension/suppression]
  - Action: [Fix by date]

### HIGH (Address This Week)
- [ ] Issue: [Performance issue]
  - Impact: [X]% conversion impact
  - Action: [Fix by date]

---

## Improvement Roadmap

### PHASE 1: Quick Wins (This Week)
- [ ] Action 1: [Title update] - Impact: +[X]%
- [ ] Action 2: [Description fix] - Impact: +[X]%
- [ ] Action 3: [Image addition] - Impact: +[X]%

### PHASE 2: Medium-Term (This Month)
- [ ] Action 4: [Optimization] - Impact: +[X]%
- [ ] Action 5: [Expansion] - Impact: +[X]%

### PHASE 3: Long-Term (This Quarter)
- [ ] Action 6: [Enhancement] - Impact: +[X]%
- [ ] Action 7: [Strategy] - Impact: +[X]%

**Total Estimated Improvement:** +[X]% revenue potential

---

## Performance Forecast

**If current state continues:**
- Projected monthly revenue: $[X]
- Estimated annual revenue: $[X]

**If improvements implemented:**
- Projected monthly revenue: $[X] (+[X]%)
- Estimated annual revenue: $[X] (+[X]%)

**ROI of improvements:** [X]:1 (estimated payback in X days)

---

## Channel-Specific Notes

[Any channel-specific insights, requirements, or opportunities]

---

## Next Steps

1. Address critical issues immediately
2. Implement Phase 1 quick wins this week
3. Plan Phase 2 improvements this month
4. Schedule follow-up audit in 30 days
5. Monitor progress on KPIs

---

**Audit Completed By:** [Agent/System]
**Audit Date:** [Date]
**Next Review:** [Date]
```

## Decision Checkpoints

| Checkpoint | Question | Proceed If |
|-----------|----------|-----------|
| Listing Valid | Is listing accessible and identifiable? | YES |
| Data Complete | Are all audit data sources accessible? | YES |
| Channel Context | Is channel-specific knowledge loaded? | YES |
| Assessment Complete | Are all 10 steps executed? | YES |
| Score Calculated | Is 0-100 health score determined? | YES |
| Roadmap Clear | Is improvement path specific and prioritized? | YES |

## Success Criteria

- [ ] Comprehensive audit across all listing dimensions
- [ ] Clear health score (0-100) with supporting evidence
- [ ] Compliance assessment complete
- [ ] Competitive analysis included
- [ ] Prioritized improvement roadmap
- [ ] Performance forecast provided
- [ ] Risk/opportunity assessment clear
- [ ] Channel-specific insights documented
- [ ] Ready for implementation planning

## Related Tasks

- `marketplace-geo-title.md` - Generate optimized title
- `marketplace-geo-description.md` - Generate optimized description
- `marketplace-optimize.md` - Focused optimization plan
- `marketplace-ads.md` - ADS strategy

## Channel Knowledge Base References

- `marketplace-amazon-kb.md` - Amazon audit criteria
- `marketplace-mercadolivre-kb.md` - MercadoLivre compliance
- `marketplace-shopee-kb.md` - Shopee health factors
- `marketplace-shein-kb.md` - Shein quality standards
- `marketplace-tiktokshop-kb.md` - TikTok Shop guidelines
- `marketplace-kaway-kb.md` - Kaway premium standards
