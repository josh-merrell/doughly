#!/bin/bash
set -e

# Ensure the ubuntu user has ownership of the npm cache directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/.npm

# Navigate to the application directory
cd /home/ubuntu/dl
sudo chmod +x /home/ubuntu/dl/scripts/*

# Ensure the ubuntu user has ownership of the .pm2 directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/.pm2
# Ensure the ubuntu user has ownership of the application directory
sudo chown -R ubuntu:ubuntu /home/ubuntu/dl

# Navigate to the application directory
cd /home/ubuntu/dl

# Restart the application using PM2
npx pm2 stop ecosystem.config.js || true
npx pm2 start ecosystem.config.js
