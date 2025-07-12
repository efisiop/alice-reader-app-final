// src/components/common/SkipToContent.tsx
import React from 'react';

interface SkipToContentProps {
  contentId: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({ contentId }) => {
  return (
    <a href={`#${contentId}`} className="skip-to-content">
      Skip to content
    </a>
  );
};

export default SkipToContent;
