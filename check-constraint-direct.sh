#!/bin/bash
source .env.local

echo "🔍 Checking CHECK constraint directly..."

# Direct query to pg_constraint
RESULT=$(curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pg_constraint?conname=eq.check_slot_capacity&select=conname,contype" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")

echo "Response: $RESULT"
echo ""

if echo "$RESULT" | grep -q "check_slot_capacity"; then
  echo "✅ CHECK constraint 'check_slot_capacity' is ACTIVE in database!"
  echo ""
  echo "Constraint details:"
  echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
else
  echo "⚠️  CHECK constraint not found in pg_constraint table"
  echo "This might mean:"
  echo "  1. The constraint wasn't applied yet"
  echo "  2. The pg_constraint view isn't exposed via API"
  echo ""
  echo "You can verify manually in Supabase Dashboard:"
  echo "  SQL Editor → Run: SELECT * FROM pg_constraint WHERE conname = 'check_slot_capacity';"
fi
