import React from 'react';
import { BetaTestHarness as OriginalBetaTestHarness } from '@components/Beta/BetaTestHarness';

type BetaWrapperProps = React.PropsWithChildren<{}>;

export function BetaWrapper({ children }: BetaWrapperProps) {
  // We just re-export the original component to avoid case-sensitivity issues
  return <OriginalBetaTestHarness>{children}</OriginalBetaTestHarness>;
}