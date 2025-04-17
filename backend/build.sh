#!/bin/bash
echo "Starting build process from backend directory..."
echo "Current location: $(pwd)"

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Navigate up to root directory, then to frontend
echo "Moving to frontend directory..."
cd ../frontend

# Install frontend dependencies and build
echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
  echo "Frontend build successful! Files in dist directory:"
  ls -la dist
else
  echo "Frontend build failed! dist directory not found"
  exit 1
fi

# Create required directory structure in Render's persistent storage
echo "Creating directory structure for frontend files..."
mkdir -p /opt/render/project/src/frontend/dist

# Copy built files to the expected location
echo "Copying frontend build files to expected location..."
cp -r dist/* /opt/render/project/src/frontend/dist/

echo "Build process complete!"