#!/bin/bash
# Exit on error
set -e

echo "Starting build process from backend directory..."
echo "Current location: $(pwd)"

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Navigate to frontend
echo "Moving to frontend directory..."
cd ../frontend

# Clean existing dependencies
echo "Cleaning frontend dependencies..."
rm -rf node_modules package-lock.json

# Install frontend dependencies with special flags to avoid native modules
echo "Installing frontend dependencies with specific configuration..."
npm install --no-optional

# Create .npmrc file to force skipping optional dependencies
echo "Creating .npmrc to avoid native module issues..."
echo "optional=false" > .npmrc
echo "legacy-peer-deps=true" >> .npmrc

# Try a different build approach using plain esbuild
echo "Setting up alternative build approach..."
npm install --save-dev esbuild

# Create a simple build script if vite build fails
echo "Building frontend..."
npx vite build || {
  echo "Vite build failed, trying alternative build method..."
  
  # Create simple build script to bypass rollup
  cat > simple-build.js << 'EOF'
  const esbuild = require('esbuild');
  const { readdirSync, copyFileSync, mkdirSync, existsSync } = require('fs');
  const { join } = require('path');
  
  // Create dist directory
  if (!existsSync('./dist')) {
    mkdirSync('./dist', { recursive: true });
  }
  
  // Copy index.html
  copyFileSync('./index.html', './dist/index.html');
  
  // Simple build
  esbuild.buildSync({
    entryPoints: ['./src/main.jsx'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: './dist/assets/index.js',
    loader: { 
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.css': 'css',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.svg': 'dataurl',
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
  });
  
  console.log('Build completed successfully!');
  EOF
  
  # Run the simple build script
  node simple-build.js
}

# Verify build artifacts
if [ -d "dist" ]; then
  echo "Frontend built successfully!"
  
  # Make backend directory to serve static files if it doesn't exist
  if [ ! -d "../backend/public" ]; then
    mkdir -p "../backend/public"
  fi
  
  # Copy frontend build to backend public directory
  echo "Copying frontend build to backend/public directory..."
  cp -r dist/* ../backend/public/
else
  echo "Frontend build failed! dist directory not found"
  exit 1
fi

# Return to backend directory
cd ../backend
echo "Build process complete!"