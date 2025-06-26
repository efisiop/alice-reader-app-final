#!/bin/bash

# Glossary Consistency Checker Runner
# This script runs the comprehensive glossary consistency check

echo "🔍 Running Glossary Consistency Check..."
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the alice-reader directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please ensure your Supabase credentials are configured."
    exit 1
fi

# Run the consistency checker
echo "🚀 Starting consistency check..."
node scripts/glossary-consistency-checker.js

echo ""
echo "✅ Consistency check completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Review the report above for any issues"
echo "   2. If issues are found, they will be listed in the recommendations"
echo "   3. The highlighting should be consistent across all 3 chapters"
echo "   4. Normal words: blue highlight (rgba(25, 118, 210, 0.1))"
echo "   5. Glossary terms: orange highlight (rgba(255, 152, 0, 0.2))" 