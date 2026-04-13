#!/bin/bash
# Keibai Finder - Auto Crawler Cron Script
# ----------------------------------------
# This script is designed to run automatically via cron (e.g., at 2:00 AM daily).
# It will activate the python virtual environment, run the active and historical crawlers,
# and log the output.

PROJECT_DIR="/Users/kimtrung/keibai-finder"
LOG_FILE="$PROJECT_DIR/logs/crawler_cron.log"
VENV_DIR="$PROJECT_DIR/crawler/venv"

echo "======================================" >> "$LOG_FILE"
echo "Starting Keibai Crawler Cron Run at $(date)" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"

cd "$PROJECT_DIR" || exit 1

# Activate Python Virtual Environment
source "$VENV_DIR/bin/activate"

# 1. Run Active Properties Crawler
echo "[$(date)] Running Active Properties Crawler (advanced_crawler.py)..." >> "$LOG_FILE"
python -u crawler/advanced_crawler.py >> "$LOG_FILE" 2>&1
echo "[$(date)] Active Crawler Finished with exit code $?" >> "$LOG_FILE"

# 2. Run Historical Results Crawler
echo "[$(date)] Running Historical Results Crawler (crawl_all_japan_results.py)..." >> "$LOG_FILE"
python -u crawler/crawl_all_japan_results.py >> "$LOG_FILE" 2>&1
echo "[$(date)] Historical Crawler Finished with exit code $?" >> "$LOG_FILE"

# Deactivate venv
deactivate

# 3. Prisma Re-sync/Generate (Optional hook - useful for keeping UI synced if schema changes locally, usually not needed daily)
# cd "$PROJECT_DIR/web"
# npx prisma generate >> "$LOG_FILE" 2>&1

echo "======================================" >> "$LOG_FILE"
echo "Crawler Cron Run Completed at $(date)" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"
