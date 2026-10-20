import React from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsApp } from '../components/OptionsApp';

// Initialize React app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<OptionsApp title="HFX Settings" />);
  } else {
    console.error('Root container not found');
  }
});
