# Task: Marketplace Ads Strategy Development

**Task ID:** marketplace-ads
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Develop comprehensive paid advertising strategy for marketplace channels. This includes platform selection, budget allocation, keyword/targeting strategy, creative approach, and performance monitoring framework.

## Inputs (Elicitation Required)

```yaml
product:
  name: string                    # Product name
  category: string                # Product category
  current_price: float            # Current selling price
  margin: float                   # Profit margin % (affects budget)
  monthly_goal: integer           # Sales target (units/month)

market:
  channel: string                 # Primary channel (amazon|mercadolivre|shopee|shein|tiktokshop|kaway)
  region: string                  # Target region
  competition_level: string       # Low/Medium/High
  seasonality: string             # Year-round/Seasonal/Event-based

budget:
  total_monthly: float            # Total monthly ad spend available
  acos_target: float              # Acceptable ACoS/ROAS target (%)
  test_budget: float              # Allocation for testing (%)

business:
  stage: string                   # New product/Established/Launching category
  goal: string                    # Launch/Growth/Dominate/Maintain
  analytics_available: boolean    # Can track conversion data?
```

## Execution Steps

### Step 1: Validate Inputs
- [ ] Product and pricing information complete
- [ ] Budget and business goals aligned
- [ ] Target channel and region confirmed
- [ ] Performance targets realistic for category
- [ ] Analytics capability assessed

### Step 2: Load Channel Knowledge Base
- [ ] Load `marketplace-{channel}-kb.md`
- [ ] Extract available advertising formats
- [ ] Understand platform mechanics and requirements
- [ ] Review channel-specific best practices
- [ ] Note algorithm interactions with ads

### Step 3: Analyze Channel Ad Formats

**Amazon:**
- Sponsored Products (Pay-Per-Click)
- Sponsored Brands (Brand awareness + traffic)
- Sponsored Display (Remarketing, audience targeting)
- Amazon DSP (Programmatic, advanced targeting)

**MercadoLivre:**
- Performance Ads (Pay-Per-Click)
- Branded Ads (Campaign packages)
- Social proof amplification

**Shopee:**
- In-Feed Ads (Sponsored listings)
- Shop Ads (Shop promotion)
- Search Ads (Keyword-based)

**Shein:**
- Influencer partnerships (UGC-based)
- Sponsored listings
- Trending/featured placement

**TikTok Shop:**
- TikTok Ads (via Ads Manager)
- Creator partnerships (affiliate + sponsored)
- Organic creator collaborations

**Kaway:**
- Premium placement ads
- Newsletter features
- VIP customer targeting

### Step 4: Define Keyword/Audience Strategy

**Keyword Approach (for search-based platforms):**
- [ ] Identify keyword tiers:
  - **BRANDED:** Brand name + product variations
  - **CATEGORY:** Product type, main keywords
  - **COMPETITOR:** Competitor brand names
  - **LONG-TAIL:** Specific phrases, use cases
  - **NEGATIVE:** Keywords to exclude

**Audience Approach (for social/display platforms):**
- [ ] Define target audience:
  - Demographics (age, gender, income)
  - Interests and behaviors
  - Purchase intent signals
  - Lookalike audiences (if available)

### Step 5: Budget Allocation Strategy

**Calculate Daily Budget:**
```
Monthly Budget ÷ 30 = Daily Budget
```

**Allocate by Format/Channel:**
- **Format Distribution** (if multiple ads):
  - Discovery/Awareness: 30%
  - Growth/Conversion: 50%
  - Testing/Optimization: 20%

**Time-based Optimization:**
- Peak seasons: Increase 30-50%
- Off-peak: Reduce to maintain presence
- Test small budget consistently

### Step 6: Bid Strategy & Performance Targets

**Determine Target Metrics:**

| Metric | Definition | Target |
|--------|-----------|--------|
| ACoS | Ad Cost ÷ Ad Revenue | [Channel avg] |
| ROAS | Revenue ÷ Ad Spend | 3-5x typical |
| CTR | Clicks ÷ Impressions | [Category avg] |
| Conversion Rate | Conversions ÷ Clicks | [Product avg] |
| CPC | Cost ÷ Clicks | [Keyword competitiveness] |

**Set Bid Strategy:**
- Conservative (month 1): Lower bids to learn data
- Growth (months 2-3): Increase bids for winners
- Optimization (month 4+): Target ACoS with automation

### Step 7: Create Ad Structure Template

**Ad Creative Elements Required:**
- [ ] Primary image (3:4 or 1:1 ratio)
- [ ] Ad copy/headline (channel-specific length)
- [ ] Description/benefit statement
- [ ] Call-to-action messaging
- [ ] Visual design elements

**For each format, define:**
- Headline variations (A/B test ready)
- Copy variations emphasizing benefits
- Visual hook elements
- CTA optimization approach

### Step 8: Develop Testing Framework

**Phase 1 (Weeks 1-2): Discovery**
- [ ] Launch on 3-5 keyword/audience tiers
- [ ] Small daily budget ($5-20 test)
- [ ] Collect baseline conversion data
- [ ] Identify winning keywords/audiences

**Phase 2 (Weeks 3-4): Scaling**
- [ ] Increase budget on top performers (20-30% winners)
- [ ] Pause underperformers (bottom 30%)
- [ ] Test creative variations on winners
- [ ] Optimize bids based on conversion data

**Phase 3 (Weeks 5-8): Optimization**
- [ ] Scale winners to target ACoS
- [ ] Add long-tail expansion keywords
- [ ] Test seasonal/trend-based messaging
- [ ] Implement automation rules

### Step 9: Create Monitoring Dashboard

**Daily Metrics to Track:**
- Spend, clicks, impressions, CTR
- Conversions, conversion rate, ACoS
- Average bid, bid adjustments

**Weekly Reviews:**
- Performance by keyword/audience tier
- Creative performance (if multivariate)
- Algorithm adjustments needed
- Scaling vs. pausing decisions

**Monthly Analysis:**
- ROI vs. target
- Seasonal patterns emerging
- Product/market fit signals
- Budget reallocation needs

## Output Format

```markdown
## Marketplace Ads Strategy Report

**Channel:** [Channel Name]
**Product:** [Product Name]
**Target Region:** [Region]
**Strategy Date:** [Date]

---

## Executive Summary

**Monthly Budget:** $[X]
**ACoS Target:** [X]%
**Expected Monthly Sales:** [X] units
**Expected Ad Revenue:** $[X]

**Key Strategy:** [1-2 sentence overview]

---

## Ad Format Selection

**Primary Format:** [Format Name]
**Rationale:** [Why this format for this product/channel]

**Secondary Formats (if applicable):**
- [Format 2]: [Budget allocation]
- [Format 3]: [Budget allocation]

---

## Keyword/Audience Strategy

### Keyword Tiers (if search-based)

**BRANDED Keywords ($[budget]):**
- [Keyword 1] - Bid: $[X]
- [Keyword 2] - Bid: $[X]

**CATEGORY Keywords ($[budget]):**
- [Keyword 1] - Bid: $[X]
- [Keyword 2] - Bid: $[X]

**COMPETITOR Keywords ($[budget]):**
- [Keyword 1] - Bid: $[X]

**LONG-TAIL Keywords ($[budget]):**
- [Keyword 1] - Bid: $[X]

**NEGATIVE Keywords (exclude):**
- [Negative keyword 1]
- [Negative keyword 2]

### Audience Targeting (if social-based)

**Primary Audience:**
- Demographics: [Age, Gender, Income range]
- Interests: [Interest category]
- Behaviors: [Purchase intent signals]
- Budget: $[X]

**Lookalike Audience:**
- Based on: [Existing customers/website visitors]
- Expansion level: [1%/5%/10%]
- Budget: $[X]

---

## Budget Allocation

**Daily Budget:** $[X/day]

| Component | Monthly | Daily | % |
|-----------|---------|-------|---|
| [Format 1] | $[X] | $[X] | [X]% |
| [Format 2] | $[X] | $[X] | [X]% |
| Testing | $[X] | $[X] | [X]% |
| **Total** | **$[X]** | **$[X]** | **100%** |

---

## Performance Targets

| Metric | Target | Benchmark |
|--------|--------|-----------|
| ACoS | [X]% | [Channel avg] |
| CTR | [X]% | [Category avg] |
| Conversion Rate | [X]% | [Product avg] |
| CPC | $[X] | [Market avg] |
| ROAS | [X]:1 | [Industry std] |

---

## Ad Creative Strategy

### Primary Ad Variations

**Ad Variation 1: [Focus]**
- Headline: [Copy]
- Description: [Copy]
- Visual: [Description]
- Target Audience: [Segment]

**Ad Variation 2: [Focus]**
- Headline: [Copy]
- Description: [Copy]
- Visual: [Description]
- Target Audience: [Segment]

### Testing Plan

**Week 1-2:** Run variations A/B simultaneously
**Week 3+:** Scale winners, retire underperformers
**Ongoing:** Refresh creative every 4 weeks or when CTR drops >20%

---

## Implementation Roadmap

### Week 1: Setup & Launch
- [ ] Create campaign structure
- [ ] Set up keyword/audience targeting
- [ ] Launch with conservative budget ($5-20/day test)
- [ ] Configure conversion tracking

### Week 2: Monitor & Optimize
- [ ] Daily bid adjustments based on early data
- [ ] Pause zero-conversion keywords/audiences
- [ ] Note winning segments
- [ ] Increase budget on top performers

### Week 3-4: Scale Winners
- [ ] Increase daily budget on performing keywords: +30%
- [ ] Add long-tail expansion keywords
- [ ] Test creative variations
- [ ] Pause bottom 30% performers

### Week 5-8: Ongoing Optimization
- [ ] Target ACoS with automated bidding
- [ ] Monitor seasonal patterns
- [ ] Refresh creative monthly
- [ ] Analyze conversion patterns

---

## Monitoring & Reporting

**Weekly Review Checklist:**
- [ ] Spend vs. budget vs. plan
- [ ] ACoS vs. target
- [ ] Top keywords/audiences identified
- [ ] Underperformers for pausing
- [ ] Creative performance assessment

**Monthly Review:**
- [ ] ROI vs. target achievement
- [ ] Profitability analysis
- [ ] Scaling opportunities
- [ ] Budget reallocation recommendations
- [ ] Seasonal adjustments needed

---

## Risk Mitigation

**Potential Issues:**
- Budget consumed too quickly
- Conversion tracking failures
- Competitor bid wars
- Seasonal demand fluctuations

**Safeguards:**
- Daily spending caps in platform
- Conversion tracking verification
- Automated pause on high ACoS
- Regular performance monitoring
```

## Decision Checkpoints

| Checkpoint | Question | Proceed If |
|-----------|----------|-----------|
| Format Selected | Is primary ad format appropriate? | YES |
| Budget Realistic | Does budget align with business goals? | YES |
| Keywords/Audiences Clear | Are targets specific and focused? | YES |
| Performance Targets Set | Are metrics and benchmarks realistic? | YES |
| Creative Ready | Are ad copy/images prepared? | YES |
| Monitoring Plan | Is tracking and review process clear? | YES |

## Success Criteria

- [ ] Ad format strategy matches channel strengths
- [ ] Keyword/audience targeting is specific and focused
- [ ] Budget allocation is realistic and phased
- [ ] Performance targets are achievable and measurable
- [ ] Testing framework enables optimization
- [ ] Monitoring dashboard enables daily management
- [ ] Risk mitigation strategies identified
- [ ] Ready for immediate campaign launch

## Related Tasks

- `marketplace-geo-title.md` - Create ad-optimized titles
- `marketplace-geo-description.md` - Generate ad-compatible descriptions
- `marketplace-optimize.md` - Optimize organic listing supporting ads
- `marketplace-audit.md` - Complete listing audit

## Channel Knowledge Base References

- `marketplace-amazon-kb.md` - Sponsored Ads types and best practices
- `marketplace-mercadolivre-kb.md` - Performance Ads strategy
- `marketplace-shopee-kb.md` - Shopee Ads formats and targeting
- `marketplace-shein-kb.md` - Shein influencer strategy
- `marketplace-tiktokshop-kb.md` - Creator and TikTok Ads strategy
- `marketplace-kaway-kb.md` - Premium customer targeting
