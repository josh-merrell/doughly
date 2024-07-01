#!/bin/bash
set -e

# Navigate to the application directory
cd /home/ubuntu/dl

# Remove old node_modules and install dependencies
rm -rf node_modules package-lock.json
npm install
npx playwright install-deps