#!/bin/bash
# =============================================================
# Docker Self-Healing Script for Coolify
# Runs via cron every 5 minutes
# - Lock file prevents overlapping runs
# - Skips containers still in startup grace period (<2min)
# - Restarts unhealthy containers (max 3/hr per name)
# - Clears retry counter when container recovers
# - Prunes stale build containers (fixes Coolify name conflicts)
# - Alerts via Telegram (optional)
# - Monitors disk + memory usage
# =============================================================

# --- Prevent overlapping runs ---
LOCK_FILE="/var/run/docker-heal.lock"
if [ -f "$LOCK_FILE" ]; then
  # Check if lock is stale (older than 10 min = stuck previous run)
  if [ "$(find "$LOCK_FILE" -mmin +10 2>/dev/null)" ]; then
    rm -f "$LOCK_FILE"
  else
    exit 0
  fi
fi
trap "rm -f $LOCK_FILE" EXIT
touch "$LOCK_FILE"

LOG="/var/log/docker-heal.log"
MAX_LOG_SIZE=5242880  # 5MB
RESTART_TRACKER="/var/lib/docker-heal"   # persistent across reboots
MAX_RESTARTS=3                            # max restarts per container per hour
STARTUP_GRACE=120                         # skip containers younger than 2 min (seconds)

# --- Optional Telegram alerts (fill in to enable) ---
TELEGRAM_BOT_TOKEN=""
CHAT_ID=""

send_alert() {
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      -d "chat_id=$CHAT_ID" -d "text=$1" > /dev/null 2>&1
  fi
}

# Initialize tracker directory
mkdir -p "$RESTART_TRACKER"

# Clean stale tracker files (older than 1 hour — resets retry window)
find "$RESTART_TRACKER" -type f -mmin +60 -delete 2>/dev/null

# Rotate log if too large
if [ -f "$LOG" ] && [ $(stat -c%s "$LOG" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
  mv "$LOG" "${LOG}.old"
fi

echo "---- $(date '+%Y-%m-%d %H:%M:%S') ----" >> "$LOG"

ACTIONS=0

# 1. Clear retry counters for containers that recovered (healthy now)
for id in $(docker ps --filter "health=healthy" -q 2>/dev/null); do
  name=$(docker inspect --format '{{.Name}}' "$id" 2>/dev/null | sed 's/^\///')
  if [ -n "$name" ] && [ -f "$RESTART_TRACKER/$name" ]; then
    echo "[RECOVERED] Container $name is healthy again — reset retry counter" >> "$LOG"
    rm -f "$RESTART_TRACKER/$name"
  fi
done

# 2. Restart unhealthy containers (with startup grace + retry protection)
for id in $(docker ps --filter "health=unhealthy" -q 2>/dev/null); do
  name=$(docker inspect --format '{{.Name}}' "$id" 2>/dev/null | sed 's/^\///')
  if [ -z "$name" ]; then continue; fi

  # Skip containers still in startup grace period
  started_at=$(docker inspect --format '{{.State.StartedAt}}' "$id" 2>/dev/null)
  if [ -n "$started_at" ]; then
    started_epoch=$(date -d "$started_at" +%s 2>/dev/null || echo 0)
    now_epoch=$(date +%s)
    age=$((now_epoch - started_epoch))
    if [ "$age" -lt "$STARTUP_GRACE" ]; then
      echo "[WAIT] Container $name is ${age}s old (grace period: ${STARTUP_GRACE}s) — skipping" >> "$LOG"
      continue
    fi
  fi

  tracker_file="$RESTART_TRACKER/$name"

  # Count recent restarts (by name, survives redeploys)
  count=0
  if [ -f "$tracker_file" ]; then
    count=$(cat "$tracker_file" 2>/dev/null || echo 0)
  fi

  if [ "$count" -ge "$MAX_RESTARTS" ]; then
    echo "[SKIP] Container $name unhealthy for $MAX_RESTARTS attempts in 1 hour. Auto-healing paused. Manual check required." >> "$LOG"
    send_alert "🚨 Container $name unhealthy for $MAX_RESTARTS attempts in 1 hour. Auto-healing paused. Manual check required."
    continue
  fi

  echo "[HEAL] Restarting unhealthy container: $name (attempt $((count + 1))/$MAX_RESTARTS)" >> "$LOG"
  docker restart "$id" >> "$LOG" 2>&1
  echo $((count + 1)) > "$tracker_file"
  send_alert "⚠️ Restarted unhealthy container $name (attempt $((count + 1))/$MAX_RESTARTS)"
  ACTIONS=$((ACTIONS + 1))
done

# 3. Prune stopped containers older than 5 min (prevents Coolify build conflicts)
#    --filter "until=5m" avoids killing containers from active deployments
PRUNED=$(docker container prune -f --filter "until=5m" 2>/dev/null | grep "Total reclaimed" || echo "nothing pruned")
if echo "$PRUNED" | grep -qv "0B"; then
  echo "[CLEAN] $PRUNED" >> "$LOG"
  ACTIONS=$((ACTIONS + 1))
fi

# 4. Remove dangling images (saves disk)
DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
if [ "$DANGLING" -gt 5 ]; then
  echo "[CLEAN] Removing $DANGLING dangling images" >> "$LOG"
  docker image prune -f >> "$LOG" 2>&1
  ACTIONS=$((ACTIONS + 1))
fi

# 5. Check disk usage
USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$USAGE" -gt 85 ]; then
  echo "[WARN] High disk usage: ${USAGE}%" >> "$LOG"
  docker system prune -af --filter "until=48h" >> "$LOG" 2>&1
  send_alert "🔴 HRMS Server: Disk at ${USAGE}% — auto-pruned Docker resources"
  ACTIONS=$((ACTIONS + 1))
elif [ "$USAGE" -gt 75 ]; then
  echo "[INFO] Disk usage: ${USAGE}% (watching)" >> "$LOG"
fi

# 6. Check memory usage
MEM_USED=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USED" -gt 90 ]; then
  echo "[WARN] High memory: ${MEM_USED}%" >> "$LOG"
  send_alert "🟡 HRMS Server: Memory at ${MEM_USED}%"
fi

if [ "$ACTIONS" -eq 0 ]; then
  echo "[OK] All healthy" >> "$LOG"
fi
