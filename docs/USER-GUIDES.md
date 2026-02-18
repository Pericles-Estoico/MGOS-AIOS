# EPIC 2 - User Guides

**Version:** 2.0.0
**Status:** Complete
**Last Updated:** 2026-02-20

Complete guides for using all Epic 2 features.

---

## 👤 Executor Guide: Execute Tasks & Track Time

### Getting Started

1. **Login to Dashboard**
   - Navigate to `https://app.example.com/login`
   - Enter your credentials
   - You'll see your assigned tasks in "My Tasks"

2. **View Your Tasks**
   - Click "My Tasks" in the sidebar
   - See all tasks assigned to you
   - Filter by status (pending, in_progress, etc)

### Starting a Task

**Step 1:** Open Task Detail
```
Dashboard → My Tasks → Click Task Title
```

**Step 2:** Click "Start Work"
- Button appears when status = pending
- Task status automatically changes to "in_progress"
- Timer area becomes available

**Step 3:** Begin Timer
```
Time Tracking → Click "▶ Start Timer"
```

### Tracking Work Time

**Using the Timer:**

1. **Start Timer** - Click "▶ Start Timer"
   - Timer counts up (MM:SS format)
   - Shows elapsed time in real-time
   - Status badge shows "Running"

2. **Pause Timer** - Click "⏸ Pause"
   - Pauses counting (doesn't reset)
   - Resume later with "▶ Resume"

3. **Stop Timer** - Click "⏹ Stop"
   - Ends timer session
   - Opens "Time Log Form"
   - Fill in duration and description

4. **Reset Timer** - Click "🔄 Reset"
   - Clears timer back to 00:00
   - Use if you started by mistake

**Time Rounding:**
- Times are rounded **up** to nearest minute
- 30 seconds → 1 minute
- 61 seconds → 2 minutes
- Max duration: 24 hours (1440 minutes)

### Submitting Evidence

**What is Evidence?**
Evidence proves you completed the task. It can be:
- GitHub pull request link
- Screenshot URL
- Documentation link
- Test report link
- Any proof of work

**How to Submit:**

1. **Click "+ Submit Evidence"**
   - Evidence section → "+ Submit Evidence"
   - Form appears below

2. **Enter Evidence URL**
   - Must be valid HTTP or HTTPS
   - Examples:
     - `https://github.com/myrepo/pull/123`
     - `https://drive.google.com/file/d/...`
     - `https://example.com/screenshot.png`

3. **Add Description (Optional)**
   - Describe what the evidence shows
   - Max 1000 characters
   - Character counter shows remaining
   - Examples:
     - "PR with implementation and unit tests"
     - "Screenshot showing working feature"
     - "Test report: all tests passing"

4. **Submit**
   - Click "Submit Evidence" button
   - Evidence appears in Evidence section
   - You can add multiple pieces of evidence

### Checking Status

**Status Timeline:**
```
pending
   ↓
in_progress (you started work)
   ↓
submitted (when you submit evidence)
   ↓
qa_review (QA team reviewing)
   ↓
approved ✓ (DONE!) or rejected (try again)
```

**View Status History:**
- Task Detail → Status History section
- Shows who did what and when
- Tracks all status changes

**QA Feedback:**
- If rejected, QA feedback appears in Details
- Read feedback carefully
- Make changes and resubmit evidence

### Tips & Best Practices

✅ **Do:**
- Start timer at beginning of work
- Pause timer during breaks
- Submit evidence same day
- Include clear evidence URL
- Check QA feedback promptly
- Resubmit if rejected

❌ **Don't:**
- Forget to submit evidence
- Submit duplicate evidence
- Use very short durations (errors)
- Submit invalid URLs
- Wait too long to resubmit
- Change evidence description without updating

---

## 🔍 QA Reviewer Guide: Review & Approve Tasks

### Getting Started

1. **Login to Dashboard**
   - You'll see "QA Reviews" in sidebar
   - Only visible if your role = "qa"

2. **View Review Queue**
   - Click "QA Reviews" in sidebar
   - See all tasks waiting for your review
   - Shows submission timestamp

### Reviewing a Task

**Step 1:** Open Task
```
QA Reviews → Click Task Title
```

**Step 2:** Review the Evidence
- Evidence section shows submitted URLs
- Open links in new tab
- Review the work carefully
- Check if it meets requirements

**Step 3:** Review Implementation (if applicable)
- Click evidence link
- Review code/screenshots/documentation
- Test if functionality works (if appropriate)

**Step 4:** Submit Review

In Task Detail → QA Reviews section:

1. Click "+ Submit Review"
2. Choose review status:
   - **Approved** ✓ - Work meets standards
   - **Rejected** ✗ - Work doesn't meet standards
   - **Changes Requested** - Minor adjustments needed

3. Add Feedback (Optional)
   - Explain your decision
   - What was good/what needs work
   - Specific improvement requests
   - Max 1000 characters

4. Click "Submit Review"
   - Task status updates automatically
   - Executor is notified

### Review Statuses Explained

**Approved** ✓
- Use when: Work is complete and meets quality standards
- Task status changes to: `approved`
- Executor: Task is DONE! ✓
- Feedback: Optional but appreciated

**Rejected** ✗
- Use when: Work doesn't meet requirements
- Task status changes to: `rejected`
- Executor: Can resubmit new evidence
- Feedback: Required - explain why rejected
- Best practice: Be specific so executor knows what to fix

**Changes Requested** 🔄
- Use when: Almost there, just needs tweaks
- Task status changes to: `qa_review` (stays in review)
- Executor: Can update and resubmit
- Feedback: Required - list specific changes needed

### Tips & Best Practices

✅ **Do:**
- Check evidence carefully
- Test functionality when possible
- Give detailed feedback
- Be constructive in feedback
- Approve good work
- Reject clearly insufficient work

❌ **Don't:**
- Approve without reviewing evidence
- Give vague feedback ("Fix this")
- Be overly critical for minor issues
- Forget to leave feedback
- Take too long to review (executor waiting)
- Review same task twice

### Common Review Scenarios

**Code Pull Request**
```
1. Open GitHub PR link
2. Review code changes
3. Check PR status (tests passing?)
4. Approve if: Code is clean, tests pass, no issues
```

**Screenshot/Design**
```
1. Open screenshot link
2. Compare to requirements
3. Check functionality shown
4. Approve if: Matches spec, looks good
```

**Documentation**
```
1. Read documentation
2. Check completeness
3. Verify accuracy
4. Approve if: Clear, complete, accurate
```

**Test Report**
```
1. Open test report
2. Check test coverage
3. Verify all tests pass
4. Approve if: Good coverage, all pass
```

---

## 👑 Admin/Head Guide: Monitor Team & Manage Tasks

### Overview

As admin/head, you can:
- 📊 View all team tasks and progress
- 📈 Monitor burndown chart
- 👤 Reassign tasks between team members
- 📅 Extend due dates when needed
- 🔍 Review QA queue

### Accessing Team Dashboard

1. Click "Team Dashboard" in sidebar
2. Shows all tasks (not just yours)
3. Restricted to admin/head role only

### Understanding the Dashboard

**Status Summary Cards**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Pending: 8  │ │ In Progress  │ │ Submitted: 5 │
│     20%      │ │    12 (30%)  │ │     12%      │
└──────────────┘ └──────────────┘ └──────────────┘
```

- Click any card to filter by that status
- Shows count and percentage of total
- Helps identify bottlenecks

**Burndown Chart**
```
                    Ideal Line (predicted)
             ___
Tasks  100 /     \
       80  |      \__ Actual Line (real progress)
       60  |         \
       40  |          \___
       20  |              \___
        0  └──────────────────────────
           Day1  Day2  Day3  Day4  Day5
```

- Shows task completion over last 7 days
- Ideal line: linear progress expected
- Actual line: real team progress
- Stats show: Completed / Total / Progress %

**Key Insights:**
- Line **above** ideal: ✅ Ahead of schedule
- Line **below** ideal: ⚠️ Behind schedule
- Flat line: 📍 No progress being made
- Steep drop: 🚀 Team catching up

### Reassigning Tasks

**When to Reassign:**
- Executor is absent/unavailable
- Workload imbalance
- Skill mismatch
- Project priority changes

**How to Reassign:**

1. **Open Task Detail**
   ```
   Team Dashboard → Click Task → Open
   ```

2. **Find "Reassign Task" Panel** (right sidebar)
   - Only visible for admin/head
   - Shows current assignee

3. **Enter New Assignee**
   - Type team member name or ID
   - Autocomplete will suggest matches

4. **Click "👤 Reassign"**
   - Confirmation shows success
   - Task immediately reassigned
   - Audit log records change
   - New assignee notified

**Example:**
```
Current: "john-smith"
New: "sarah-jones"
Result: Sarah sees task in "My Tasks"
        John no longer sees it
```

### Extending Due Dates

**When to Extend:**
- Unexpected blockers/dependencies
- Team member illness/absence
- New requirements discovered
- Resource constraints

**How to Extend:**

1. **Open Task Detail**
   ```
   Team Dashboard → Click Task → Open
   ```

2. **Find "Extend Due Date" Panel** (right sidebar)
   - Shows current due date
   - Only visible for admin/head

3. **Select New Due Date**
   - Click date input
   - Choose future date
   - Cannot set date in past (prevented)

4. **Click "📅 Extend"**
   - Confirmation shows new date
   - Audit log records change
   - Executor notified of new deadline

**Example:**
```
Current: 2026-02-25
New: 2026-03-05
Result: Extra 8 days for executor
        Status bar shows new deadline
```

**Tips:**
- Extend by reasonable amount (1-7 days typical)
- Communicate with executor about reason
- Update team on any widespread delays
- Monitor burndown chart after extensions

### Monitoring Team Progress

**Daily Checks:**
1. Open Team Dashboard
2. Check status summary (any stuck tasks?)
3. Review burndown chart (on track?)
4. Check QA queue (bottleneck?)

**Weekly Review:**
1. Identify tasks behind schedule
2. Reassign if needed
3. Extend dates if necessary
4. Celebrate completed tasks! 🎉

**Red Flags to Watch:**
- 🔴 Many tasks in "qa_review" (QA backlog)
- 🔴 Burndown flat (no progress)
- 🔴 Rejections high (quality issues)
- 🔴 Same person always reassigned (overload)

### Best Practices

✅ **Do:**
- Monitor burndown daily
- Reassign proactively if needed
- Give team notice before reassignment
- Extend dates before deadline passes
- Track audit logs for accountability
- Celebrate progress!

❌ **Don't:**
- Reassign without reason
- Extend dates too often (signals planning issue)
- Ignore burndown chart problems
- Wait until deadline to extend
- Overload one person
- Make changes without documentation

### Common Management Scenarios

**Scenario: Task Behind Schedule**
```
1. Check burndown chart - is it below ideal?
2. Open stuck task
3. Check: Is executor blocked? Need help?
4. Options:
   - Reassign to stronger person
   - Extend deadline + investigate blocker
   - Split task into smaller pieces
5. Document reason in task notes
```

**Scenario: QA Overloaded**
```
1. Check: Are many tasks in "qa_review"?
2. Solutions:
   - Executors need to slow submissions
   - QA needs help (bring in another reviewer)
   - Some tasks can be auto-approved (obvious)
3. Balance workload
```

**Scenario: Team Falling Behind**
```
1. Check burndown - is it below ideal line consistently?
2. Investigate:
   - Are tasks too complex?
   - Do team members need help?
   - Are requirements unclear?
3. Actions:
   - Extend dates if appropriate
   - Bring in external resources
   - Break down complex tasks
   - Provide training if skill gap
```

---

## 📱 Feature-Specific Guides

### Using the Timer Correctly

**Rounding Rules:**
```
Time Logged → Rounded Time
30 seconds  → 1 minute
45 seconds  → 1 minute
60 seconds  → 1 minute
61 seconds  → 2 minutes
90 seconds  → 2 minutes
...pattern continues
```

**Why round up?** To ensure we never undercount work time.

**Examples:**
```
✅ Worked 34 minutes → log as 34 min
✅ Worked 34:45 (34:45) → logs as 35 min
❌ Log partial minutes only if 1 min = 60 seconds exactly
```

### Submitting Valid Evidence

**Valid URLs:**
```
✅ https://github.com/myrepo/pull/123
✅ https://drive.google.com/file/d/xyz
✅ https://example.com/screenshot.png
✅ https://jira.example.com/browse/PROJ-456
```

**Invalid URLs:**
```
❌ github.com/myrepo/pull/123 (missing https://)
❌ Not a real link (text, not URL)
❌ file:///C:/Users/... (local path)
❌ localhost:3000/page (not accessible)
```

### Reading the Burndown Chart

**Chart Elements:**

1. **Y-Axis (vertical):** Number of tasks
   - 100 = 100 tasks remaining
   - 0 = All tasks complete

2. **X-Axis (horizontal):** Timeline (days)
   - Shows last 7 days
   - Today is rightmost point

3. **Dashed Line:** Ideal burndown
   - If staying perfect pace: straight diagonal line
   - Never changes

4. **Solid Blue Line:** Actual progress
   - Where team really is
   - Should go DOWN as tasks complete

5. **Dots on Line:** Daily completion points
   - Each dot = end of one day
   - Each step down = tasks completed that day

**Interpreting:**
- Line **goes down:** Tasks completing ✓
- Line **stays flat:** No progress (investigate!)
- Line **goes up:** Tasks added (ok) or reopened (problem)
- Line **above ideal:** Behind schedule ⚠️
- Line **below ideal:** Ahead of schedule ✅

---

## 🆘 Troubleshooting

### "Timer won't start"
- Make sure task status = "pending" or "in_progress"
- Check if you're the assigned executor
- Try refreshing page

### "Evidence URL won't submit"
- Check URL starts with `https://` or `http://`
- Try opening URL in new tab first
- URL must be accessible (not behind login)

### "Can't reassign - button disabled"
- Check your role (must be admin or head)
- Check you're on task detail page
- Need to be logged in as admin/head user

### "Burndown chart not showing"
- Check if any tasks exist
- Chart needs at least 1 task with status_history
- Refresh page to reload data

### Task status won't update
- Check browser has latest data (F5 refresh)
- May need to clear browser cache
- Contact admin if issue persists

---

**Questions?** Contact your admin or check the [API Documentation](./API-DOCUMENTATION.md)

**Last Updated:** 2026-02-20
**Maintained By:** Development Team
