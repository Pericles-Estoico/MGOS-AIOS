# Task: Marketplace GEO Title Generation

**Task ID:** marketplace-geo-title
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Generate optimized marketplace titles with geographic (GEO) keywords tailored to specific channels and regions. This task bridges channel-specific best practices with product-level SEO optimization.

## Inputs (Elicitation Required)

**User must provide:**

```yaml
product:
  name: string                    # Product name (e.g., "Wireless Earbuds")
  category: string                # Category (e.g., "Electronics > Audio")
  key_features: list[string]      # Top 3-5 features (e.g., ["Noise Cancelling", "30h Battery"])
  target_market: string           # Geographic region (e.g., "Brazil", "Mexico", "Indonesia")

keywords:
  primary: list[string]           # Top keywords (e.g., ["wireless earbuds", "noise cancelling"])
  secondary: list[string]         # Secondary keywords (e.g., ["long battery", "water resistant"])
  avoid: list[string]             # Prohibited words (optional, channel-specific)

channel:
  name: string                    # Channel (amazon|mercadolivre|shopee|shein|tiktokshop|kaway)
  max_chars: integer              # Max title characters (channel-dependent)
  language: string                # Title language (pt|es|en|id|etc)
```

## Execution Steps

### Step 1: Validate Inputs
- [ ] Check product name is provided and clear
- [ ] Verify category is appropriate for channel
- [ ] Confirm all required fields present
- [ ] Validate target market matches channel availability
- [ ] Check character limits vs. channel maximum

### Step 2: Load Channel Knowledge Base
- [ ] Load `marketplace-{channel}-kb.md` from dependencies
- [ ] Extract channel-specific title rules:
  - Keyword placement preferences
  - Prohibited words/special characters
  - Formatting requirements
  - Character limits and spacing rules
  - GEO keyword best practices

### Step 3: Analyze Keyword Strategy
- [ ] Identify primary keyword placement (typically first 3-5 words)
- [ ] Balance primary keywords with secondary keywords
- [ ] Consider long-tail keyword variations
- [ ] Plan GEO keyword integration if applicable
- [ ] Ensure natural language flow (not keyword-stuffed)

### Step 4: Generate Title Options
Create 3-5 title variations following this structure:

**Format (channel-dependent):**
- **Amazon:** `[Brand] [Main Keyword] [Benefit] [Variant] [Material]`
- **MercadoLivre:** `[Main Keyword] [Benefit] [Specs] - [Brand]`
- **Shopee:** `[Trending Term] [Product] [Benefit] [Size/Color]`
- **Shein:** `[Style] [Category] [Unique Hook] [Details]`
- **TikTok Shop:** `[Trendy Hook] [Product] [Benefit] [Call-to-Action]`
- **Kaway:** `[Premium Descriptor] [Brand] [Product] [Signature Feature]`

### Step 5: Optimize for GEO
- [ ] Integrate geographic keywords naturally if applicable
- [ ] Avoid jarring GEO insertions that break readability
- [ ] Consider regional terminology and preferences
- [ ] Ensure title resonates with target market language
- [ ] Check for regional compliance or sensitivities

### Step 6: Validate Against Channel Rules
- [ ] Character count within limit
- [ ] No prohibited characters or words
- [ ] Proper capitalization for channel standards
- [ ] No excessive special characters
- [ ] Natural reading (not keyword-stuffed appearance)

### Step 7: Rank Variations
Order title options by:
1. Keyword relevance and placement
2. Natural language flow
3. GEO appropriateness (if applicable)
4. Expected click-through potential
5. Alignment with channel algorithm factors

### Step 8: Provide Recommendation
**Output:** Recommended title + runner-up options with brief explanation of each choice

## Output Format

```markdown
## GEO Title Recommendations

**Channel:** [Channel Name]
**Target Market:** [Region]
**Character Count:** [X/Max]
**Language:** [Language]

### Recommended Title
\`\`\`
[TITLE TEXT - COPY READY]
\`\`\`

**Rationale:**
- Primary keyword: [keyword] (positioned in first X words)
- GEO consideration: [how GEO is integrated]
- Channel optimization: [channel-specific advantage]
- Estimated impact: [keyword relevance score]

### Alternative Options

**Option 2:**
\`\`\`
[TITLE TEXT]
\`\`\`
Rationale: [brief explanation]

**Option 3:**
\`\`\`
[TITLE TEXT]
\`\`\`
Rationale: [brief explanation]

### Implementation Notes
- Character count: [X/Max] (includes spaces)
- Keyword placement analysis
- GEO integration feedback
- Expected A9/Algorithm positioning
```

## Decision Checkpoints

| Checkpoint | Decision | Proceed If |
|-----------|----------|-----------|
| Inputs Valid | Are all required inputs complete and clear? | YES |
| Channel Rules Understood | Is KB loaded and rules extracted? | YES |
| Keyword Strategy Clear | Are primary/secondary keywords prioritized? | YES |
| Title Candidates Generated | Are 3-5 variations created? | YES |
| GEO Integration Natural | Does GEO feel organic in title? | YES |
| Validation Complete | Do all variations pass channel rules? | YES |

## Success Criteria

- [ ] Recommended title passes all channel validation rules
- [ ] Title includes primary keywords in optimal positions
- [ ] GEO elements integrated naturally (if applicable)
- [ ] Character count within channel limits
- [ ] 3+ alternative options provided with rationale
- [ ] Expected algorithm positioning explained
- [ ] Ready for direct marketplace copy-paste

## Related Tasks

- `marketplace-geo-description.md` - Detailed description to pair with title
- `marketplace-optimize.md` - Full listing optimization
- `marketplace-audit.md` - Complete listing audit

## Channel Knowledge Base References

- `marketplace-amazon-kb.md` - Amazon A9 algorithm factors
- `marketplace-mercadolivre-kb.md` - MercadoLivre ranking factors
- `marketplace-shopee-kb.md` - Shopee algorithm and best practices
- `marketplace-shein-kb.md` - Shein trend optimization
- `marketplace-tiktokshop-kb.md` - TikTok Shop algorithm factors
- `marketplace-kaway-kb.md` - Kaway premium positioning
