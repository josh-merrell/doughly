#!/bin/bash
set -e

# Navigate to the application directory
cd /home/ubuntu/dl

# Remove old node_modules with sudo and ensure correct permissions
sudo rm -rf node_modules package-lock.json
sudo chown -R ubuntu:ubuntu /home/ubuntu/dl

# Install dependencies
npm install
npx playwright install-deps