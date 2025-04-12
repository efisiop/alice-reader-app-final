#!/bin/bash
# Deployment script for Alice Reader to GitHub Pages

# Set environment variables
export NODE_ENV=production

# Ensure we're on the right branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "master" ]; then
  echo "Warning: You are not on the master branch. Deployment should typically be done from master."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: You have uncommitted changes."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Build the application
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed. Deployment cancelled."
  exit 1
fi

# Verify the build
echo "Verifying build..."
if [ ! -d "dist" ]; then
  echo "Build directory not found. Deployment cancelled."
  exit 1
fi

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npm run deploy

if [ $? -ne 0 ]; then
  echo "Deployment failed."
  exit 1
fi

echo "Deployment completed successfully!"
echo "Your application should be available at: https://efisiop.github.io/alice-reader-app/"

# Verify deployment
echo "Verifying deployment..."
echo "Please check the following URL in your browser:"
echo "https://efisiop.github.io/alice-reader-app/"

# Reminder about HashRouter
echo ""
echo "IMPORTANT: Remember that this deployment uses HashRouter for routing."
echo "If you encounter any routing issues, ensure that all routes in the application"
echo "are using HashRouter instead of BrowserRouter."
echo ""

# Reminder about environment variables
echo "IMPORTANT: Ensure that your environment variables are correctly set in the deployed version."
echo "Check the application settings in the browser to verify that Supabase connection is working."
echo ""

exit 0
