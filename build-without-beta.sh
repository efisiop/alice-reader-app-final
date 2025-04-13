#!/bin/bash

# Create a temporary directory for Beta components
mkdir -p temp-beta-components

# Move Beta components to temporary directory
echo "Moving Beta components to temporary directory..."
rm -rf temp-beta-components/Beta-components
rm -rf temp-beta-components/Beta-pages
mkdir -p temp-beta-components/Beta-components
mkdir -p temp-beta-components/Beta-pages
cp -r src/components/Beta/* temp-beta-components/Beta-components/
cp -r src/pages/Beta/* temp-beta-components/Beta-pages/

# Create empty placeholder directories
mkdir -p src/components/Beta
mkdir -p src/pages/Beta

# Create placeholder files
echo "Creating placeholder files..."
cat > src/components/Beta/BetaTestHarness.tsx << 'EOF'
import React from 'react';

interface BetaTestHarnessProps {
  children: React.ReactNode;
}

export const BetaTestHarness: React.FC<BetaTestHarnessProps> = ({ children }) => {
  return <>{children}</>;
};

export default BetaTestHarness;
EOF

cat > src/pages/Beta/BetaTestDashboard.tsx << 'EOF'
import React from 'react';

export const BetaTestDashboard: React.FC = () => {
  return <div>Beta Test Dashboard (Placeholder)</div>;
};

export default BetaTestDashboard;
EOF

cat > src/components/Beta/TestScenarios.tsx << 'EOF'
import React from 'react';

export const TestScenarios: React.FC = () => {
  return <div>Test Scenarios (Placeholder)</div>;
};

export default TestScenarios;
EOF

# Run the build
echo "Running build..."
npm run build

# Restore the original files
echo "Restoring original files..."
rm -rf src/components/Beta
rm -rf src/pages/Beta
mkdir -p src/components/Beta
mkdir -p src/pages/Beta
cp -r temp-beta-components/Beta-components/* src/components/Beta/
cp -r temp-beta-components/Beta-pages/* src/pages/Beta/
rm -rf temp-beta-components

echo "Done!"
