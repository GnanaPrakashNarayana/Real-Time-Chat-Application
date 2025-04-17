#!/bin/bash
# Exit on error
set -e

echo "Starting simplified build process..."
echo "Current location: $(pwd)"

# Install backend dependencies only
echo "Installing backend dependencies..."
npm install

# Create public directory for serving frontend
echo "Setting up directory for frontend files..."
mkdir -p public

# Check if we have pre-built frontend files
if [ -d "../frontend/dist" ]; then
  echo "Found pre-built frontend files, copying them..."
  cp -r ../frontend/dist/* public/
  echo "Frontend files copied successfully!"
else
  echo "WARNING: No pre-built frontend files found!"
  # Create a minimal index.html as fallback
  echo "<html><body><h1>API Server Running</h1><p>Frontend files not found.</p></body></html>" > public/index.html
fi

echo "Build process completed successfully!"