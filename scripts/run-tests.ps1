#!/bin/pwsh

Write-Output "Starting test suite..."

Write-Output "\n1. Generating sample data..."
node scripts/data-generator.js

Write-Output "\n2. Importing data to Google Sheets..."
node scripts/import-to-sheets.js

Write-Output "\n3. Testing API endpoints..."
./scripts/test-api-endpoints.ps

Write-Output "\n4. Exporting data to Supabase..."
node scripts/export-to-supabase.js

Write-Output "\nAll tests completed!"
