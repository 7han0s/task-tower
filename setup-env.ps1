# Script to help set up environment variables for Task Tower

# Prompt for Google Service Account credentials
$credentialsPath = Read-Host "Enter path to your Google Service Account JSON file (e.g., C:\path\to\credentials.json):"

# Read the credentials file
$credentials = Get-Content $credentialsPath -Raw

# Prompt for Google Sheet ID
$spreadsheetId = Read-Host "Enter your Google Sheet ID (from the URL after /d/ and before /edit):"

# Create or update the .env file
$envContent = @"
# Server Configuration
PORT=3001
NODE_ENV=development

# Google API Configuration
GOOGLE_CREDENTIALS=$credentials
GOOGLE_SPREADSHEET_ID=$spreadsheetId

# Optional Google API Configuration
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_TOKEN_PATH=../test/token.json
GOOGLE_REDIRECT_URI=http://localhost:3001/callback

# Developer Configuration
DEVELOPER_EMAIL=princefakhan@gmail.com
"@

# Write to .env file
$envContent | Set-Content -Path "server\.env"

Write-Host "Environment variables have been updated!" -ForegroundColor Green
Write-Host "You can now start the server with: cd server && npm run dev" -ForegroundColor Green
