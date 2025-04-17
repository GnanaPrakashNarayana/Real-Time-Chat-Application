#!/bin/bash
# Exit on first error
set -e

echo "Starting build process..."

# Navigate to project root
cd /opt/render/project/src

# Skip root-level npm install since it has link: dependencies
echo "Skipping root dependencies due to link: protocol issues"

# Backend setup
echo "Setting up backend..."
cd backend
npm install

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

# Clean existing dependencies to avoid issues
echo "Cleaning frontend dependencies..."
rm -rf node_modules package-lock.json

# Install dependencies with flags to avoid optional dependencies issues
echo "Installing frontend dependencies..."
npm install --no-optional

# Build the frontend
echo "Building frontend..."
npm run build

# Verify the build succeeded
if [ -d "dist" ]; then
  echo "Frontend build successful!"
  
  # Copy dist to a location where backend can serve it
  echo "Copying frontend build to public directory..."
  mkdir -p ../backend/public
  cp -r dist/* ../backend/public/
else
  echo "Frontend build failed! dist directory not found"
  exit 1
fi

# Return to backend directory for starting the server
cd ../backend
echo "Setup complete. Ready to start the server."