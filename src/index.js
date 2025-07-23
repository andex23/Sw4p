// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress source map warnings from dependencies
const originalWarn = console.warn;
console.warn = function(message) {
  if (message && typeof message === 'string' && message.includes('Failed to parse source map')) {
    return;
  }
  originalWarn.apply(console, arguments);
};

// Console banner for the retro feel
console.log(`
 ███████╗██╗    ██╗██╗  ██╗██████╗ 
 ██╔════╝██║    ██║██║  ██║██╔══██╗
 ███████╗██║ █╗ ██║███████║██████╔╝
 ╚════██║██║███╗██║╚════██║██╔═══╝ 
 ███████║╚███╔███╔╝     ██║██║     
 ╚══════╝ ╚══╝╚══╝      ╚═╝╚═╝     
                                   
           v0.1 Alpha               
     Copyright © 2025 Sw4p Inc.     
        All Rights Reserved         
`);

console.log("[Sw4p] Initializing...");
console.log("[Sw4p] Loading system resources...");
console.log("[Sw4p] System ready.");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
