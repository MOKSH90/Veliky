# Windows PowerShell Installer for SENTINEL CLI (Zero-Clone Remote Installer)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🛡️  Installing SENTINEL Sovereign AI Workbench CLI" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is required but not installed. Please install Node.js 18+." -ForegroundColor Red
    Exit 1
}

$SentinelHome = Join-Path $env:USERPROFILE ".sentinel"
$AppDir = Join-Path $SentinelHome "app"
$BinDir = Join-Path $SentinelHome "bin"

# If not running from local project folder, download to ~/.sentinel/app
if (-not (Test-Path "package.json") -or -not (Test-Path "bin")) {
    Write-Host "📥 Downloading SENTINEL Workbench to $AppDir..." -ForegroundColor Yellow
    if (Test-Path $AppDir) { Remove-Item -Recurse -Force $AppDir }
    New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
    
    if (Get-Command git -ErrorAction SilentlyContinue) {
        git clone --depth 1 https://github.com/your-username/sentinel-workbench.git $AppDir --quiet
    } else {
        $ZipPath = Join-Path $env:TEMP "sentinel.zip"
        Invoke-WebRequest -Uri "https://github.com/your-username/sentinel-workbench/archive/refs/heads/main.zip" -OutFile $ZipPath
        Expand-Archive -Path $ZipPath -DestinationPath $env:TEMP -Force
        Move-Item -Path "$env:TEMP\sentinel-workbench-main\*" -Destination $AppDir -Force
    }
    Set-Location -Path $AppDir
} else {
    $AppDir = Get-Location
}

Write-Host "📦 Installing SENTINEL dependencies..." -ForegroundColor Yellow
npm install --silent

if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
}

$CmdFile = Join-Path $BinDir "sentinel.cmd"
$ScriptTarget = Join-Path $AppDir "bin\sentinel.js"

$CmdContent = @"
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe" "$ScriptTarget" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node "$ScriptTarget" %*
)
"@

Set-Content -Path $CmdFile -Value $CmdContent

# Add to User PATH environment variable if not present
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -notlike "*$BinDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$BinDir", "User")
    Write-Host "✅ Added $BinDir to User PATH" -ForegroundColor Green
} else {
    Write-Host "✅ $BinDir already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎉 Windows Installation Complete! SENTINEL is ready." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Run any of these commands anywhere in PowerShell/CMD:"
Write-Host "  • sentinel pair    -> Show mobile app pairing QR code"
Write-Host "  • sentinel start   -> Launch server engine"
Write-Host "  • sentinel web     -> Open web UI in browser"
Write-Host "  • sentinel status  -> View system telemetry"
Write-Host "==================================================" -ForegroundColor Cyan
