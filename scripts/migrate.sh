#!/bin/bash
# Migration script to run all pending migrations on the remote D1 database

echo "🚀 Running D1 migrations on remote database..."

# Array of migration files in order
migrations=(
  "migrations/002_create_tables.sql"
  "migrations/004_fix_table_names.sql"
  "migrations/005_add_email_verified.sql"
  "migrations/006_admin_schema.sql"
  "migrations/007_add_google_maps_link.sql"
)

# Run each migration
for migration in "${migrations[@]}"; do
  if [ -f "$migration" ]; then
    echo "📝 Running migration: $migration"
    npx wrangler d1 execute coffee-circle-db --remote --file "./$migration" --yes
    
    # Check exit code but continue even if migration fails (might already be applied)
    if [ $? -eq 0 ]; then
      echo "✅ Successfully ran: $migration"
    else
      echo "⚠️  Migration may have already been applied: $migration (continuing...)"
    fi
  else
    echo "⚠️  Migration file not found: $migration"
  fi
done

echo "✨ Migration process completed!"
