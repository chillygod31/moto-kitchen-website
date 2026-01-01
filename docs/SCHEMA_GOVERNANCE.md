# Schema Governance - How to Prevent Schema Drift

**Status:** Production Standard  
**Last Updated:** 2026-01-01

---

## 🎯 Goal

**Zero tolerance for schema inconsistencies** between:
1. Database (Supabase)
2. API code (Next.js)
3. Documentation (`DATABASE_SCHEMA.md`)
4. TypeScript types (`lib/database.types.ts`)

---

## ✅ The Process (Every Schema Change)

### **Step 1: Update Documentation FIRST**

**Before writing any code or SQL**, update `docs/DATABASE_SCHEMA.md`:

```markdown
### `table_name`
Description of what this table stores.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `new_column` | text | NO | What this column does |
```

**Get approval** from team lead if this is a production change.

---

### **Step 2: Write the Migration**

Create migration file:
```bash
supabase/migrations/$(date +%Y-%m-%d)-descriptive-name.sql
```

**Migration Checklist:**
- [ ] Adds column comments for clarity
- [ ] Includes data migration if renaming/consolidating
- [ ] Is reversible (or documents why not)
- [ ] Includes verification checks at the end
- [ ] Updates RLS policies if needed
- [ ] Updates indexes if needed

**Example:**
```sql
-- Add business_email column to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS business_email TEXT;

COMMENT ON COLUMN tenants.business_email IS 'Primary business contact email (used in APIs and emails)';

-- Verify
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'business_email'
  ) INTO col_exists;
  
  IF NOT col_exists THEN
    RAISE EXCEPTION 'Migration failed: business_email column not added';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully ✓';
END $$;
```

---

### **Step 3: Test Locally**

```bash
# Apply migration
supabase db reset --local

# Verify schema
psql $DATABASE_URL -c "\d+ table_name"

# Generate TypeScript types
npx supabase gen types typescript --local > lib/database.types.ts

# Run tests
npm run test:schema
```

---

### **Step 4: Update API Code**

**Use TypeScript types** (don't hardcode column names):

❌ **Bad:**
```typescript
const { data } = await supabase
  .from('tenants')
  .select('business_email') // Typo-prone
```

✅ **Good:**
```typescript
import { Database } from '@/lib/database.types'

type Tenant = Database['public']['Tables']['tenants']['Row']

const { data } = await supabase
  .from('tenants')
  .select<'*', Tenant>('business_email') // Type-safe
```

---

### **Step 5: Commit with Clear Message**

```bash
git add supabase/migrations/2026-01-01-add-business-email.sql
git add docs/DATABASE_SCHEMA.md
git add lib/database.types.ts
git commit -m "feat(schema): Add business_email to tenants table

- Added business_email column (text, nullable)
- Updated DATABASE_SCHEMA.md documentation
- Generated TypeScript types
- Added RLS policy for reading business_email

Closes #123"
```

---

### **Step 6: Deploy**

```bash
# Apply migration to staging
supabase db push --db-url $STAGING_DB_URL

# Verify staging
npm run test:staging

# Apply to production
supabase db push --db-url $PRODUCTION_DB_URL

# Verify production
npm run test:production
```

---

## 🚨 Red Flags (Never Do This)

### ❌ **Running SQL in Supabase UI Without Migration File**

**Problem:** Change is not tracked, not versioned, not reproducible.

**Solution:** Always write a migration file, even for "quick fixes".

---

### ❌ **Hardcoding Table/Column Names**

```typescript
// ❌ BAD
.from('tenant_memberships') // Table doesn't exist!
.select('ownerEmail') // Column doesn't exist!
```

**Solution:** Use TypeScript types generated from schema.

---

### ❌ **Adding Columns Without Updating Documentation**

**Problem:** Documentation becomes outdated, new devs get confused.

**Solution:** Update `DATABASE_SCHEMA.md` BEFORE writing migration.

---

### ❌ **Duplicate/Redundant Columns**

```sql
-- ❌ BAD
ALTER TABLE tenants ADD COLUMN business_email TEXT;
-- (but owner_email already exists for same purpose)
```

**Solution:** Consolidate columns in one migration, don't leave both.

---

## 🔍 Schema Validation Tools

### **1. Generate TypeScript Types (After Every Migration)**

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

**This ensures:**
- ✅ Code can't reference columns that don't exist
- ✅ TypeScript catches typos at compile time
- ✅ IDE autocomplete shows actual columns

---

### **2. Schema Validation Tests**

Create `__tests__/schema-validation.test.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

describe('Schema Validation', () => {
  test('tenants table has required columns', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, business_email, business_phone')
      .limit(1)
    
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
  
  test('time_slots has unique constraint on (tenant_id, fulfillment_type, slot_time)', async () => {
    // Attempt to insert duplicate
    const { error } = await supabase
      .from('time_slots')
      .insert([
        { tenant_id: TEST_TENANT_ID, fulfillment_type: 'pickup', slot_time: '2026-01-02T10:00:00Z' },
        { tenant_id: TEST_TENANT_ID, fulfillment_type: 'pickup', slot_time: '2026-01-02T10:00:00Z' }, // Duplicate
      ])
    
    expect(error).toBeDefined()
    expect(error?.message).toContain('unique constraint')
  })
})
```

**Run on every PR:**
```bash
npm run test:schema
```

---

### **3. Schema Diff Tool (Before Deploy)**

Compare local schema to production:

```bash
# Export local schema
pg_dump --schema-only $LOCAL_DB > local_schema.sql

# Export production schema
pg_dump --schema-only $PROD_DB > prod_schema.sql

# Diff
diff local_schema.sql prod_schema.sql
```

**Expected:** Only your new migration changes.

---

## 📋 Migration Review Checklist

Before merging ANY migration PR:

- [ ] `DATABASE_SCHEMA.md` updated with all changes
- [ ] Migration file follows naming convention (`YYYY-MM-DD-description.sql`)
- [ ] Migration includes verification checks
- [ ] TypeScript types regenerated (`lib/database.types.ts`)
- [ ] API code updated to use new schema
- [ ] Tests pass (`npm run test:schema`)
- [ ] Tested locally with `supabase db reset`
- [ ] RLS policies updated if new table/column
- [ ] Indexes added for frequently queried columns
- [ ] Foreign keys added for relationships
- [ ] Check constraints added for enums/validation
- [ ] Migration is reversible (or documented why not)
- [ ] No hardcoded values (use env vars for tenantId, etc.)
- [ ] Column comments added for clarity

---

## 🎓 Onboarding New Devs

### **Day 1: Schema Tour**

1. Read `docs/DATABASE_SCHEMA.md` (source of truth)
2. Review `supabase/migrations/` folder (history of all changes)
3. Run `supabase db reset --local` (see migrations execute)
4. Generate types: `npx supabase gen types typescript --local`
5. Review RLS policies in Supabase dashboard

### **Week 1: First Schema Change**

- Pair with senior dev
- Follow the 6-step process above
- Get PR reviewed by 2 people

---

## 📈 Continuous Improvement

### **Monthly Schema Audit**

Last Friday of every month:

1. Run full schema dump: `pg_dump --schema-only > audit.sql`
2. Check for:
   - Unused columns (grep codebase)
   - Missing indexes (slow query log)
   - Duplicate columns (like `owner_email` vs `business_email`)
   - Missing foreign keys
   - Tables without RLS policies
3. Create cleanup migration if needed

---

### **Automated Alerts**

Set up CI/CD checks:

```yaml
# .github/workflows/schema-validation.yml
name: Schema Validation

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Check DATABASE_SCHEMA.md updated
        run: |
          if git diff --name-only origin/main | grep "supabase/migrations"; then
            if ! git diff --name-only origin/main | grep "docs/DATABASE_SCHEMA.md"; then
              echo "❌ Migration added but DATABASE_SCHEMA.md not updated"
              exit 1
            fi
          fi
      
      - name: Check TypeScript types updated
        run: |
          if git diff --name-only origin/main | grep "supabase/migrations"; then
            if ! git diff --name-only origin/main | grep "lib/database.types.ts"; then
              echo "❌ Migration added but database.types.ts not updated"
              exit 1
            fi
          fi
      
      - name: Run schema tests
        run: npm run test:schema
```

---

## 🔒 Production Safety

### **Pre-Deploy Checklist**

- [ ] Migration tested on staging environment
- [ ] Verified no breaking changes for existing API endpoints
- [ ] Confirmed RLS policies don't block legitimate access
- [ ] Estimated migration duration (for large tables)
- [ ] Planned rollback strategy
- [ ] Team notified of deployment window

### **Rollback Plan**

Every migration should have a rollback script:

```sql
-- rollback/2026-01-01-add-business-email.sql
ALTER TABLE tenants DROP COLUMN IF EXISTS business_email;
```

If migration fails in production:
```bash
psql $PROD_DB < rollback/2026-01-01-add-business-email.sql
```

---

## 📚 Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema reference
- [ENGINEERING_TRUTH.md](../ENGINEERING_TRUTH.md) - RLS and security policies
- [CONTRIBUTING.md](../CONTRIBUTING.md) - General contribution guidelines

---

**Last Updated:** 2026-01-01  
**Owner:** Engineering Team  
**Review Cadence:** Quarterly

