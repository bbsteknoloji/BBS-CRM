#!/usr/bin/env bash
# BBS CRM — PM2 log görüntüleme
# Kullanım: bash scripts/server/pm2-logs.sh [satır-sayısı]
# Örnek:    bash scripts/server/pm2-logs.sh 100

LINES="${1:-50}"
echo "Son $LINES satır PM2 logu (bbs-crm):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh oracle-app "pm2 logs bbs-crm --lines $LINES --nostream 2>/dev/null"
