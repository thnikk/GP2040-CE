import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './i18n';
import './styles/tokens.css';
import './styles/base.css';
import './styles/utilities.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/overrides.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
