import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './popup';

// CSS
import './index.css';

const container = document.getElementById('app-container');

if (container != null) {
    const root = createRoot(container);

    root.render(<Popup />);
}
