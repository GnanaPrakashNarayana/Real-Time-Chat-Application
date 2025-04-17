#!/bin/bash
# Display current directory
echo "Current directory: $(pwd)"

# Install dependencies for backend
echo "Installing backend dependencies..."
npm install

# Navigate to frontend directory and build
echo "Building frontend..."
cd frontend
npm install
npm run build

# Check if build was successful
if [ -d "dist" ]; then
  echo "Frontend build successful! Files in dist directory:"
  ls -la dist
  echo "Content of dist directory:"
  find dist -type f | head -n 20
else
  echo "Frontend build failed! dist directory not found"
  exit 1
fi

# Move back to root
cd ..

# Run verification script
echo "Running verification script..."
node verify-build.js