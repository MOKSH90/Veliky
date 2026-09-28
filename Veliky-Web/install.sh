#!/usr/bin/env bash

set -euo pipefail

echo "=================================================="
echo "🛡️  Installing VELIKY Sovereign AI Workbench CLI"
echo "=================================================="
echo ""

VELIKY_HOME="$HOME/.veliky"
APP_DIR="$VELIKY_HOME/app"

# Resolve a local checkout from the script, independently of the caller's cwd.
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
    INSTALL_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
    if [[ -f "$INSTALL_DIR/package.json" && -d "$INSTALL_DIR/bin" ]]; then
        cd "$INSTALL_DIR"
    fi
fi

# Check for Node.js or auto-install portable runtime
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js not detected on this machine."
    echo "⚡ Auto-installing portable Node.js runtime for $(uname -s) ($(uname -m))..."
    
    OS="$(uname -s)"
    ARCH="$(uname -m)"
    NODE_VER="v22.19.0"
    
    if [ "$OS" = "Darwin" ]; then
        if [ "$ARCH" = "arm64" ]; then
            NODE_DIST="node-${NODE_VER}-darwin-arm64"
        else
            NODE_DIST="node-${NODE_VER}-darwin-x64"
        fi
    else
        case "$ARCH" in
            x86_64) NODE_DIST="node-${NODE_VER}-linux-x64" ;;
            aarch64|arm64) NODE_DIST="node-${NODE_VER}-linux-arm64" ;;
            *) echo "Unsupported CPU architecture: $ARCH"; exit 1 ;;
        esac
    fi
    
    mkdir -p "$VELIKY_HOME/node"
    curl -fsSL "https://nodejs.org/dist/${NODE_VER}/${NODE_DIST}.tar.gz" | tar -xz -C "$VELIKY_HOME/node" --strip-components=1
    export PATH="$VELIKY_HOME/node/bin:$PATH"
    echo "✅ Portable Node.js installed automatically!"
fi

# If running remotely via curl or if repo not present locally, install into ~/.veliky/app
if [ ! -f "package.json" ] || [ ! -d "bin" ]; then
    echo "📥 Downloading VELIKY Workbench files..."
    mkdir -p "$VELIKY_HOME"
    if [ -d "$APP_DIR" ]; then
        rm -rf "$APP_DIR"
    fi
    mkdir -p "$APP_DIR"
    
    # Fast tarball download with progress, fallback to git clone
    if curl -fsSL "https://github.com/MOKSH90/Veliky/archive/refs/heads/main.tar.gz" -o "$VELIKY_HOME/veliky.tar.gz" 2>/dev/null; then
        echo "📦 Extracting VELIKY package files..."
        tar -xz -f "$VELIKY_HOME/veliky.tar.gz" -C "$APP_DIR" --strip-components=1
        rm -f "$VELIKY_HOME/veliky.tar.gz"
    else
        echo "⚡ Downloading via git clone..."
        git clone --depth 1 https://github.com/MOKSH90/Veliky.git "$APP_DIR"
    fi
    
    if [ -d "$APP_DIR/Veliky-Web" ]; then
        cd "$APP_DIR/Veliky-Web"
    else
        cd "$APP_DIR"
    fi
    APP_DIR="$(pwd)"
else
    APP_DIR="$(pwd)"
fi

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 19)) { console.error("Node.js 22.19+ is required"); process.exit(1); }'
BACKEND_DIR="$(cd "$APP_DIR/../tflite" && pwd)"
PYTHON_BOOTSTRAP="${VELIKY_PYTHON:-python3}"
if [[ ! -x "$BACKEND_DIR/.venv/bin/python" ]]; then
    "$PYTHON_BOOTSTRAP" -m venv "$BACKEND_DIR/.venv"
fi
"$BACKEND_DIR/.venv/bin/python" -m pip install -r "$BACKEND_DIR/RAG/requirements-harness.txt"
echo "📦 Installing VELIKY dependencies..."
npm install --silent

echo "⚡ Linking 'veliky' command to system PATH..."

BIN_SRC="$APP_DIR/bin/veliky.js"
if [ -f "$BIN_SRC" ]; then
    chmod +x "$BIN_SRC"
else
    echo "⚠️ Warning: $BIN_SRC not found directly, searching in subfolders..."
    FOUND_BIN="$(find "$VELIKY_HOME/app" -name "veliky.js" | head -n 1)"
    if [ -n "$FOUND_BIN" ]; then
        BIN_SRC="$FOUND_BIN"
        APP_DIR="$(dirname "$(dirname "$BIN_SRC")")"
        chmod +x "$BIN_SRC"
    fi
fi

LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
ln -sf "$BIN_SRC" "$LOCAL_BIN/veliky"

if [ -w "/usr/local/bin" ]; then
    ln -sf "$BIN_SRC" "/usr/local/bin/veliky" 2>/dev/null || true
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
    if [ -d "$VELIKY_HOME/node/bin" ] && ! grep -q "$VELIKY_HOME/node/bin" "$SHELL_PROFILE"; then
        echo "export PATH=\"$VELIKY_HOME/node/bin:\$PATH\"" >> "$SHELL_PROFILE"
    fi
fi

echo ""
echo "=================================================="
echo "🎉 Installation Complete! VELIKY is ready."
echo "=================================================="
echo "Run any of these commands anywhere in your terminal:"
echo "  • veliky pair    -> Show mobile app pairing QR code"
echo "  • veliky start   -> Launch interactive CLI"
echo "  • veliky web     -> Open web UI in browser"
echo "  • veliky status  -> View system telemetry"
echo "=================================================="
