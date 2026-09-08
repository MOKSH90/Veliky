#!/usr/bin/env bash

set -e

echo "=================================================="
echo "🛡️  Installing SENTINEL Sovereign AI Workbench CLI"
echo "=================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

SENTINEL_HOME="$HOME/.sentinel"
APP_DIR="$SENTINEL_HOME/app"

# If running remotely via curl or if repo not present locally, install into ~/.sentinel/app
if [ ! -f "package.json" ] || [ ! -d "bin" ]; then
    echo "📥 Downloading SENTINEL Workbench to $APP_DIR..."
    mkdir -p "$SENTINEL_HOME"
    if [ -d "$APP_DIR" ]; then
        rm -rf "$APP_DIR"
    fi
    
    # Download latest repository archive or clone
    if command -v git &> /dev/null; then
        git clone --depth 1 https://github.com/MOKSH90/Sentinel.git "$APP_DIR" --quiet
    else
        mkdir -p "$APP_DIR"
        curl -fsSL https://github.com/MOKSH90/Sentinel/archive/refs/heads/main.tar.gz | tar -xz -C "$APP_DIR" --strip-components=1
    fi
    if [ -d "$APP_DIR/Sentinel-Web" ]; then
        cd "$APP_DIR/Sentinel-Web"
    else
        cd "$APP_DIR"
    fi
else
    APP_DIR="$(pwd)"
fi

echo "📦 Installing SENTINEL dependencies..."
npm install --silent

echo "⚡ Linking 'sentinel' command to system PATH..."

BIN_SRC="$APP_DIR/bin/sentinel.js"
chmod +x "$BIN_SRC"

LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
ln -sf "$BIN_SRC" "$LOCAL_BIN/sentinel"

if [ -w "/usr/local/bin" ]; then
    ln -sf "$BIN_SRC" "/usr/local/bin/sentinel" 2>/dev/null || true
fi

# Ensure ~/.local/bin is exported in shell profile
SHELL_PROFILE=""
if [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
fi

if [ -n "$SHELL_PROFILE" ]; then
    if ! grep -q "$LOCAL_BIN" "$SHELL_PROFILE"; then
        echo "export PATH=\"$LOCAL_BIN:\$PATH\"" >> "$SHELL_PROFILE"
    fi
fi

echo ""
echo "=================================================="
echo "🎉 Installation Complete! SENTINEL is ready."
echo "=================================================="
echo "Run any of these commands anywhere in your terminal:"
echo "  • sentinel pair    -> Show mobile app pairing QR code"
echo "  • sentinel start   -> Launch server engine"
echo "  • sentinel web     -> Open web UI in browser"
echo "  • sentinel status  -> View system telemetry"
echo "=================================================="
