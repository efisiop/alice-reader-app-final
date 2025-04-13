#!/bin/bash

# Clean up any previous build artifacts
rm -rf dist

# Run the build with verbose output
echo "Running build with verbose output..."
npm run build -- --debug

# Check if the build succeeded
if [ $? -eq 0 ]; then
  echo "Build succeeded!"
  exit 0
else
  echo "Build failed!"
  exit 1
fi
