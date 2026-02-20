#!/bin/bash
#
# Convert Anything — Offline Mode Launcher
# Works on Mac and Linux.
# Double-click it (Mac) or run:  bash start.sh

echo ""
echo " ================================================"
echo "  Convert Anything — Starting Offline Server..."
echo " ================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo " ERROR: Node.js is not installed on this computer."
    echo ""
    echo " Please install it from:  https://nodejs.org"
    echo " Choose the LTS version (Recommended For Most Users)."
    echo " Then run this script again."
    echo ""
    exit 1
fi

NODE_VER=$(node --version)
echo " Node.js found: $NODE_VER"
echo ""
echo " Starting server... your browser should open automatically."
echo " If it doesn't, open:  http://localhost:8080/"
echo ""
echo " Press Ctrl+C to stop."
echo ""

# Get the directory this script is in
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
node "$SCRIPT_DIR/serve.js"
