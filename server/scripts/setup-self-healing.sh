#!/bin/bash
# =============================================================
# One-Time Setup: Self-Healing Docker System for Coolify Server
#
# Usage: SSH into your server and run:
#   curl -sSL <raw-github-url> | bash
#   — or —
#   bash setup-self-healing.sh
# =============================================================

set -e

echo "=== Setting up Docker Self-Healing System ==="

# 1. Copy healing script
echo "[1/4] Installing docker-heal.sh..."
cp docker-heal.sh /root/docker-heal.sh 2>/dev/null || cat > /root/docker-heal.sh << 'SCRIPT'
#!/bin/bash
LOG="/var/log/docker-heal.log"
MAX_LOG_SIZE=5242880
TELEGRAM_BOT_TOKEN=""
CHAT_ID=""

send_alert() {
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      -d "chat_id=$CHAT_ID" -d "text=$1" > /dev/null 2>&1
  fi
}

if [ -f "$LOG" ] && [ $(stat -c%s "$LOG" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
  mv "$LOG" "${LOG}.old"
fi

echo "---- $(date '+%Y-%m-%d %H:%M:%S') ----" >> "$LOG"
ACTIONS=0

for id in $(docker ps --filter "health=unhealthy" -q 2>/dev/null); do
  name=$(docker inspect --format '{{.Name}}' "$id" 2>/dev/null | sed 's/^\/\///')
  echo "[HEAL] Restarting unhealthy: $name ($id)" >> "$LOG"
  docker restart "$id" >> "$LOG" 2>&1
  send_alert "⚠️ Restarted unhealthy container $name"
  ACTIONS=$((ACTIONS + 1))
done

PRUNED=$(docker container prune -f 2>/dev/null | grep "Total reclaimed" || echo "nothing")
if echo "$PRUNED" | grep -qv "0B"; then
  echo "[CLEAN] $PRUNED" >> "$LOG"
  ACTIONS=$((ACTIONS + 1))
fi

DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
if [ "$DANGLING" -gt 5 ]; then
  docker image prune -f >> "$LOG" 2>&1
  ACTIONS=$((ACTIONS + 1))
fi

USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$USAGE" -gt 85 ]; then
  docker system prune -af --filter "until=48h" >> "$LOG" 2>&1
  send_alert "🔴 Disk at ${USAGE}% — auto-pruned"
  ACTIONS=$((ACTIONS + 1))
fi

MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USED" -gt 90 ]; then
  send_alert "🟡 Memory at ${MEM_USED}%"
fi

[ "$ACTIONS" -eq 0 ] && echo "[OK] All healthy" >> "$LOG"
SCRIPT

chmod +x /root/docker-heal.sh
echo "    Done."

# 2. Set up cron jobs
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
echo "    Done."

echo ""
echo "=== Self-Healing System Active ==="
echo ""
echo "What's running:"
echo "  - Every 5 min: restart unhealthy + prune stale containers"
echo "  - Daily 3 AM:  deep Docker cleanup (images > 72h)"
echo "  - All containers: restart=unless-stopped"
echo ""
echo "Logs:  /var/log/docker-heal.log"
echo ""
echo "Optional: Edit /root/docker-heal.sh to add Telegram alerts:"
echo "  TELEGRAM_BOT_TOKEN=\"your-bot-token\""
echo "  CHAT_ID=\"your-chat-id\""
echo ""
echo "Done!"
