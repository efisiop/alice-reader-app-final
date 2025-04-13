// src/components/Beta/BetaTestHarness.tsx
// This is a simplified placeholder component for production builds
import React from 'react';

interface BetaTestHarnessProps {
  children: React.ReactNode;
}

// This is a simplified placeholder component for production builds
// The actual implementation is only used in beta environment
export const BetaTestHarness: React.FC<BetaTestHarnessProps> = ({ children }) => {
  // In production builds, just render the children without any beta test harness
  return <>{children}</>;
};

export default BetaTestHarness;
