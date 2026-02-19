# Task: Detect Marketplace Changes

**Task ID:** marketplace-detect-changes
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Compare freshly scraped marketplace content with the current Knowledge Base to detect changes. Classify by criticality and analyze impact on current listings and strategies.

## Inputs (Elicitation Required)

```yaml
change_detection:
  channel: string                  # amazon | mercadolivre | shopee | etc.
  scraped_content: text            # Output from marketplace-scrape task
  kb_file: string                  # marketplace-{channel}-kb.md to compare against

analysis:
  detailed_comparison: boolean     # Compare section by section (default: true)
  categorization: boolean          # Classify by type (algorithm/ads/content/policies)
  impact_analysis: boolean         # Analyze impact on existing listings
```

## Execution Steps

### Step 1: Load Current KB
- [ ] Read current `marketplace-{channel}-kb.md`
- [ ] Extract all sections:
  - Algorithm/ranking factors
  - ADS formats and rules
  - Content requirements (title/description/images)
  - Policies and compliance
  - New features
- [ ] Record KB version date

### Step 2: Compare Section by Section

#### Algorithm/Ranking Section
- [ ] Check for new ranking factors
- [ ] Identify removed or deprecated factors
- [ ] Look for weight/priority changes
- [ ] Note if search algorithm was updated
- **Criticality:** HIGH if major factor changed

#### ADS Section
- [ ] New ad formats or types
- [ ] Bidding rule changes
- [ ] Budget/spend restrictions
- [ ] Compliance requirements changes
- **Criticality:** HIGH if new format or major rule change

#### Content Section
- [ ] Title character limit changes (any change = flag)
- [ ] New prohibited words or claims
- [ ] New content guidelines
- [ ] Media requirement changes
- **Criticality:** CRITICAL if title limits changed, HIGH if new prohibitions

#### Policies/Compliance Section
- [ ] Suspension risk factors updated
- [ ] Return policy changes
- [ ] Seller metrics thresholds
- [ ] Account health criteria
- **Criticality:** CRITICAL if suspension criteria changed

#### New Features Section
- [ ] Completely new tools or programs
- [ ] Beta program availability
- [ ] Integration opportunities
- **Criticality:** MEDIUM (informational, not urgent)

### Step 3: Classify Each Change

For every difference detected, create a change record:

```yaml
change:
  id: string                       # unique identifier
  section: string                  # algorithm|ads|content|policies|features
  type: string                     # new|updated|removed|clarified
  title: string                    # brief title of change
  description: text                # detailed explanation
  old_value: text                  # previous value (if updated)
  new_value: text                  # new value
  impact_level: string             # low|medium|high|critical
  impact_reason: text              # why this impacts sellers
  estimated_work_hours: float      # rough estimate to implement
```

### Step 4: Criticality Scoring

**CRITICAL (🔴 Urgent Action Required)**
- Account suspension risk changes
- Compliance violation consequences updated
- Title/description character limits changed
- Core algorithm ranking factor changed
- Required content policy added
- **Impact:** Immediate action on all active listings
- **Urgency:** Same day or within 24 hours
- **Est. Hours:** 1-3 hours (depending on SKU count)

**HIGH (🟠 Important Update)**
- New ADS format or major bidding rule
- New content prohibition or guideline
- New feature with marketplace advantage
- Algorithm weight redistribution
- **Impact:** Optimize listings to align with change
- **Urgency:** Within 1 week
- **Est. Hours:** 2-8 hours (varies by change)

**MEDIUM (🟡 Standard Update)**
- New optional feature or tool
- Minor policy clarification
- New category or attribute
- Enhanced support documentation
- **Impact:** Consider adoption for competitive advantage
- **Urgency:** Within 2 weeks
- **Est. Hours:** 2-6 hours (if adopted)

**LOW (🟢 Informational)**
- Minor policy wording update
- Training resource availability
- Platform improvement (no action needed)
- Announcement with no seller impact
- **Impact:** Reference information
- **Urgency:** Can review monthly
- **Est. Hours:** 0-1 hour (documentation only)

### Step 5: Detect False Positives

- [ ] Ignore formatting-only changes (markdown restructuring)
- [ ] Ignore examples that don't affect rules
- [ ] Ignore minor wording updates without policy changes
- [ ] Only flag if behavior/requirement actually changed
- [ ] If unclear, classify as LOW and flag for manual review

### Step 6: Generate Change Report

```markdown
## Change Detection Report: {CHANNEL}
**Date:** {TIMESTAMP}
**KB Version Compared:** {DATE}
**Total Changes Detected:** {X}

### By Criticality

**🔴 CRITICAL ({X} changes)**
- {Change 1}
- {Change 2}

**🟠 HIGH ({X} changes)**
- {Change 1}
- {Change 2}

**🟡 MEDIUM ({X} changes)**
- {Change 1}

**🟢 LOW ({X} changes)**
- {Change 1}

### Detailed Changes

#### CRITICAL Changes
1. {Change title}
   - Section: {section}
   - Old: {old value}
   - New: {new value}
   - Impact: {impact explanation}
   - Est. Hours: {X}

#### HIGH Changes
[same format]

### Summary for Task Generation
- X CRITICAL changes → {X} urgent tasks
- X HIGH changes → {X} standard tasks
- X MEDIUM changes → {X} optional tasks
- X LOW changes → {X} informational items
```

## Decision Checkpoints

| Checkpoint | Decision | Proceed If |
|-----------|----------|-----------|
| KB Loaded | Is current KB accessible and complete? | YES |
| Content Valid | Is scraped content complete and usable? | YES |
| Comparison Done | Section-by-section comparison completed? | YES |
| Changes Classified | All differences scored by criticality? | YES ✓ or MANUAL REVIEW for unclear |

## Success Criteria

- [ ] All content sections compared
- [ ] Each change classified by criticality (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] False positives eliminated
- [ ] Impact analyzed for each change
- [ ] Hours estimated for implementation
- [ ] Change report structured for task generation
- [ ] Ready for marketplace-generate-tasks task

## Related Tasks

- `marketplace-scrape.md` — Provides fresh marketplace content
- `marketplace-generate-tasks.md` — Creates executable task cards
- `marketplace-kb-update.md` — Updates KB after completion

## Notes

- **Automated Process:** This comparison is 80-90% automatable (section matching, text diff)
- **Manual Review:** CRITICAL changes should be reviewed by human to confirm impact
- **False Positive Rate:** ~10-15% (wording changes misidentified as policy changes)
- **Threshold:** Only flag changes with >80% confidence
- **Daily Schedule:** Runs after marketplace-scrape task completes
