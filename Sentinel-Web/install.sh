#!/usr/bin/env bash

set -e

echo "=================================================="
echo "🛡️  Installing SENTINEL Sovereign AI Workbench CLI"
echo "=================================================="
echo ""

SENTINEL_HOME="$HOME/.sentinel"
APP_DIR="$SENTINEL_HOME/app"

# Check for Node.js or auto-install portable runtime
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js not detected on this machine."
    echo "⚡ Auto-installing portable Node.js runtime for $(uname -s) ($(uname -m))..."
    
    OS="$(uname -s)"
    ARCH="$(uname -m)"
    NODE_VER="v20.18.0"
    
    if [ "$OS" = "Darwin" ]; then
        if [ "$ARCH" = "arm64" ]; then
            NODE_DIST="node-${NODE_VER}-darwin-arm64"
        else
            NODE_DIST="node-${NODE_VER}-darwin-x64"
        fi
    else
        NODE_DIST="node-${NODE_VER}-linux-x64"
    fi
    
    mkdir -p "$SENTINEL_HOME/node"
    curl -fsSL "https://nodejs.org/dist/${NODE_VER}/${NODE_DIST}.tar.gz" | tar -xz -C "$SENTINEL_HOME/node" --strip-components=1
    export PATH="$SENTINEL_HOME/node/bin:$PATH"
    echo "✅ Portable Node.js installed automatically!"
fi

# If running remotely via curl or if repo not present locally, install into ~/.sentinel/app
if [ ! -f "package.json" ] || [ ! -d "bin" ]; then
    echo "📥 Downloading SENTINEL Workbench files..."
    mkdir -p "$SENTINEL_HOME"
    if [ -d "$APP_DIR" ]; then
        rm -rf "$APP_DIR"
    fi
    mkdir -p "$APP_DIR"
    
    # Fast tarball download with progress, fallback to git clone
    if curl -fsSL "https://github.com/MOKSH90/Sentinel/archive/refs/heads/main.tar.gz" -o "$SENTINEL_HOME/sentinel.tar.gz" 2>/dev/null; then
        echo "📦 Extracting SENTINEL package files..."
        tar -xz -f "$SENTINEL_HOME/sentinel.tar.gz" -C "$APP_DIR" --strip-components=1
        rm -f "$SENTINEL_HOME/sentinel.tar.gz"
    else
        echo "⚡ Downloading via git clone..."
        git clone --depth 1 https://github.com/MOKSH90/Sentinel.git "$APP_DIR"
    fi
    
    if [ -d "$APP_DIR/Sentinel-Web" ]; then
        cd "$APP_DIR/Sentinel-Web"
    else
        cd "$APP_DIR"
    fi
    APP_DIR="$(pwd)"
else
    APP_DIR="$(pwd)"
fi

echo "📦 Installing SENTINEL dependencies..."
npm install --silent

echo "⚡ Linking 'sentinel' command to system PATH..."

BIN_SRC="$APP_DIR/bin/sentinel.js"
if [ -f "$BIN_SRC" ]; then
    chmod +x "$BIN_SRC"
else
    echo "⚠️ Warning: $BIN_SRC not found directly, searching in subfolders..."
    FOUND_BIN="$(find "$SENTINEL_HOME/app" -name "sentinel.js" | head -n 1)"
    if [ -n "$FOUND_BIN" ]; then
        BIN_SRC="$FOUND_BIN"
        APP_DIR="$(dirname "$(dirname "$BIN_SRC")")"
        chmod +x "$BIN_SRC"
    fi
fi

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
    if [ -d "$SENTINEL_HOME/node/bin" ] && ! grep -q "$SENTINEL_HOME/node/bin" "$SHELL_PROFILE"; then
        echo "export PATH=\"$SENTINEL_HOME/node/bin:\$PATH\"" >> "$SHELL_PROFILE"
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
