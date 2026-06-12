#!/usr/bin/env bash
# BBS CRM — Canlı sunucu sağlık kontrolü
# Kullanım: bash scripts/server/health-check.sh

set -euo pipefail

REMOTE="oracle-app"
APP_URL="http://92.5.162.221"
STANDALONE_DIR="/opt/bbs/crm/.next/standalone"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " BBS CRM — Sunucu Sağlık Kontrolü"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh "$REMOTE" bash <<'REMOTE_SCRIPT'
echo ""
echo "▶ PM2 Durumu"
pm2 status

echo ""
echo "▶ Bellek & CPU"
pm2 show bbs-crm 2>/dev/null | grep -E 'memory usage|cpu usage|uptime'

echo ""
echo "▶ Yeniden Başlatma Sayısı"
pm2 show bbs-crm 2>/dev/null | grep -E 'restarts'

echo ""
echo "▶ Disk Kullanımı"
df -h / /opt 2>/dev/null | column -t

echo ""
echo "▶ RAM Kullanımı"
free -h

echo ""
echo "▶ Çalışan Build"
cat /opt/bbs/crm/.next/standalone/.next/BUILD_ID 2>/dev/null && echo " (BUILD_ID)" || echo "BUILD_ID okunamadı"
cat /opt/bbs/crm/.deploy-commit 2>/dev/null && echo " (deploy commit)" || true

echo ""
echo "▶ Son Deploy Tarihi"
stat -c '%y' /opt/bbs/crm/.next/standalone/.next/BUILD_ID 2>/dev/null | cut -d. -f1

echo ""
echo "▶ Storage Disk Kullanımı"
du -sh /opt/bbs/storage/ 2>/dev/null || echo "(storage dizini bulunamadı)"
REMOTE_SCRIPT

echo ""
echo "▶ HTTP Sağlık Kontrolü (login sayfası)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL/login" 2>/dev/null || echo "TIMEOUT")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ HTTP $HTTP_CODE — Uygulama yanıt veriyor"
elif [ "$HTTP_CODE" = "TIMEOUT" ]; then
  echo "  ❌ TIMEOUT — Sunucu yanıt vermiyor!"
else
  echo "  ⚠️  HTTP $HTTP_CODE — Beklenmedik yanıt"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Kontrol tamamlandı"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
