#!/bin/bash

echo "Running TypeScript type check..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "TypeScript check passed!"
else
  echo "TypeScript check failed!"
  exit 1
fi
