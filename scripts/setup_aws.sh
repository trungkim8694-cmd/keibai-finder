#!/bin/bash

# ==============================================================================
# AWS Server Automation Setup for Keibai Finder
# ==============================================================================
# This script automates the setup of an AWS EC2 instance (Ubuntu) for crawling.
# It installs Docker, Python 3.12, and Playwright with all dependencies.
# ==============================================================================

set -e

# 1. Configuration & .env loading
PROJECT_ROOT=$(pwd)
ENV_FILE="$PROJECT_ROOT/web/.env"

if [ -f "$ENV_FILE" ]; then
    echo "--- Loading configuration from $ENV_FILE ---"
    # Export variables from .env (ignoring comments and empty lines)
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^[[:space:]]*$' | xargs)
else
    echo "❌ Error: web/.env file not found at $ENV_FILE"
    exit 1
fi

# 2. Variable resolution
# Use values from .env or defaults
SERVER_IP="${AWS_SERVER_IP}"
# If the path in .env starts with ./certs, we prepend web/ if we are at root
KEY_PATH="${AWS_SSH_KEY_PATH}"
if [[ "$KEY_PATH" == "./certs/"* ]]; then
    KEY_PATH="web/${KEY_PATH#./}"
fi

SSH_USER="ubuntu" # Default for AWS Ubuntu AMIs
TG_TOKEN="${TELEGRAM_BOT_TOKEN}"
TG_CHAT_ID="${TELEGRAM_CHAT_ID}"

# Validate required variables
if [ -z "$SERVER_IP" ]; then echo "❌ Error: AWS_SERVER_IP not set."; exit 1; fi
if [ -z "$KEY_PATH" ]; then echo "❌ Error: AWS_SSH_KEY_PATH not set."; exit 1; fi
if [ ! -f "$KEY_PATH" ]; then echo "❌ Error: SSH Key not found at $KEY_PATH"; exit 1; fi

echo "📍 Target IP: $SERVER_IP"
echo "🔑 SSH Key: $KEY_PATH"

# 3. Secure SSH Key permissions
echo "--- Securing SSH Key permissions ---"
chmod 400 "$KEY_PATH"

# 4. Remote Execution
echo "--- Starting remote setup via SSH (User: $SSH_USER) ---"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" << 'EOF'
    set -e
    
    echo "⏳ [1/5] Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y software-properties-common curl git build-essential libgbm-dev

    echo "⏳ [2/5] Installing Docker & Docker Compose..."
    sudo apt-get install -y docker.io docker-compose
    sudo usermod -aG docker $USER
    # Enable docker service
    sudo systemctl enable docker
    sudo systemctl start docker

    echo "⏳ [3/5] Installing Python 3.12 (via deadsnakes PPA)..."
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt-get update
    sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip

    echo "⏳ [4/5] Setting up Crawler Environment..."
    mkdir -p ~/keibai-finder
    cd ~/keibai-finder
    
    # Create virtualenv
    python3.12 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install playwright prisma python-dotenv requests beautifulsoup4

    echo "⏳ [5/5] Installing Playwright Browsers & OS Dependencies..."
    playwright install chromium
    sudo playwright install-deps chromium

    echo "--- Server Verification ---"
    python3.12 --version
    docker --version
    playwright --version
    
    echo "✅ Remote setup completed successfully!"
EOF

# 5. Final Notification
echo "--- Finalizing ---"
if [ ! -z "$TG_TOKEN" ] && [ ! -z "$TG_CHAT_ID" ]; then
    echo "--- Sending Telegram Notification ---"
    MESSAGE="🚀 *Keibai Finder: AWS Setup Complete*%0A%0A📍 *IP:* $SERVER_IP%0A🐳 *Docker:* Installed%0A🐍 *Python:* 3.12.x%0A🌐 *Playwright:* Ready%0A%0A_Server is now prepared for crawling._"
    
    curl -s -X POST "https://api.telegram.org/bot$TG_TOKEN/sendMessage" \
        -d "chat_id=$TG_CHAT_ID&text=$MESSAGE&parse_mode=Markdown" > /dev/null
    echo "✅ Telegram notification sent."
fi

echo "🎉 All Done! You can now deploy your crawler code to ~/keibai-finder on the server."
