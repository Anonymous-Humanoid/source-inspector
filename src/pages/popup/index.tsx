import { E_TIMEOUT } from 'async-mutex';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PopupManager } from './stateManager';

// CSS
import './index.css';

const container = document.getElementById('app-container');

if (container != null) {
    // Connecting to tab
    const root = createRoot(container);
    const popupManager = new PopupManager();

    popupManager.connect().then(() => {
        // Creating asynchronous rendering loop
        const Popup = PopupManager.Popup;
        const RENDER_INTERVAL_MS = 250;
        const render = async () => {
            try {
                const states = await popupManager.getNodeTreeStates(
                    RENDER_INTERVAL_MS
                );

                root.render(
                    <Popup rootId={states.rootId} nodes={states.nodes} />
                );
            } catch (err) {
                if (err === E_TIMEOUT) {
                    console.warn('Render skipped on account of lock timeout');
                } else {
                    throw err;
                }
            }
        };
        render();
        const renderIntervalId = setInterval(render, RENDER_INTERVAL_MS);

        // Defining destructor
        const UNMOUNT = root.unmount.bind(root);

        root.unmount = () => {
            clearInterval(renderIntervalId);
            UNMOUNT();
        };
    });
}
