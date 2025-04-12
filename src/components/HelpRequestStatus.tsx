import React from 'react';
import { getStatusColor } from '../utils/statusColors';

interface HelpRequestStatusProps {
  status: string;
}

export const HelpRequestStatus: React.FC<HelpRequestStatusProps> = ({ status }) => {
  return (
    <div
      style={{
        backgroundColor: getStatusColor(status),
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        display: 'inline-block',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {status.replace('_', ' ')}
    </div>
  );
}; 