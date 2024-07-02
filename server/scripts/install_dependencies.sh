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
