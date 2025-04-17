#!/bin/bash
# Make script exit on first error
set -e

echo "Starting build process..."

# Navigate to project root
cd /opt/render/project/src

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Backend setup
echo "Setting up backend..."
cd backend
npm install

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

# Clear node_modules and package-lock.json to avoid the rollup issue
echo "Cleaning frontend dependencies..."
rm -rf node_modules package-lock.json

# Install dependencies with specific flags to address the rollup issue
echo "Installing frontend dependencies..."
npm install --no-optional

# Explicitly install the problematic package
echo "Installing rollup dependencies..."
npm install @rollup/rollup-linux-x64-gnu || echo "Optional dependency not available, continuing anyway..."

# Build the frontend
echo "Building frontend..."
npm run build

# Verify dist directory exists
if [ -d "dist" ]; then
  echo "Frontend build successful"
else
  echo "Frontend build failed! dist directory not found"
  exit 1
fi

# Return to project root
cd ..

echo "Build process completed successfully"