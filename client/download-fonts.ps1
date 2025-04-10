# Download Press Start 2P font
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/pressstart2p/v10/8c4rF3l5QHhE9VbJXw.ttf" -OutFile "src\assets\fonts\PressStart2P-Regular.ttf"

# Download Roboto Regular font
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf" -OutFile "src\assets\fonts\Roboto-Regular.ttf"

# Download Roboto Bold font
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf" -OutFile "src\assets\fonts\Roboto-Bold.ttf"

Write-Output "Font files downloaded successfully!"
