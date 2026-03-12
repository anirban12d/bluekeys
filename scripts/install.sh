#!/bin/sh
set -e

REPO="anirban12d/bluekeys"
INSTALL_DIR="/usr/local/bin"

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64)         ARCH="x64" ;;
  aarch64|arm64)  ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
esac

case "$OS" in
  darwin|linux) ;;
  *) echo "Unsupported OS: $OS" >&2; exit 1 ;;
esac

# Use version arg or default to latest
VERSION="${1:-latest}"
if [ "$VERSION" = "latest" ]; then
  URL="https://github.com/$REPO/releases/latest/download/bluekeys-${OS}-${ARCH}.tar.gz"
else
  URL="https://github.com/$REPO/releases/download/${VERSION}/bluekeys-${OS}-${ARCH}.tar.gz"
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading bluekeys for ${OS}-${ARCH}..."
if ! curl -fsSL "$URL" -o "$TMPDIR/bluekeys.tar.gz"; then
  echo "Download failed. Check that the release exists for your platform." >&2
  exit 1
fi

tar xzf "$TMPDIR/bluekeys.tar.gz" -C "$TMPDIR"
chmod +x "$TMPDIR/bluekeys"

if [ -w "$INSTALL_DIR" ]; then
  mv "$TMPDIR/bluekeys" "$INSTALL_DIR/bluekeys"
else
  echo "Installing to $INSTALL_DIR (requires sudo)..."
  sudo mv "$TMPDIR/bluekeys" "$INSTALL_DIR/bluekeys"
fi

echo "bluekeys installed successfully! Run 'bluekeys' to start."
