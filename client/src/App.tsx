import React from 'react';
import ReactDOM from 'react-dom/client';

export function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-indigo-400 mb-2">
        Project Management App
      </h1>
      <p className="text-slate-400">Frontend mounted successfully!</p>
    </div>
  );
}

// Bootstrap React into the DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}