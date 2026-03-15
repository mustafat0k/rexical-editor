/**
 * ESM Entry Point for Lexical Playground v2
 */

import './index.css';
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import AppV2 from './AppV2';

/**
 * Initialize the Lexical Playground v2 on a specific element.
 * @param {string} containerId - The ID of the HTML element to mount the editor in.
 * @param {Object} options - Configuration for the editor.
 * @param {string} options.initialContent - Text to prepopulate the editor with.
 * @param {boolean} options.darkMode - Whether to enable dark mode.
 * @param {Function} options.onChange - Callback triggered on every change.
 */
export function initLexicalPlaygroundV2(containerId: string, options: { 
  initialContent?: string; 
  darkMode?: boolean;
  onChange?: (state: any) => void;
} = {}) {
  const container = document.getElementById(containerId);
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <AppV2 
          initialContent={options.initialContent} 
          darkMode={options.darkMode}
          onChange={options.onChange}
        />
      </React.StrictMode>
    );
  } else {
    console.error(`Container with ID "${containerId}" not found.`);
  }
}

// Also export React so the consumer doesn't have to provide it
export { React };
