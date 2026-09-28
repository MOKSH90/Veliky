# Windows PowerShell Installer for VELIKY CLI (Zero-Clone Remote Installer)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🛡️  Installing VELIKY Sovereign AI Workbench CLI" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "package.json"))) {
    Set-Location $PSScriptRoot
}

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is required but not installed. Please install Node.js 22.19+." -ForegroundColor Red
    Exit 1
}

$VelikyHome = Join-Path $env:USERPROFILE ".veliky"
$AppDir = Join-Path $VelikyHome "app"
$BinDir = Join-Path $VelikyHome "bin"

# If not running from local project folder, download to ~/.veliky/app
if (-not (Test-Path "package.json") -or -not (Test-Path "bin")) {
    Write-Host "📥 Downloading VELIKY Workbench to $AppDir..." -ForegroundColor Yellow
    if (Test-Path $AppDir) { Remove-Item -Recurse -Force $AppDir }
    New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
    
    if (Get-Command git -ErrorAction SilentlyContinue) {
        git clone --depth 1 https://github.com/MOKSH90/Veliky.git $AppDir --quiet
    } else {
        $ZipPath = Join-Path $env:TEMP "veliky.zip"
        Invoke-WebRequest -Uri "https://github.com/MOKSH90/Veliky/archive/refs/heads/main.zip" -OutFile $ZipPath
        Expand-Archive -Path $ZipPath -DestinationPath $env:TEMP -Force
        Move-Item -Path "$env:TEMP\Veliky-main\*" -Destination $AppDir -Force
    }
    if (Test-Path (Join-Path $AppDir "Veliky-Web")) {
        Set-Location -Path (Join-Path $AppDir "Veliky-Web")
    } else {
        Set-Location -Path $AppDir
    }
} else {
    $AppDir = Get-Location
}

$AppDir = (Get-Location).Path
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 19)) process.exit(1)'
if ($LASTEXITCODE -ne 0) { throw "Node.js 22.19+ is required" }
$BackendDir = Join-Path (Split-Path $AppDir) "tflite"
$PythonBin = Join-Path $BackendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $PythonBin)) {
    python -m venv (Join-Path $BackendDir ".venv")
    if ($LASTEXITCODE -ne 0) { throw "Python 3.11+ with venv is required" }
}
& $PythonBin -m pip install -r (Join-Path $BackendDir "RAG\requirements-harness.txt")
if ($LASTEXITCODE -ne 0) { throw "Python dependency installation failed" }
Write-Host "📦 Installing VELIKY dependencies..." -ForegroundColor Yellow
npm install --silent
if ($LASTEXITCODE -ne 0) { throw "npm dependency installation failed" }

if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
}

$CmdFile = Join-Path $BinDir "veliky.cmd"
$ScriptTarget = Join-Path $AppDir "bin\veliky.js"

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
Write-Host "🎉 Windows Installation Complete! VELIKY is ready." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Run any of these commands anywhere in PowerShell/CMD:"
Write-Host "  • veliky pair    -> Show mobile app pairing QR code"
Write-Host "  • veliky start   -> Launch interactive CLI"
Write-Host "  • veliky web     -> Open web UI in browser"
Write-Host "  • veliky status  -> View system telemetry"
Write-Host "==================================================" -ForegroundColor Cyan
