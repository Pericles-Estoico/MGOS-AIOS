# Epic 2 - Deployment Guide

**Version:** 2.0.0
**Status:** Ready for Deployment
**Last Updated:** 2026-02-20

---

## 🚀 Deployment Overview

This guide covers deploying the MGOS-AIOS application to production after Epic 2 completion.

### Architecture
- **Frontend:** Next.js 16 (React 19)
- **Backend:** Next.js API routes + Supabase
- **Database:** PostgreSQL (Supabase)
- **Auth:** NextAuth.js v5
- **Infrastructure:** Vercel (recommended) or self-hosted

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] All GitHub Actions checks passing
- [ ] Code reviewed and merged to main
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backups created
- [ ] Performance tested

---

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

**Benefits:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Free tier available
- Preview deployments

**Steps:**

1. **Connect Repository**
   ```
   https://vercel.com/new
   - Select GitHub repository
   - Select MGOS-AIOS
   ```

2. **Configure Environment**
   ```
   Environment Variables:
   - NEXTAUTH_URL = https://your-domain.vercel.app
   - NEXTAUTH_SECRET = (generate: openssl rand -base64 32)
   - NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = (from Supabase)
   - SUPABASE_SERVICE_ROLE_KEY = (from Supabase)
   ```

3. **Deploy**
   ```
   Click "Deploy"
   - Automatic build
   - Automatic tests
   - Live in ~5 minutes
   ```

4. **Post-Deployment**
   ```
   Verify:
   - https://your-domain.vercel.app
   - Login works
   - Tasks load
   - Tests still passing
   ```

### Option 2: Self-Hosted (Docker)

**Benefits:**
- Full control
- Custom infrastructure
- No vendor lock-in

**Steps:**

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build Image**
   ```bash
   docker build -t mgos-aios:latest .
   ```

3. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e NEXTAUTH_URL=https://your-domain.com \
     -e NEXTAUTH_SECRET=your-secret \
     -e NEXT_PUBLIC_SUPABASE_URL=https://... \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
     mgos-aios:latest
   ```

### Option 3: Railway/Render

Similar to Vercel but with more customization options.

---

## 🗄️ Database Preparation

### Supabase Setup

1. **Create Project**
   ```
   https://app.supabase.com/projects
   - Click "New project"
   - Choose region (EU/US)
   - Save connection string
   ```

2. **Create Tables**
   Already created in Epic 1:
   - users
   - tasks
   - evidence
   - qa_reviews
   - time_logs
   - audit_logs

3. **Setup RLS Policies**
   - 29 policies already in place
   - Verified in Epic 1
   - Test access control before go-live

4. **Verify Connection**
   ```bash
   psql "postgresql://user:pass@db.supabase.co/postgres"
   \dt  # List tables
   SELECT count(*) FROM tasks;
   ```

### Data Migration (if from old system)

If migrating from existing MGOS:

1. **Backup Old Data**
   ```bash
   pg_dump old_db > backup.sql
   ```

2. **Map Old Schema to New**
   ```
   Old Tasks → New Tasks table
   Old Users → New Users table
   Old Logs → Audit Log table
   ```

3. **Write Migration Script**
   ```sql
   INSERT INTO tasks (id, title, status, ...)
   SELECT id, title, 'pending', ...
   FROM old_mgos.tasks;
   ```

4. **Verify Data**
   ```
   Check counts match
   Verify key relationships
   Test RLS policies
   ```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] NEXTAUTH_SECRET is strong (32+ chars)
- [ ] Environment variables not in code
- [ ] HTTPS enforced everywhere
- [ ] RLS policies tested
- [ ] No hardcoded credentials
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if needed)
- [ ] Password hashing verified
- [ ] Audit logs enabled
- [ ] Backups scheduled

**Minimal Security Config:**
```env
# .env.production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-string>
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-key>
SUPABASE_SERVICE_ROLE_KEY=<secret-key>
NODE_ENV=production
```

---

## 📊 Performance Optimization

### Before Deployment

1. **Build Size**
   ```bash
   npm run build
   # Should be < 50MB
   ```

2. **Load Testing**
   ```bash
   Load 100 concurrent users
   Monitor response times
   Check database query performance
   ```

3. **Bundle Analysis**
   ```bash
   npm run build --analyze
   # Identify large dependencies
   # Optimize if needed
   ```

### Post-Deployment

1. **Monitor Performance**
   - Use Vercel Analytics
   - Monitor Supabase metrics
   - Set up alerts for slowness

2. **Key Metrics**
   - Page load time: < 2s
   - API response: < 500ms
   - Database queries: < 100ms

---

## 🔄 Continuous Deployment

### Auto-Deployment on Push

GitHub Actions automatically:
1. Runs tests
2. Builds app
3. Deploys to Vercel (if all pass)

**Setup (Vercel):**
1. Connect GitHub repo
2. Set production branch to `main`
3. Auto-redeploy on each push

**Setup (Other):**
1. Configure CI/CD to trigger deploy
2. Add deployment step to GitHub Actions
3. Use deployment tokens/keys

---

## 🚨 Rollback Procedure

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # Vercel
   Dashboard → Select previous deployment → Promote

   # Docker
   docker stop $(docker ps -q)
   docker run -d previous-version:tag ...
   ```

2. **Check Status**
   ```bash
   # Can you access the app?
   curl https://your-domain.com

   # Do logins work?
   # Can you view tasks?
   ```

3. **Investigate**
   ```bash
   Check logs for errors
   Review recent code changes
   Run tests locally to reproduce
   ```

4. **Fix & Redeploy**
   ```bash
   git revert <commit>
   git push origin main
   # Auto-redeploys
   ```

---

## 📝 Post-Deployment Validation

After deployment, run these checks:

### 1. Smoke Tests (5 minutes)
```
✓ Website loads
✓ Login works (create test user)
✓ Can view tasks
✓ Can create task
✓ Timer starts
✓ Evidence submits
✓ QA review works
✓ Reassignment works
✓ Burndown chart shows
✓ API endpoints respond
```

### 2. Performance Check
```bash
curl -w "@curl-format.txt" \
  https://your-domain.com/api/tasks

# Should see:
# Total time: < 500ms
# DNS lookup: < 100ms
# Response time: < 200ms
```

### 3. Database Integrity
```sql
-- Check record counts
SELECT count(*) FROM tasks;
SELECT count(*) FROM users;
SELECT count(*) FROM audit_logs;

-- Check recent data
SELECT * FROM tasks
ORDER BY created_at DESC
LIMIT 1;
```

### 4. Monitoring
```
Set up alerts for:
- High error rate (> 1%)
- Slow response times (> 1s)
- Database connection errors
- Memory usage (> 80%)
```

---

## 📚 Documentation for Admins

After deployment, share with admins:

1. **Access Instructions**
   - URL: https://your-domain.com
   - Login credentials: (provide)
   - First steps: Create test task

2. **Troubleshooting**
   - If slow: Check database
   - If errors: Check logs in Vercel/Docker
   - If data missing: Verify RLS policies

3. **Maintenance**
   - Daily: Monitor error rates
   - Weekly: Review audit logs
   - Monthly: Backup database
   - Quarterly: Performance review

---

## 🎯 Go-Live Checklist

Final checklist before announcing publicly:

- [ ] All features tested
- [ ] Users created and trained
- [ ] Data migrated and verified
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Support process documented
- [ ] Rollback plan ready
- [ ] Team briefed
- [ ] Communications ready

---

## 📞 Support & Monitoring

### Who to Contact
```
Frontend Issues     → Development Team
Database Issues    → Database Engineer
Authentication     → Security Team
Performance        → DevOps Team
```

### Monitoring Tools
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://app.supabase.com
- **GitHub Actions:** Repo → Actions tab

### Escalation Path
```
1. Developer checks logs
2. Team discusses issue
3. If critical: Rollback
4. Investigation post-mortem
```

---

## 🚀 Next Steps (Post-Deployment)

1. **Monitor** (first 24 hours)
   - Check error rates
   - Verify logins working
   - Test all features

2. **Document** (first week)
   - Create runbook
   - Document issues found
   - Update disaster recovery plan

3. **Optimize** (weeks 2-4)
   - Implement feedback
   - Performance tuning
   - Feature refinements

4. **Plan** (after week 4)
   - Epic 3 features
   - User interviews
   - Roadmap updates

---

**Deployment Status: ✅ Ready**

All Epic 2 features are complete and tested.
Application is ready for production deployment.

**Recommended Deploy Date:** Feb 21, 2026
**Estimated Time:** 30 minutes
**Required: Supabase project + Environment vars**

---

**Questions?** Contact Development Team or check [CI/CD Setup](./CI-CD-SETUP.md)

**Last Updated:** 2026-02-20
**Maintained By:** DevOps Team
