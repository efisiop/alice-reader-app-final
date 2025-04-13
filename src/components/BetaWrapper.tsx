import React from 'react';

type BetaWrapperProps = React.PropsWithChildren<{}>;

// This is a simplified placeholder component for production builds
// The actual implementation is only used in beta environment
export function BetaWrapper({ children }: BetaWrapperProps) {
  // In production builds, just render the children without any beta test harness
  return <>{children}</>;
}