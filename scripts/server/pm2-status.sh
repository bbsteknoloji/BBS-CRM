#!/usr/bin/env bash
# BBS CRM — Hızlı PM2 durum kontrolü
# Kullanım: bash scripts/server/pm2-status.sh

ssh oracle-app 'pm2 status && echo "" && pm2 show bbs-crm 2>/dev/null | grep -E "status|uptime|restarts|memory|cpu|created"'
