# Task: Generate Task Cards (AI-Powered)

**Task ID:** marketplace-generate-tasks
**Version:** 1.0
**Created:** 2026-02-19

## Overview

Transform detected marketplace changes into executable task cards in MGOS app. Each card includes detailed step-by-step instructions, estimated hours, and priority level. Generated tasks await admin approval before assignment to collaborators.

## Inputs (Elicitation Required)

```yaml
changes:
  channel: string                  # amazon | mercadolivre | etc.
  detected_changes: list           # Output from marketplace-detect-changes task
  change_details: object           # Each change with type, impact, hours estimate

output_api:
  endpoint: string                 # /api/marketplace-intel/tasks (POST)
  auth_method: string              # service_role_key or AIOS internal
```

## Execution Steps

### Step 1: Load Change Report
- [ ] Read change detection output
- [ ] Extract CRITICAL, HIGH, MEDIUM, LOW changes
- [ ] Group by change type (algorithm/ads/content/policies/features)
- [ ] Validate change data completeness

### Step 2: For Each Change, Generate Task Card

#### Card 1: CRITICAL Change
```yaml
title: "UPDATE: Amazon A9 Algorithm Change — Ranking Factor Shift"
description: |
  **What Changed:**
  Amazon updated its A9 ranking algorithm. The "sales velocity" factor weight
  increased from 25% to 35%, while "conversion rate" decreased from 20% to 15%.

  **Why It Matters:**
  Your listings' ranking positions will shift based on new weightings.
  High-velocity products may gain visibility while conversion-focused products lose ground.

  **What You Need to Do:**
  Update your SEO strategy and inventory management to align with new A9 priorities.

  **Source:**
  Amazon Seller Central - A9 Ranking Factors (updated 2026-02-19)
  https://sellercentral.amazon.com/help/hub/reference/selling/algorithm

estimated_hours: 6
priority: high
channel: amazon
ai_change_type: algorithm
ai_source_url: https://sellercentral.amazon.com/help/...

step_by_step: |
  ### Step-by-Step Guide: Implement A9 Algorithm Change

  **Phase 1: Analysis (1 hour)**
  1. Go to Seller Central Dashboard → Business Reports → Detail Page Sales and Traffic
  2. Download last 90 days of sales data (CSV format)
  3. Sort products by:
     - Column A: ASIN
     - Column C: Sales Velocity (units/day)
     - Column E: Conversion Rate (%)
  4. Identify top 10 high-velocity products (prioritized under new algorithm)
  5. Identify bottom 10 low-conversion products (deprioritized under new algorithm)
  6. Create a simple spreadsheet with columns: ASIN | Current Rank | New Priority | Action Needed

  **Phase 2: Optimization (4 hours)**
  7. For HIGH VELOCITY products (gaining advantage):
     - Increase Sponsored Ads budget by 20% to maximize visibility gained
     - Ensure inventory is stocked (don't lose sales to out-of-stock)
     - Refresh A+ Content with "best-seller" messaging if applicable

  8. For LOW CONVERSION products (losing advantage):
     - Audit listing quality (title, images, reviews)
     - Consider price adjustment (if competitive)
     - Invest in Sponsored Ads to offset ranking loss
     - Test new product images or A+ content to improve conversion rate

  9. For MEDIUM VELOCITY/CONVERSION products:
     - Monitor rankings weekly
     - Implement small optimizations (title tweaks, image improvements)

  **Phase 3: Monitoring (1 hour)**
  10. Set up weekly rank tracking in your preferred tool
  11. Create simple dashboard: Track top 20 products' rankings weekly
  12. Schedule weekly 15-min review: Review + adjust strategy

  **Expected Timeline:**
  - Immediate impact: 1-2 days (algorithmic recalculation)
  - Ranking stabilization: 1-2 weeks (system learns new weights)
  - Full optimization impact: 4-6 weeks (organic traffic adjusts)
```

#### Card 2: HIGH Change (NEW ADS FORMAT)
```yaml
title: "NEW: Amazon Sponsored Display Audience Extension — Implement"
description: |
  **What's New:**
  Amazon launched "Audience Extension" feature for Sponsored Display ads.
  Automatically expand reach to similar audiences without manual targeting.

  **Why It Matters:**
  New feature can increase Sponsored Display ROI by 15-25% with minimal effort.
  Competitors will use this → you'll lose visibility advantage if you don't implement.

  **What You Need to Do:**
  Enable and test Audience Extension in existing Sponsored Display campaigns.

estimated_hours: 2
priority: high
channel: amazon
ai_change_type: ads

step_by_step: |
  ### Quick Setup Guide: Amazon Sponsored Display Audience Extension

  1. Log in to Amazon Ads → Campaigns
  2. Click on an active Sponsored Display campaign
  3. Go to Ad Groups → Select ad group
  4. Scroll to "Audience Targeting" section
  5. Check NEW checkbox: "Expand to similar audiences"
  6. Set budget increase tolerance: +10% (conservative to test)
  7. Click "Save changes"
  8. Wait 2 hours for system to process
  9. Go back and verify checkbox is active (turns blue)
  10. Monitor daily for 7 days:
      - Check spend: should increase ~10% (if properly configured)
      - Check conversions: should stay same or increase
      - If ROAS drops > 20%: disable and troubleshoot
  11. If results good: Increase budget tolerance to +20%
  12. Test in 2-3 campaigns, then expand to all
```

### Step 3: Standardize Card Format

Every generated task must include:
- ✓ **Title:** Channel + "UPDATE:" or "NEW:" + brief description
- ✓ **Description:** What changed + why it matters + what to do
- ✓ **estimated_hours:** Based on change type and SKU count
- ✓ **priority:** high/medium/low (mapped from criticality)
- ✓ **channel:** amazon | mercadolivre | etc.
- ✓ **ai_change_type:** algorithm | ads | content | policies | features
- ✓ **ai_source_url:** URL of official source
- ✓ **step_by_step:** Markdown with numbered exact steps (no ambiguity)

### Step 4: Calculate Estimated Hours

```
Algorithm Changes:
  - Minor ranking factor change → 2-4 hours
  - Major algorithm shift → 6-8 hours
  - New ranking system → 8+ hours

ADS Changes:
  - New ad format → 2-4 hours (setup + testing)
  - Bidding rule change → 1-3 hours (adjust bids)
  - New compliance rule → 1-2 hours (update campaigns)

Content Changes:
  - Title character limit change → 4-8 hours (rewrite all titles)
  - New content prohibition → 2-4 hours (audit + fix)
  - New guideline → 1-3 hours (compliance check)

Compliance Changes:
  - New suspension risk → 2-4 hours (audit + fix)
  - Return policy change → 1-2 hours (communicate to customers)
  - Seller metrics update → 1-3 hours (monitor + optimize)

Features (Optional):
  - New optional tool → 1-3 hours (evaluate + test if adopting)
  - Beta program available → 0.5-1 hour (signup + setup)
```

### Step 5: POST to /api/marketplace-intel/tasks

```json
{
  "title": "UPDATE: Amazon A9 Algorithm Change...",
  "description": "What Changed: ...",
  "step_by_step": "### Step-by-Step Guide...",
  "estimated_hours": 6,
  "priority": "high",
  "channel": "amazon",
  "source_type": "ai_generated",
  "admin_approved": false,
  "ai_change_type": "algorithm",
  "ai_source_url": "https://...",
  "ai_generated_at": "2026-02-19T10:00:00Z"
}
```

### Step 6: Verify Task Creation
- [ ] POST request successful (201 Created)
- [ ] Task created in app with `admin_approved=false`
- [ ] Admin sees task in "🤖 AI Tasks Pending" panel
- [ ] All fields populated correctly

## Output Format

Task cards created in MGOS app with status:
- `source_type`: "ai_generated"
- `admin_approved`: false (awaiting admin approval)
- `assigned_to`: null (to be assigned by admin)
- `status`: "a_fazer" (ready to do, once approved)

## Decision Checkpoints

| Checkpoint | Decision | Proceed If |
|-----------|----------|-----------|
| Changes Loaded | Are all detected changes available? | YES |
| Cards Generated | Are step-by-step instructions clear? | YES ✓ |
| Hours Estimated | Are time estimates realistic? | YES |
| Format Valid | Do all cards have required fields? | YES |
| API Ready | Can POST to /api/marketplace-intel/tasks? | YES |

## Success Criteria

- [ ] CRITICAL changes generate HIGH priority tasks with 1-3 hour urgency note
- [ ] HIGH changes generate HIGH priority tasks with 1-week deadline
- [ ] MEDIUM changes generate MEDIUM priority tasks with 2-week deadline
- [ ] LOW changes generate informational notes (not full tasks)
- [ ] Step-by-step instructions are specific and executable
- [ ] Estimated hours are realistic and justified
- [ ] Cards ready for admin approval
- [ ] All POST requests to API successful

## Related Tasks

- `marketplace-detect-changes.md` — Provides changes to convert to tasks
- `marketplace-kb-update.md` — Updates KB after task completion

## Notes

- **Admin Approval Required:** All AI-generated tasks need admin review before assignment
- **Manual Override:** Admin can edit title, hours, priority before assigning
- **Executor Visibility:** Collaborators only see approved + assigned tasks
- **KB Update:** After executor completes task, KB is auto-updated via marketplace-kb-update
