#!/bin/bash
# Reset test data for Alice Reader beta testing

echo "Resetting test data for Alice Reader beta testing..."

# Ensure we're in the beta-testing branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "beta-testing" ]; then
  echo "Warning: You are not on the beta-testing branch."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Reset cancelled."
    exit 1
  fi
fi

# Run the reset test data script
echo "Running test data reset..."
npm run test:reset

if [ $? -ne 0 ]; then
  echo "Error: Failed to reset test data."
  exit 1
fi

# Regenerate test data
echo "Regenerating test data..."
npm run test:generate-data

if [ $? -ne 0 ]; then
  echo "Error: Failed to regenerate test data."
  exit 1
fi

echo "Test data reset complete!"
echo "You can now start testing with fresh data."
exit 0
