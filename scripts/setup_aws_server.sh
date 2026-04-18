#!/bin/bash
set -e

# Configuration
SSH_KEY="./web/certs/keibai-key.pem"
SERVER_IP="35.79.228.176"
USER="ubuntu"

echo "=========================================================="
echo "🚀 INITIATING AWS SERVER SETUP (Tokyo t3.medium)"
echo "Target: $USER@$SERVER_IP"
echo "=========================================================="

# Ensure key has correct permissions
chmod 400 "$SSH_KEY"

echo "[1/3] Connecting and installing system dependencies (Python 3.12, Docker, Git)..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$USER@$SERVER_IP" << 'EOF'
    set -e
    
    # 1. Update system & Install Build Essentials
    sudo apt-get update -y
    sudo apt-get upgrade -y
    sudo apt-get install -y build-essential curl wget git unzip psmisc jq software-properties-common

    # 2. Install Python 3.12
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt-get update -y
    sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip

    # 3. Install Docker & Docker Compose
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        sudo chmod 666 /var/run/docker.sock
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    # 4. Setup Application Directory
    sudo mkdir -p /app
    sudo chown -R $USER:$USER /app
    
    # 5. Initialize Python Virtual Environment for Crawler
    echo "Setting up Python Environment for Crawler..."
    cd /app
    if [ ! -d "venv" ]; then
        python3.12 -m venv venv
    fi
EOF
echo "✅ System dependencies installed."

echo "----------------------------------------------------------"
echo "[2/3] Transferring application files to server..."
# Using rsync to copy the necessary folders
# Exclude node_modules, .next, .git, venv
rsync -avz -e "ssh -i $SSH_KEY" --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude 'crawler/venv' --exclude 'certs' ./ $USER@$SERVER_IP:/app/
echo "✅ Codebase transferred."

echo "----------------------------------------------------------"
echo "[3/3] Setting up Node.js, Playwright, and Cron Job on AWS..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$USER@$SERVER_IP" << 'EOF'
    set -e
    cd /app
    
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "Sourcing Python Virtual Environment..."
    source venv/bin/activate
    
    echo "Installing Python requirements..."
    pip install --upgrade pip
    cd crawler
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi
    
    echo "Installing Playwright Headless Browsers..."
    playwright install chromium
    playwright install-deps chromium
    
    echo "Setting up System Cron for Daily Crawl (2:00 AM JST)..."
    # Note: Server is in Tokyo (JST) by default if initialized properly, but just to be sure we set timezone
    sudo timedatectl set-timezone Asia/Tokyo
    
    # Make script executable
    chmod +x run_daily.sh
    
    # Setup Crontab for 4:00 AM daily
    CRON_CMD="0 4 * * * cd /app/crawler && /bin/bash ./run_daily.sh >> /app/logs/cron.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "run_daily.sh"; echo "$CRON_CMD") | crontab -
    
    echo "----------------------------------------------------------"
    echo "🎉 AWS SERVER DEPLOYMENT COMPLETE!"
    echo "To SSH into the server: ssh -i ./certs/keibai-key.pem ubuntu@35.79.228.176"
    echo "To view logs: ssh -i ./certs/keibai-key.pem ubuntu@35.79.228.176 'tail -f /app/logs/cron.log'"
EOF
