# Script to import CSV files into Google Sheets

# Function to import CSV to Google Sheet
function Import-CsvToGoogleSheet {
    param (
        [string]$CsvPath,
        [string]$SheetName,
        [string]$Range
    )

    # Check if Google Sheets API is installed
    if (-not (Get-Module -ListAvailable -Name Google.Apis.Sheets.v4)) {
        Write-Host "Google Sheets API module not found. Please install it first."
        return
    }

    # Load Google Sheets API
    Import-Module Google.Apis.Sheets.v4

    # Initialize Google Sheets service
    $service = New-Object Google.Apis.Sheets.v4.SheetsService
    $service.Key = "YOUR_API_KEY"

    # Read CSV file
    $csvData = Import-Csv -Path $CsvPath
    
    # Convert to array of arrays
    $values = @()
    $csvData | ForEach-Object {
        $row = @()
        $_.PSObject.Properties.Value | ForEach-Object {
            $row += $_
        }
        $values += , $row
    }

    # Create request body
    $body = New-Object Google.Apis.Sheets.v4.Data.ValueRange
    $body.Values = $values

    # Make API call
    try {
        $result = $service.Spreadsheets.Values.Update($body, $spreadsheetId, $Range).Execute()
        Write-Host "Successfully imported data to $SheetName"
    }
    catch {
        Write-Host "Error importing data: $_"
    }
}

# Main script
$spreadsheetId = Read-Host "Enter Google Sheet ID"

# Import Game State
Import-CsvToGoogleSheet -CsvPath "game_state.csv" -SheetName "Game State" -Range "A1:D2"

# Import Player Data
Import-CsvToGoogleSheet -CsvPath "player_data.csv" -SheetName "Player Data" -Range "A1:D2"
