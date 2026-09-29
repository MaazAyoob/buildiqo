import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Root error boundary: catches any React render crash that would otherwise
// leave #root empty (blank screen) with no visible error in production
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  componentDidCatch(err, info) {
    console.error('[Buildiqo] Root render error:', err, info);
  }
  render() {
    if (this.state.error) {
      var err = this.state.error;
      return React.createElement('div', {
        style: {
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px', fontFamily: 'monospace',
          zIndex: 99998, boxSizing: 'border-box'
        }
      }, React.createElement('div', { style: { maxWidth: '680px', width: '100%' } },
        React.createElement('h2', { style: { color: '#dc2626', fontSize: '15px', margin: '0 0 10px', fontFamily: 'sans-serif' } }, '\u26a0\ufe0f React Render Error'),
        React.createElement('pre', {
          style: {
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px',
            padding: '14px', fontSize: '11px', whiteSpace: 'pre-wrap',
            wordBreak: 'break-all', color: '#7f1d1d', maxHeight: '60vh', overflow: 'auto'
          }
        }, String(err.stack || err.message || err)),
        React.createElement('p', { style: { color: '#64748b', fontSize: '10px', margin: '8px 0 0', fontFamily: 'sans-serif', wordBreak: 'break-all' } },
          'UA: ' + navigator.userAgent)
      ));
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(RootErrorBoundary, null,
    React.createElement(React.StrictMode, null,
      React.createElement(App)
    )
  )
);