# Run this script as the user-data script for the API server instance upon initial launch. This script will install the necessary tools, clone the application repository, install dependencies, and start the application using PM2. When code changes are merged, a separate deployment script will be run to update the application on all current EC2 instances in the deployment group. This is managed with AWS CodeDeploy via the 'appspec.yml' file.

#!/bin/bash
set -e

# Install necessary tools!
sudo apt-get update
sudo apt-get install -y git net-tools

# Install Node.js v20 if not already installed
if ! node -v | grep "v20"; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Prepare the application directory
sudo mkdir -p /home/ubuntu/dl
sudo chown ubuntu:ubuntu /home/ubuntu/dl
cd /home/ubuntu/dl

# Explicitly set HOME variable for the ubuntu user
export HOME="/home/ubuntu"

# Initialize and configure Git
git init
git config --global --add safe.directory /home/ubuntu/dl
git remote add origin https://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@github.com/josh-merrell/doughly.git
git config core.sparseCheckout true
echo "server/*" >> .git/info/sparse-checkout
git pull origin main

# Relocate the server files and clean up
mv server/* .
rm -rf server
sudo chmod +x /home/ubuntu/dl/scripts/*

# Install application dependencies
rm -rf node_modules package-lock.json
npm install
npx playwright install-deps
npx playwright install

# Configure environment variable for the session
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/home/ubuntu/dl/services/google/doughly-ee4c38c0be84.json"' >> ~/.bashrc

# Start the application using PM2
npx pm2 start ecosystem.config.js
npx pm2 save
sudo chown ubuntu:ubuntu /home/ubuntu/.pm2/rpc.sock /home/ubuntu/.pm2/pub.sock

# Install and configure Alloy logging agent
sudo apt-get install -y gpg
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | sudo gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt-get update
sudo apt-get install -y alloy
sudo systemctl start alloy
sudo systemctl enable alloy.service
sudo cp /home/ubuntu/dl/config.alloy /etc/alloy/config.alloy
sudo systemctl restart alloy

# Install CodeDeploy Agent
sudo apt update
sudo apt install -y ruby-full
sudo apt install wget
cd /home/ubuntu/dl
wget https://aws-codedeploy-us-west-2.s3.us-west-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto > /tmp/logfile
