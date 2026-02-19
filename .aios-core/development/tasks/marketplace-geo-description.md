# Task: Marketplace GEO Description Generation

**Task ID:** marketplace-geo-description
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Generate compelling marketplace descriptions with geographic (GEO) customization tailored to specific channels, regions, and customer expectations. Descriptions are the primary conversion driver after titles.

## Inputs (Elicitation Required)

```yaml
product:
  name: string                    # Product name
  title: string                   # (From GEO Title task output)
  category: string                # Product category
  key_features: list[string]      # Top features
  benefits: list[string]          # Key benefits for target market
  specifications: dict            # Size, weight, material, etc.
  pricing: string                 # Price point (helps positioning)

market:
  region: string                  # Target region (e.g., "Brazil")
  language: string                # Description language
  cultural_notes: string          # Regional preferences/sensitivities
  common_questions: list[string]  # Typical customer questions

channel:
  name: string                    # Channel (amazon|mercadolivre|shopee|shein|tiktokshop|kaway)
  format: string                  # Description format (bullets|narrative|hybrid)
  max_length: integer             # Max characters or words
  html_enabled: boolean           # Allow HTML formatting
```

## Execution Steps

### Step 1: Validate Inputs
- [ ] Product information complete
- [ ] Target region and language specified
- [ ] Channel requirements understood
- [ ] Format preferences clear
- [ ] Pricing context noted

### Step 2: Load Channel Knowledge Base
- [ ] Load `marketplace-{channel}-kb.md`
- [ ] Extract description best practices:
  - Optimal length and structure
  - Formatting preferences (bullets vs. narrative)
  - SEO and keyword integration guidelines
  - Regional considerations and sensitivities
  - Conversion optimization patterns

### Step 3: Identify Customer Pain Points & Motivations
- [ ] Understand why customers buy this product in target region
- [ ] Identify common concerns or hesitations
- [ ] Note cultural preferences and values
- [ ] Consider price sensitivity and value positioning
- [ ] Recognize regional usage patterns

### Step 4: Structure Description Flow
**Recommended order:**
1. **Hook/Problem** (1-2 sentences) - Address customer pain point
2. **Solution/Product Intro** (1-2 sentences) - How product solves it
3. **Key Features** (3-5 bullets) - Most important features
4. **Benefits** (3-5 bullets) - How features translate to customer benefit
5. **Details/Specifications** (key specs relevant to region)
6. **Trust Signals** (warranty, return policy, certifications)
7. **Call-to-Action** (channel-appropriate CTA)

### Step 5: Write Channel-Specific Variations

#### Amazon Variant
- Focus on problem-solution structure
- Emphasize key features and benefits clearly
- Include A+ content recommendations
- Natural keyword integration
- Bullet format with clear value proposition

#### MercadoLivre Variant
- Emphasize shipping/logistics clearly
- Build trust signals prominently
- Regional language and colloquialisms
- Payment method flexibility
- Return policy prominent

#### Shopee Variant
- Engaging, conversational tone
- Video/visual content hooks
- Trending/popular positioning
- Quick-read format optimized for mobile
- Social proof and engagement elements

#### Shein Variant
- Trendy, fashion-forward language
- Style/aesthetic emphasis
- Sizing and fit guidance
- Trend alignment messaging
- Influencer/celebrity references if applicable

#### TikTok Shop Variant
- Ultra-casual, creator-inspired tone
- Emoji and formatting for visual interest
- Hook for shareability
- FOMO/urgency elements
- Creator-friendly language

#### Kaway Variant
- Sophisticated, premium tone
- Craftsmanship and quality emphasis
- Exclusivity and limited availability
- Heritage and story elements
- Luxury and prestige positioning

### Step 6: GEO Customization
- [ ] Adapt terminology to region (e.g., "shipping" vs "envío" vs "pengiriman")
- [ ] Use regional currency/measurement units appropriately
- [ ] Address regional concerns (customs, regional sizing, etc.)
- [ ] Incorporate regional preferences and values
- [ ] Ensure cultural appropriateness

### Step 7: SEO Optimization
- [ ] Natural keyword integration (1-2% density target)
- [ ] Primary keywords in first sentence
- [ ] Secondary keywords distributed naturally
- [ ] Avoid keyword stuffing
- [ ] Support primary title keywords

### Step 8: Validate & Format
- [ ] Check character/word count against limits
- [ ] Validate HTML formatting (if applicable)
- [ ] Ensure mobile readability
- [ ] Verify all special characters render properly
- [ ] Check for spelling and grammar

### Step 9: Trust & Conversion Check
- [ ] Are pain points addressed?
- [ ] Is value clearly communicated?
- [ ] Are objections handled?
- [ ] Is call-to-action clear?
- [ ] Would target customer feel confident purchasing?

## Output Format

```markdown
## GEO Description Recommendations

**Channel:** [Channel Name]
**Target Market:** [Region]
**Language:** [Language]
**Format:** [Bullets|Narrative|Hybrid]

### Recommended Description

\`\`\`
[DESCRIPTION TEXT - COPY READY]
\`\`\`

**Copy Length:** [X words / X characters]
**Keyword Integration:** [primary keywords included]
**GEO Customization:** [region-specific adaptations]

### Description Analysis

**Hook:** [Opening statement]
- Addresses: [customer pain point]
- Relevance: [why this matters in target region]

**Key Features Highlighted:** [list]
**Primary Benefits:** [list]
**Trust Signals:** [what builds confidence]

### Alternative Descriptions

**Option 2: [Variant Type]**
\`\`\`
[DESCRIPTION TEXT]
\`\`\`

**Option 3: [Variant Type]**
\`\`\`
[DESCRIPTION TEXT]
\`\`\`

### Implementation Notes
- Optimal for [channel name] algorithm
- Conversion focus: [primary conversion driver]
- Regional appropriateness: [cultural fit]
- Mobile readiness: [optimized for format]
```

## Decision Checkpoints

| Checkpoint | Question | Proceed If |
|-----------|----------|-----------|
| Input Complete | All product and market data provided? | YES |
| Channel Rules Loaded | Are KB guidelines understood? | YES |
| Customer Focus Clear | Pain points and motivations identified? | YES |
| Structure Sound | Does description flow logically? | YES |
| GEO Natural | Are regional customizations seamless? | YES |
| Conversion Ready | Would target customer buy based on this? | YES |

## Success Criteria

- [ ] Description flows naturally and persuasively
- [ ] Primary keywords integrated without stuffing
- [ ] Region-specific customizations feel authentic
- [ ] Within channel character/word limits
- [ ] Addresses common customer concerns
- [ ] Clear value proposition
- [ ] Trust signals evident
- [ ] Call-to-action appropriate for channel
- [ ] 2+ alternative variations provided
- [ ] Ready for direct marketplace copy-paste

## Related Tasks

- `marketplace-geo-title.md` - Title to pair with description
- `marketplace-optimize.md` - Full listing optimization
- `marketplace-audit.md` - Complete listing audit

## Channel Knowledge Base References

- `marketplace-amazon-kb.md` - Amazon description best practices
- `marketplace-mercadolivre-kb.md` - MercadoLivre regional considerations
- `marketplace-shopee-kb.md` - Shopee engagement optimization
- `marketplace-shein-kb.md` - Shein style and trend integration
- `marketplace-tiktokshop-kb.md` - TikTok Shop viral description elements
- `marketplace-kaway-kb.md` - Kaway premium messaging
