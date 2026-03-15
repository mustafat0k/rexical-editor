/**
 * ESM Entry for Lexical Playground
 * Allows embedding the playground in arbitrary applications.
 */

import './index.css';

import * as React from 'react';
import {createRoot} from 'react-dom/client';

import App from './App';
import setupEnv from './setupEnv';

if (setupEnv.emptyEditor) {
  // Vite is aggressive about tree-shaking
}

// Handle runtime errors as in index.tsx
const showErrorOverlay = (err: Event) => {
  const ErrorOverlay = customElements.get('vite-error-overlay');
  if (!ErrorOverlay) {
    return;
  }
  const overlay = new ErrorOverlay(err);
  const body = document.body;
  if (body !== null) {
    body.appendChild(overlay);
  }
};

window.addEventListener('error', showErrorOverlay);
window.addEventListener('unhandledrejection', ({reason}) =>
  showErrorOverlay(reason),
);

// Main initialization export
export function initLexicalPlayground(elementOrId: HTMLElement | string) {
  const element =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    throw new Error(`Element ${elementOrId} not found.`);
  }

  const root = createRoot(element);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  return {
    unmount: () => root.unmount(),
  };
}

export { React };
