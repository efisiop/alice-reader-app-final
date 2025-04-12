#!/bin/bash

# Deploy script for beta environment
# This script deploys the beta build to the beta environment

# Exit on error
set -e

echo "Deploying beta build..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "Error: dist directory not found. Run 'npm run beta:build' first."
  exit 1
fi

# Create a timestamp for the deployment
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
echo "Deployment timestamp: $TIMESTAMP"

# Add timestamp to index.html for cache busting
sed -i.bak "s/<html lang=\"en\">/<html lang=\"en\" data-build=\"$TIMESTAMP\">/" dist/index.html
rm dist/index.html.bak

# Create a version.json file with build information
cat > dist/version.json << EOL
{
  "version": "$(node -p "require('./package.json').version")",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildTimestamp": "$TIMESTAMP",
  "environment": "beta",
  "betaVersion": "$(grep VITE_BETA_VERSION .env.beta | cut -d '=' -f2)"
}
EOL

echo "Created version.json with build information"

# If you have a specific beta deployment target, add commands here
# For example, deploying to a beta subdomain on GitHub Pages:

# Check if gh-pages is installed
if ! command -v gh-pages &> /dev/null; then
  echo "gh-pages not found, installing..."
  npm install -g gh-pages
fi

# Deploy to GitHub Pages beta subdomain
echo "Deploying to GitHub Pages beta subdomain..."
gh-pages -d dist -b beta -m "Beta deployment $TIMESTAMP"

echo "Beta deployment completed successfully!"
echo "The beta version should be available at https://beta.alicereader.app in a few minutes."
echo "If you're using GitHub Pages, it might be at https://efisiop.github.io/alice-reader-app/beta/ instead."

# Optional: Add notification or logging
echo "Deployment completed at $(date)"
