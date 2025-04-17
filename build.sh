
#!/bin/bash
# Add this to the beginning of your build.sh
echo "==== STARTING BUILD PROCESS ===="
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Add more logging throughout the script
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
else
  echo "Frontend build failed! dist directory not found"
  exit 1
fi

# Move back to root
cd ..