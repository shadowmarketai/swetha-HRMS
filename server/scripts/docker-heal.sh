#!/bin/bash
# =============================================================
# Docker Self-Healing Script for Coolify
# Runs via cron every 5 minutes
# - Restarts unhealthy containers
# - Prunes stale build containers (fixes Coolify name conflicts)
# - Alerts via Telegram (optional)
# - Monitors disk usage
# =============================================================

LOG="/var/log/docker-heal.log"
MAX_LOG_SIZE=5242880  # 5MB

# --- Optional Telegram alerts (fill in to enable) ---
TELEGRAM_BOT_TOKEN=""
CHAT_ID=""

send_alert() {
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      -d "chat_id=$CHAT_ID" -d "text=$1" > /dev/null 2>&1
  fi
}

# Rotate log if too large
if [ -f "$LOG" ] && [ $(stat -c%s "$LOG" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
  mv "$LOG" "${LOG}.old"
fi

echo "---- $(date '+%Y-%m-%d %H:%M:%S') ----" >> "$LOG"

ACTIONS=0

# 1. Restart unhealthy containers
for id in $(docker ps --filter "health=unhealthy" -q 2>/dev/null); do
  name=$(docker inspect --format '{{.Name}}' "$id" 2>/dev/null | sed 's/^\/\///')
  echo "[HEAL] Restarting unhealthy container: $name ($id)" >> "$LOG"
  docker restart "$id" >> "$LOG" 2>&1
  send_alert "⚠️ HRMS: Restarted unhealthy container $name"
  ACTIONS=$((ACTIONS + 1))
done

# 2. Prune stopped containers older than 5 min (prevents Coolify build conflicts)
#    The --filter "until=5m" avoids killing containers from active deployments
PRUNED=$(docker container prune -f --filter "until=5m" 2>/dev/null | grep "Total reclaimed" || echo "nothing pruned")
if echo "$PRUNED" | grep -qv "0B"; then
  echo "[CLEAN] $PRUNED" >> "$LOG"
  ACTIONS=$((ACTIONS + 1))
fi

# 3. Remove dangling images (saves disk)
DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
if [ "$DANGLING" -gt 5 ]; then
  echo "[CLEAN] Removing $DANGLING dangling images" >> "$LOG"
  docker image prune -f >> "$LOG" 2>&1
  ACTIONS=$((ACTIONS + 1))
fi

# 4. Check disk usage
USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$USAGE" -gt 85 ]; then
  echo "[WARN] High disk usage: ${USAGE}%" >> "$LOG"
  docker system prune -af --filter "until=48h" >> "$LOG" 2>&1
  send_alert "🔴 HRMS Server: Disk at ${USAGE}% — auto-pruned Docker resources"
  ACTIONS=$((ACTIONS + 1))
elif [ "$USAGE" -gt 75 ]; then
  echo "[INFO] Disk usage: ${USAGE}% (watching)" >> "$LOG"
fi

# 5. Check memory usage
MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USED" -gt 90 ]; then
  echo "[WARN] High memory: ${MEM_USED}%" >> "$LOG"
  send_alert "🟡 HRMS Server: Memory at ${MEM_USED}%"
fi

if [ "$ACTIONS" -eq 0 ]; then
  echo "[OK] All healthy" >> "$LOG"
fi
