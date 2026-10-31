#!/usr/bin/env bash
set -euo pipefail

cd ~/nodex
git fetch origin main
git reset --hard origin/main

cd backend
npm ci
npx prisma generate
npm run build
npm run db:deploy
sudo systemctl restart nodex-backend
