#!/bin/bash
# Install dependencies for backend
npm install

# Navigate to frontend directory and build
cd frontend
npm install
npm run build

# Move back to root
cd ..