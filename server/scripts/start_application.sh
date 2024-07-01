#!/bin/bash
set -e

# Navigate to the application directory
cd /home/ubuntu/dl

# Restart the application using PM2
npx pm2 stop ecosystem.config.js || true
npx pm2 start ecosystem.config.js
npx pm2 save