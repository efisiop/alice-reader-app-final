#!/bin/bash
# Setup script for Alice Reader test environment

# Create test branch if it doesn't exist
git checkout -b beta-testing 2>/dev/null || git checkout beta-testing

# Ensure test environment file exists
if [ ! -f .env.test ]; then
  cp .env.example .env.test 2>/dev/null || cp .env .env.test
  echo "Created .env.test file"
fi

# Install dependencies
npm install

# Run test database setup
npm run test:setup

echo "Test environment setup complete!"
echo "You are now on the 'beta-testing' branch with test environment configured."
