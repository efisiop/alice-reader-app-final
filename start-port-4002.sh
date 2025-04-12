#!/bin/bash
echo "Starting development server on port 4002..."
echo "This server will use the special test files for port 4002"

# Copy the special index file to the root directory
cp public/index-4002.html index.html

# Start the development server on port 4002
npm run dev -- --port 4002
