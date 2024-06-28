#!/bin/bash
set -e

# Install git
sudo apt-get update
sudo apt-get install -y git

# Install Node.js v20
if ! node -v | grep "v20"; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Create directories and clone the server directory
sudo mkdir -p /home/ubuntu/dl
sudo chown ubuntu:ubuntu /home/ubuntu/dl
cd /home/ubuntu/dl
git init
git remote add origin https://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@github.com/josh-merrell/doughly.git
git config core.sparseCheckout true
echo "server/*" >> .git/info/sparse-checkout
git pull origin main

# Move contents from server directory to the current directory and remove the server directory
mv server/* .
rm -rf server

# install dependencies
rm -rf node_modules package-lock.json
npm install
sudo npx playwright install-deps
export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/dl/services/google/doughly-ee4c38c0be84.json"

# Start the application using pm2
npx pm2 start ecosystem.config.js
npx pm2 save

# Install and configure Alloy logging agent
sudo apt install -y gpg
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt-get update
sudo apt-get install -y alloy
sudo systemctl start alloy
sudo systemctl enable alloy.service
sudo cp /home/ubuntu/dl/config.alloy /etc/alloy/config.alloy
sudo systemctl restart alloy
