#!/bin/bash
set -e

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
