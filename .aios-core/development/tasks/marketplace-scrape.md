# Task: Marketplace Web Scraping (Official Sources)

**Task ID:** marketplace-scrape
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Scrape official marketplace sources (Seller Central, Help Centers, Policy Pages) to collect current marketplace information for change detection. Uses **Apify MCP** for reliable, structured data extraction.

## Inputs (Elicitation Required)

```yaml
marketplace:
  channel: string                  # amazon | mercadolivre | shopee | shein | tiktokshop | kaway
  sources: list[object]            # URLs to scrape
    - name: string                 # "Seller Central Help", "Advertising Help", etc.
      url: string                  # Full URL of source
      section: string              # "algorithm" | "ads" | "content" | "policies"

execution:
  scraper_type: string             # 'apify' | 'simple' (use Apify MCP)
  timeout_minutes: integer          # Max scrape time (default: 15)
  extract_format: string            # 'markdown' | 'json' (prefer markdown for readability)
```

## Execution Steps

### Step 1: Validate Sources
- [ ] All URLs are official marketplace sources (Seller Central, Help Center, etc.)
- [ ] URLs are accessible and not redirected to login pages
- [ ] Scraping permission verified (check robots.txt if needed)
- [ ] Sources match the intended change categories

### Step 2: Load Apify MCP Configuration
- [ ] Access mcp__docker-gateway__call-actor
- [ ] Select appropriate actor for the channel/source type
- [ ] Configure actor with URLs and extraction rules
- [ ] Set timeout appropriately (15 minutes default)

### Step 3: Execute Scraping via Apify
- [ ] Call Apify actor with configured URLs
- [ ] Monitor execution progress
- [ ] Capture output in structured format (Markdown preferred)
- [ ] Save raw HTML if needed for fallback analysis

### Step 4: Structure Output by Section
Organize scraped content into these sections:

```
📋 ALGORITHM & RANKING
  - Latest factors affecting ranking
  - Changes to relevance signals
  - New ranking rules

💰 ADVERTISING & ADS
  - New ad formats or features
  - Changes to bidding rules
  - Updated compliance requirements

📝 CONTENT REQUIREMENTS
  - Title/description character limits
  - Prohibited words or claims
  - New content guidelines
  - Media requirements

⚖️ POLICIES & COMPLIANCE
  - Account suspension risks
  - Policy violations and consequences
  - Seller metrics requirements
  - Return/refund policies

🎁 NEW FEATURES & TOOLS
  - New marketplace features
  - Tool updates
  - Beta programs available
```

### Step 5: Validate Scraped Content
- [ ] Content is complete (not truncated or partial)
- [ ] Structure is consistent across scrapes
- [ ] Text encoding is correct (no garbled characters)
- [ ] URLs/links extracted correctly
- [ ] Timestamps recorded for each source

### Step 6: Format for Comparison
- [ ] Save as clean Markdown (strip HTML/formatting)
- [ ] Organize chronologically if timestamp available
- [ ] Highlight structural changes vs. content-only changes
- [ ] Flag any critical/urgent notices in scraped content

## Output Format

```markdown
## Scraping Results: {CHANNEL} — {DATE}

### Source 1: {Source Name}
**URL:** {URL}
**Scraped:** {TIMESTAMP}
**Relevance:** {algorithm|ads|content|policies}

{SCRAPED CONTENT IN MARKDOWN}

---

### Source 2: {Source Name}
...

## Scraping Metadata
- Total sources scraped: {X}
- Successful: {X}/{X}
- Failed: {X} (with reasons)
- Total content size: {X} characters
- Execution time: {X} minutes
```

## Decision Checkpoints

| Checkpoint | Decision | Proceed If |
|-----------|----------|-----------|
| Sources Valid | Are all URLs official and accessible? | YES |
| Apify Ready | MCP configured and tested? | YES |
| Scrape Success | Did Apify extract content successfully? | YES ≥80% |
| Content Valid | Is scraped content complete and usable? | YES |
| Format Correct | Is output properly structured for comparison? | YES |

## Success Criteria

- [ ] All official sources successfully scraped
- [ ] Content structured by section (algorithm/ads/content/policies)
- [ ] Output in clean Markdown format
- [ ] Content ready for comparison with KB
- [ ] Timestamps and source URLs included
- [ ] No partial/truncated content
- [ ] Character encoding correct
- [ ] Ready for marketplace-detect-changes task

## Related Tasks

- `marketplace-detect-changes.md` — Compare scraped content with KB
- `marketplace-generate-tasks.md` — Create executable task cards
- `marketplace-kb-update.md` — Update KB after completion

## Apify MCP Usage

```
mcp__docker-gateway__call-actor
  - Actor: Use specialized web scraper for marketplace help pages
  - Input: { urls: [...], selectors: [...], format: "markdown" }
  - Output: structured scraped content
```

## Notes

- Scraping is **read-only** — no modification of marketplace content
- Respect robots.txt and rate limits
- Official sources only (no competitor analysis here)
- Scheduled daily at 00:00 UTC per channel
- Results compared against KB updated 24 hours ago
