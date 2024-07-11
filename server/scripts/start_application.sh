#!/bin/bash
set -e

# Ensure the ubuntu user has ownership of the npm cache directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/.npm

# Navigate to the application directory
cd /home/ubuntu/dl

# Remove old node_modules with sudo and ensure correct permissions
sudo rm -rf node_modules package-lock.json
sudo chown -R ubuntu:ubuntu /home/ubuntu/dl

# Install dependencies
npm install
npx playwright install-deps
npx playwright install

# Ensure the ubuntu user has ownership of the .pm2 directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/.pm2

# Navigate to the application directory
cd /home/ubuntu/dl

# Ensure the ubuntu user has ownership of the application directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/dl

# Restart the application using PM2
npx pm2 stop ecosystem.config.js || true
npx pm2 start ecosystem.config.js
npx pm2 save
