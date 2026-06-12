#!/usr/bin/env bash
# BBS CRM — Deploy sonrası doğrulama
# Kullanım: bash scripts/server/deploy-verify.sh <beklenen-commit-hash>
# Örnek:    bash scripts/server/deploy-verify.sh 6c4f503

set -euo pipefail

EXPECTED_COMMIT="${1:-$(git rev-parse HEAD 2>/dev/null | cut -c1-7)}"
APP_URL="http://92.5.162.221"
REMOTE="oracle-app"
FAIL=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Deploy Doğrulama — Beklenen commit: $EXPECTED_COMMIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. PM2 çalışıyor mu?
echo ""
echo "[1/5] PM2 durumu kontrol ediliyor..."
PM2_STATUS=$(ssh "$REMOTE" 'pm2 jlist 2>/dev/null | node -e "const l=JSON.parse(require(\"fs\").readFileSync(\"/dev/stdin\",\"utf8\"));const a=l.find(p=>p.name==\"bbs-crm\");console.log(a?a.pm2_env.status:\"not_found\")" 2>/dev/null || echo "unknown"')
if [ "$PM2_STATUS" = "online" ]; then
  echo "  ✅ PM2: online"
else
  echo "  ❌ PM2: $PM2_STATUS"
  FAIL=1
fi

# 2. HTTP yanıt veriyor mu?
echo ""
echo "[2/5] HTTP sağlık kontrolü..."
for i in 1 2 3; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$APP_URL/login" 2>/dev/null || echo "0")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ HTTP $HTTP_CODE — OK"
    break
  fi
  if [ $i -lt 3 ]; then
    echo "  ⏳ Deneme $i/3 başarısız ($HTTP_CODE), 5s bekleniyor..."
    sleep 5
  else
    echo "  ❌ HTTP $HTTP_CODE — Uygulama yanıt vermiyor"
    FAIL=1
  fi
done

# 3. Deploy commit eşleşiyor mu?
echo ""
echo "[3/5] Deploy commit kontrolü..."
DEPLOYED_COMMIT=$(ssh "$REMOTE" 'cat /opt/bbs/crm/.deploy-commit 2>/dev/null || echo ""')
if [ -z "$DEPLOYED_COMMIT" ]; then
  echo "  ⚠️  .deploy-commit dosyası bulunamadı (eski deploy yöntemi)"
else
  SHORT_DEPLOYED=$(echo "$DEPLOYED_COMMIT" | cut -c1-7)
  SHORT_EXPECTED=$(echo "$EXPECTED_COMMIT" | cut -c1-7)
  if [[ "$DEPLOYED_COMMIT" == "$EXPECTED_COMMIT"* ]] || [[ "$SHORT_DEPLOYED" == "$SHORT_EXPECTED" ]]; then
    echo "  ✅ Commit: $SHORT_DEPLOYED — eşleşiyor"
  else
    echo "  ❌ Commit farkı: sunucu=$SHORT_DEPLOYED, beklenen=$SHORT_EXPECTED"
    FAIL=1
  fi
fi

# 4. Disk doluluk kontrolü
echo ""
echo "[4/5] Disk kullanımı..."
DISK_PCT=$(ssh "$REMOTE" "df / | tail -1 | awk '{print \$5}' | tr -d '%'")
if [ "$DISK_PCT" -lt 85 ]; then
  echo "  ✅ Disk: %$DISK_PCT doluluk"
else
  echo "  ⚠️  Disk: %$DISK_PCT doluluk — kritik seviye!"
  FAIL=1
fi

# 5. Son restart zamanı kontrolü (son 5 dakikada restart varsa beklenebilir)
echo ""
echo "[5/5] Restart sayısı..."
RESTARTS=$(ssh "$REMOTE" 'pm2 show bbs-crm 2>/dev/null | grep "restart time" | awk -F"│" "{print \$3}" | tr -d " " || echo "?"')
echo "  ℹ️  Toplam restart: $RESTARTS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -eq 0 ]; then
  echo " ✅ DEPLOY BAŞARILI — Tüm kontroller geçti"
else
  echo " ❌ DEPLOY SORUNU — Yukarıdaki hataları kontrol et"
  exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
