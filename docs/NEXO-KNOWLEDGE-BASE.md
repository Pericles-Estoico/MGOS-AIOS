# NEXO Knowledge Base - AI Learning System

**Data:** 2026-02-24
**Status:** ✅ **LIVE** - Production Ready
**URL:** https://www.sellerops.com.br/marketplace/knowledge-base

---

## 🎯 What is NEXO Knowledge Base?

NEXO Knowledge Base is an **AI learning system** that allows you to upload files (images, spreadsheets, documents, PDFs) for NEXO to learn from, analyze, and teach its agents specialized marketplace optimization strategies.

**Key Concept:** Rather than manually creating tasks, you provide NEXO with real-world data, and it automatically:
1. Analyzes the content
2. Extracts actionable insights
3. Creates marketplace-specific instructions
4. Generates tasks for your agents
5. Awaits your approval before execution

---

## 📍 Access Points

### Quick Link from Marketplace Master
```
https://www.sellerops.com.br/marketplace
├─ Scroll to "Quick Actions"
├─ Click "📚 Knowledge Base - Ensine os agentes"
└─ Opens full knowledge base dashboard
```

### Direct URL
```
https://www.sellerops.com.br/marketplace/knowledge-base
```

---

## 🚀 How It Works

### Step 1: Upload File

1. Navigate to `/marketplace/knowledge-base`
2. See **NEXO Knowledge Base** section at top
3. Drag & drop OR click to select file
4. Supported file types:
   - **Images:** JPG, JPEG, PNG, GIF (product photos, market screenshots)
   - **Spreadsheets:** XLSX, XLS, CSV (pricing data, competitor analysis)
   - **Documents:** PDF, TXT, JSON (market reports, guidelines)

### Step 2: Select Marketplaces

Choose which marketplaces NEXO should customize this knowledge for:
- Amazon
- MercadoLivre
- Shopee
- SHEIN
- TikTok Shop
- Kaway

**You can select multiple or all.**

### Step 3: Choose Generation Method

Two options:
- **📋 Manual Review:** File is saved, you manually generate tasks
- **🤖 Auto-Generate:** Tasks are created automatically (still need approval)

### Step 4: NEXO Analysis

NEXO automatically:
1. **Extracts content** from the file
2. **Analyzes insights** relevant to selected marketplaces
3. **Creates recommendations** for optimization
4. **Generates task templates** customized per marketplace

### Step 5: Review & Approve

You can:
- Review extracted insights
- See recommendations from NEXO
- Approve or modify generated tasks
- Choose auto-approve for future similar uploads

### Step 6: Agents Execute

Once approved, NEXO's agents:
1. Receive the knowledge and instructions
2. Generate marketplace-specific optimization tasks
3. Execute tasks following learned patterns
4. Report results with new insights

---

## 📤 File Upload Details

### Accepted File Types

| Type | Extensions | Max Size | Use Case |
|------|-----------|----------|----------|
| Image | JPG, JPEG, PNG, GIF | 10MB | Product photos, market screenshots |
| Spreadsheet | XLSX, XLS, CSV | 10MB | Pricing, competitor data, trends |
| Document | PDF, TXT, JSON | 10MB | Market reports, guidelines, specs |

### What NEXO Extracts

**From Images:**
- Product layout and presentation
- Pricing display strategy
- Visual design patterns
- Category-specific styling

**From Spreadsheets:**
- Pricing strategies
- Competitor analysis
- Sales patterns
- Seasonal trends
- Performance metrics

**From Documents:**
- Market insights
- Best practices
- Compliance requirements
- Marketplace guidelines
- Technical specifications

### Processing Steps

1. **Content Extraction**
   - Text OCR for images
   - Data parsing for spreadsheets
   - Text extraction for PDFs
   - JSON/CSV direct parsing

2. **Analysis**
   - Marketplace relevance scoring
   - Insight identification
   - Recommendation generation
   - Risk assessment

3. **Task Generation**
   - Create Phase 1 tasks (strategic)
   - Create Phase 2 tasks (execution)
   - Customize per marketplace
   - Set approval workflow

---

## 🧠 AI Analysis Features

### Key Insights Extracted

For each file, NEXO identifies:
- **Market Opportunities:** What can be optimized
- **Competitive Patterns:** How competitors operate
- **Pricing Strategies:** Optimal pricing approaches
- **Visual Trends:** Design and presentation best practices
- **Compliance Notes:** Marketplace-specific rules

### Recommendations Generated

NEXO provides:
- **Immediate Actions:** Quick wins to implement
- **Long-term Strategies:** Sustainable optimizations
- **Risk Mitigation:** What to avoid
- **Testing Recommendations:** Experiments to run

### Task Templates Created

For each marketplace, NEXO creates:
- **Standard Optimization:** General improvements
- **Market-Specific:** Tailored to marketplace rules
- **Agent-Specialized:** For specific agents' strengths
- **Phased Rollout:** Phase 1, 2, 3 planning

---

## 📊 Knowledge Base Dashboard

### View All Entries

Shows all uploaded files with:
- **Filename:** What was uploaded
- **Summary:** NEXO's analysis summary
- **Marketplaces:** Where it applies
- **Insights:** Key findings (5 visible)
- **Recommendations:** Action items (5 visible)
- **Upload Date:** When added

### Filter & Search

Filter by:
- **Marketplace:** See knowledge for specific marketplace
- **Upload Date:** Recent vs older entries
- **Type:** Images, spreadsheets, documents

### Manage Entries

For each entry:
- **🤖 Gerar Tarefas:** Generate tasks from this knowledge
- **🔄 Refresh:** Re-analyze with updated insights
- **🗑️ Delete:** Remove outdated knowledge

---

## 💡 Use Cases

### Case 1: Competitor Analysis

**Scenario:** You screenshot competitor's listing on Amazon

1. Upload screenshot to Knowledge Base
2. Select "Amazon" marketplace
3. NEXO analyzes: pricing, title format, images, description
4. Generates tasks: "Optimize listing title format", "Adjust pricing strategy"
5. Agents execute improvements

### Case 2: Pricing Strategy

**Scenario:** You have pricing data CSV from market research

1. Upload spreadsheet
2. Select all 6 marketplaces
3. NEXO extracts: price points, elasticity, competitor rates
4. Generates: "Update pricing for marketplace X", "Run A/B test"
5. Agents implement across channels

### Case 3: Product Catalog

**Scenario:** You have new product photos and specs

1. Upload images + description PDF
2. Select relevant marketplaces (e.g., Shopee, Amazon)
3. NEXO analyzes: product positioning, image quality, descriptions
4. Generates: "Create listing for Shopee", "Optimize images", "Write descriptions"
5. Agents create listings with optimizations

### Case 4: Marketplace Guidelines

**Scenario:** New marketplace rules released (PDF)

1. Upload marketplace rules PDF
2. Select that marketplace
3. NEXO identifies: compliance requirements, restrictions, opportunities
4. Generates: "Review all listings for compliance", "Update prohibited claims"
5. Agents audit and update existing content

---

## 🔐 Permissions

| Feature | User | Admin/Head | QA |
|---------|------|-----------|--------|
| View Knowledge Base | ✅ | ✅ | ✅ |
| **Upload Files** | ❌ | ✅ | ❌ |
| **Generate Tasks** | ❌ | ✅ | ✅ |
| **Approve Tasks** | ❌ | ✅ | ✅ |
| Delete Entries | ❌ | ✅ | ❌ |

---

## 🔌 API Integration

### POST - Upload & Analyze

```bash
curl -X POST https://www.sellerops.com.br/api/marketplace/knowledge-base/upload \
  -F "file=@document.pdf" \
  -F "marketplaces=[\"amazon\",\"shopee\"]" \
  -F "autoGenerateTasks=true"
```

**Response:**
```json
{
  "status": "success",
  "entry": {
    "id": "kb-123",
    "filename": "document.pdf",
    "summary": "Market analysis for Q1 2026...",
    "marketplaces": ["amazon", "shopee"],
    "analysis": {
      "keyInsights": [...],
      "recommendations": [...],
      "taskTemplates": [...]
    }
  },
  "generatedTasks": [
    {
      "id": "task-1",
      "title": "Optimize pricing strategy",
      "channel": "amazon",
      "status": "pending_approval"
    }
  ]
}
```

### POST - Generate Tasks

```bash
curl -X POST https://www.sellerops.com.br/api/marketplace/knowledge-base/generate-tasks \
  -H "Content-Type: application/json" \
  -d '{
    "knowledgeBaseIds": ["kb-123"],
    "marketplaces": ["amazon", "shopee"],
    "autoApprove": false
  }'
```

### GET - List Knowledge Entries

```bash
curl https://www.sellerops.com.br/api/marketplace/knowledge-base/generate-tasks \
  ?marketplace=amazon&limit=50
```

---

## 📈 Workflow Examples

### Simple Workflow: Single File Upload

```
Admin uploads pricing CSV
      ↓
NEXO analyzes price points
      ↓
Creates 6 tasks (one per marketplace)
      ↓
Admin reviews recommendations
      ↓
Approves tasks
      ↓
Agents execute pricing updates
      ↓
Monitor results in Phase 3 dashboard
```

### Advanced Workflow: Bulk Learning

```
Admin uploads:
  - Competitor analysis (image)
  - Pricing data (CSV)
  - Marketplace rules (PDF)
      ↓
NEXO creates knowledge entries for each
      ↓
Generates 15-20 total tasks
      ↓
Admin prioritizes by marketplace
      ↓
Approves Phase 1 immediately
      ↓
Reviews Phase 2 recommendations
      ↓
Staggered rollout across channels
```

### Continuous Learning Workflow

```
1. Weekly: Upload market research updates
2. NEXO learns new trends
3. Updates agent instructions automatically
4. Agents incorporate learnings
5. Monitor performance improvements
6. Adjust strategy based on results
```

---

## ⚡ Best Practices

### File Selection

- ✅ **DO:** Upload real marketplace data
- ✅ **DO:** Include competitor analysis
- ✅ **DO:** Provide pricing/trend data
- ❌ **DON'T:** Upload unrelated files
- ❌ **DON'T:** Upload low-quality images
- ❌ **DON'T:** Mix different marketplace formats

### Marketplace Selection

- ✅ **DO:** Select where knowledge applies
- ✅ **DO:** Select multiple if relevant
- ❌ **DON'T:** Select all if irrelevant
- ❌ **DON'T:** Create duplicate entries

### Task Approval

- ✅ **DO:** Review NEXO recommendations first
- ✅ **DO:** Test with Phase 1 before Phase 2
- ✅ **DO:** Stagger rollout by marketplace
- ❌ **DON'T:** Auto-approve critical changes
- ❌ **DON'T:** Skip review for major updates

### Knowledge Management

- ✅ **DO:** Archive old entries
- ✅ **DO:** Keep metadata accurate
- ✅ **DO:** Version important files
- ❌ **DON'T:** Store sensitive data
- ❌ **DON'T:** Upload personally identifiable info

---

## 🐛 Troubleshooting

### Issue: "File too large"
**Cause:** File exceeds 10MB limit
**Fix:** Compress image, remove unnecessary data from spreadsheet

### Issue: "Unsupported file type"
**Cause:** File format not recognized
**Fix:** Convert to PDF, CSV, or standard image format

### Issue: "No insights generated"
**Cause:** File content not relevant to marketplaces
**Fix:** Ensure file contains marketplace-related data

### Issue: "Tasks not generating"
**Cause:** Marketplace selection missing
**Fix:** Select at least one marketplace when uploading

### Issue: "Can't delete entry"
**Cause:** Not admin or tasks still pending
**Fix:** Approve/reject tasks first, then delete

---

## 🚀 Advanced Features (Coming Soon)

- [ ] **Real-time Collaboration:** Share insights with team
- [ ] **Version Control:** Track knowledge updates
- [ ] **Integration with BI:** Connect to analytics tools
- [ ] **Predictive Insights:** ML-powered recommendations
- [ ] **Compliance Checker:** Automatic guideline verification
- [ ] **Multi-language:** Support non-English documents
- [ ] **OCR Enhancement:** Better image text extraction
- [ ] **Custom Analysis:** User-defined extraction rules

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review uploaded file and selections
3. Check marketplace-specific guidelines
4. Contact admin team

---

## 🎓 Example Files to Upload

**Good Examples:**
- Competitor's product listing screenshots
- Market pricing research spreadsheets
- Marketplace policy PDFs
- Product photography collections
- Sales trend reports
- Seasonal strategy documents

**What NOT to Upload:**
- Confidential company data
- Personal information
- Unrelated documents
- Corrupted files
- Very low-quality images

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-24
**Version:** 1.0
