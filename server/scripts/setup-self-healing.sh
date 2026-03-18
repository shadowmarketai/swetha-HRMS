#!/bin/bash
# =============================================================
# One-Time Setup: Self-Healing Docker System for Coolify Server
#
# Usage: SSH into your server, download both scripts, review, then run:
#   nano setup-self-healing.sh   # review first!
#   nano docker-heal.sh          # review first!
#   bash setup-self-healing.sh
# =============================================================

set -e

echo "=== Setting up Docker Self-Healing System ==="

# 1. Install healing script (prefer standalone file, fallback to embedded)
echo "[1/4] Installing docker-heal.sh..."
if [ -f "docker-heal.sh" ]; then
  cp docker-heal.sh /root/docker-heal.sh
  echo "    Copied from local file."
else
  echo "    ERROR: docker-heal.sh not found in current directory."
  echo "    Download it first: curl -O https://raw.githubusercontent.com/shadowmarketai/swetha-HRMS/testing/server/scripts/docker-heal.sh"
  exit 1
fi

chmod +x /root/docker-heal.sh
echo "    Installed to /root/docker-heal.sh"

# 2. Set up cron jobs (replaces any existing heal/prune entries)
echo "[2/4] Installing cron jobs..."
CRON_HEAL="*/5 * * * * /root/docker-heal.sh"
CRON_CLEANUP="0 3 * * * docker system prune -af --filter 'until=72h' >> /var/log/docker-cleanup.log 2>&1"

(crontab -l 2>/dev/null | grep -v "docker-heal\|docker.*prune"; echo "$CRON_HEAL"; echo "$CRON_CLEANUP") | crontab -
echo "    Cron: heal every 5min, deep cleanup daily at 3AM."

# 3. Set restart policy on all running containers
echo "[3/4] Setting restart policy on all containers..."
for id in $(docker ps -q 2>/dev/null); do
  docker update --restart unless-stopped "$id" > /dev/null 2>&1
done
echo "    Done."

# 4. Initial cleanup
echo "[4/4] Running initial cleanup..."
docker container prune -f > /dev/null 2>&1
docker image prune -f > /dev/null 2>&1
mkdir -p /tmp/docker-heal-restarts
echo "    Done."

echo ""
echo "=== Self-Healing System Active ==="
echo ""
echo "What's running:"
echo "  - Every 5 min: restart unhealthy (max 3/hr per container) + prune stale (>5min)"
echo "  - Daily 3 AM:  deep Docker cleanup (images > 72h)"
echo "  - All containers: restart=unless-stopped"
echo ""
echo "Logs:    /var/log/docker-heal.log"
echo "Tracker: /tmp/docker-heal-restarts/ (auto-cleans after 1hr)"
echo ""
echo "Optional: Edit /root/docker-heal.sh to add Telegram alerts:"
echo "  TELEGRAM_BOT_TOKEN=\"your-bot-token\""
echo "  CHAT_ID=\"your-chat-id\""
echo ""
echo "Verify:"
echo "  crontab -l                    # check cron entries"
echo "  bash /root/docker-heal.sh     # manual test"
echo "  cat /var/log/docker-heal.log  # check output"
echo ""
echo "Done!"
