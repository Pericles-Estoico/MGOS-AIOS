# Task: Update Knowledge Base (KB)

**Task ID:** marketplace-kb-update
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Update Knowledge Base file (`marketplace-{channel}-kb.md`) with the latest official marketplace information after a task has been completed or when changes have been applied. Ensure KB stays synchronized with actual marketplace state.

## Inputs (Elicitation Required)

```yaml
update:
  channel: string                  # amazon | mercadolivre | shopee | etc.
  kb_file: string                  # marketplace-{channel}-kb.md (full path)

source:
  change_type: string              # algorithm | ads | content | policies | features
  task_id: string                  # ID of task that triggered this update
  task_title: string               # Title of completed task

content:
  section: string                  # Which KB section to update
  old_content: text                # Previous content (for before/after)
  new_content: text                # New official information
  source_url: string               # Official URL of source
  change_date: date                # When change went live
```

## Execution Steps

### Step 1: Locate KB File
- [ ] Find correct KB file: `.aios-core/development/data/marketplace-{channel}-kb.md`
- [ ] Verify file exists and is readable
- [ ] Load current file content

### Step 2: Identify Section to Update

Map change_type to KB section:

```
algorithm         → "## Amazon A9 Algorithm Fundamentals"
                   "## Ranking Factors"
                   "## Refresh Cycle"

ads               → "## Sponsored Ads Strategy"
                   "## {Ad Type} Strategy"
                   "## Bidding Strategy"

content           → "## Title Optimization Rules"
                   "## Description Optimization"
                   "## Image Requirements"

policies          → "## Compliance & Policy Requirements"
                   "## Prohibited Content"
                   "## Seller Metrics Standards"

features          → "## New Features"
                   Relevant specialty section
```

### Step 3: Update Content in Section

For each section being updated:

1. **Find exact section in MD file**
2. **Update content with new official information**
3. **Preserve existing examples and context**
4. **Add update timestamp and source**

Example update:

```markdown
## Ranking Factors (Updated 2026-02-19)

**Recent Change:** Sales velocity weight increased from 25% to 35%
**Source:** Amazon Seller Central A9 Documentation
**Change Date:** 2026-02-19

### Current Factors (Updated)
1. **Relevance** (40% weight) ← No change
2. **Sales Velocity** (35% weight) ← **UPDATED: was 30%**
3. **Conversion Rate** (15% weight) ← **UPDATED: was 20%**
...

---
*Last updated: 2026-02-19 10:30 UTC via task #{task_id}*
```

### Step 4: Update Change Log

Every KB file has a Change Log section. Add entry:

```markdown
## Change Log

### 2026-02-19 — A9 Algorithm Weight Shift
- **Change:** Sales Velocity weight 25%→35%, Conversion Rate 20%→15%
- **Type:** algorithm
- **Task ID:** #{task_id}
- **Task Title:** "UPDATE: Amazon A9 Algorithm Change — Ranking Factor Shift"
- **Source:** https://sellercentral.amazon.com/help/...
- **Updated By:** CLI / @{agent-name}
- **Impact:** Moderate (existing listings' rankings will shift)

### 2026-02-15 — Previous Update
...
```

### Step 5: Validate Updates

- [ ] Section found and updated correctly
- [ ] Old content preserved (if needed for reference)
- [ ] New content is accurate and complete
- [ ] Markdown formatting maintained
- [ ] No syntax errors in MD file
- [ ] Change log entry added
- [ ] Timestamp is current (UTC)
- [ ] Source URL is valid and points to official documentation
- [ ] Task ID reference is correct

### Step 6: Verify File Integrity

- [ ] Open updated KB file in Markdown viewer
- [ ] Check that all markdown renders correctly
- [ ] Verify table formatting (if tables were updated)
- [ ] Check code block formatting
- [ ] Test any links (if included)

### Step 7: Commit Changes

```bash
git add .aios-core/development/data/marketplace-{channel}-kb.md
git commit -m "docs: update {channel} KB — {change_description}

Updated {section} section with latest official information.
Task: #{task_id} ({task_title})
Source: {source_url}"
```

## Output Format

Updated KB file with:
1. **Section content:** Updated with official information
2. **Change log:** New entry documenting the update
3. **Timestamps:** ISO 8601 format (UTC)
4. **Source tracking:** URL and date of official source
5. **Task reference:** ID of the completed task

Example Change Log entry:

```markdown
### 2026-02-19 — Sponsored Display Audience Extension Released
- **Change:** New "Audience Extension" feature available in Sponsored Display ads
- **Type:** features
- **Task ID:** #42
- **Task Title:** "NEW: Amazon Sponsored Display Audience Extension — Implement"
- **Source:** https://advertising.amazon.com/help/ads/sponsored-display-audience-extension
- **Updated By:** @amazon-intel
- **Availability:** All advertisers (no restrictions)
- **Impact:** Optional feature that can improve ROAS by 15-25%

### 2026-02-15 — Title Character Limit Increase
...
```

## Decision Checkpoints

| Checkpoint | Decision | Proceed If |
|-----------|----------|-----------|
| KB Located | Is the correct KB file found? | YES |
| Section Found | Is the target section in KB? | YES |
| Content Valid | Is new content accurate and from official source? | YES |
| Update Applied | Is old content replaced with new content? | YES |
| Log Entry Added | Is change log entry complete with metadata? | YES |
| Format Valid | Does KB markdown render without errors? | YES |
| Commit Ready | Is git commit message prepared? | YES |

## Success Criteria

- [ ] KB file updated with new official information
- [ ] Change log entry added with full metadata
- [ ] Timestamps recorded (ISO 8601 UTC)
- [ ] Source URL verified as official marketplace documentation
- [ ] Task ID reference included
- [ ] Markdown file renders correctly
- [ ] No syntax errors in MD file
- [ ] Changes committed to git with descriptive message
- [ ] KB version incremented (if version field exists)

## Related Tasks

- `marketplace-generate-tasks.md` — Creates task that references KB updates
- `marketplace-detect-changes.md` — Identifies what needs updating
- `marketplace-scrape.md` — Provides source material for KB updates

## KB Files Updated

- `marketplace-amazon-kb.md`
- `marketplace-mercadolivre-kb.md`
- `marketplace-shopee-kb.md`
- `marketplace-shein-kb.md`
- `marketplace-tiktokshop-kb.md`
- `marketplace-kaway-kb.md`

## Notes

- **Timing:** KB is updated after task is COMPLETED (not when task is created)
- **Source Truth:** All updates must come from official marketplace sources
- **Change Log:** Must include timestamp, source, task reference, and impact assessment
- **Git History:** Every KB update creates a git commit for full audit trail
- **Manual Reviews:** Large changes (algorithm updates, major policy changes) may need human review before commit

## Automation Opportunity

This task can be partially automated:
1. Extract change_type and content from task metadata
2. Match to KB section (regex pattern matching)
3. Apply text replacement
4. Generate change log entry
5. Commit to git

⚠️ **WARNING:** Always review before committing. Don't fully automate without human validation, as incorrect information in KB can mislead teams for days.
