import registerPopup from '../popup/background';

class Background {
    /**
     * Registers all the background worker dependencies
     */
    static register() {
        registerPopup();

        console.log('Registering complete!');
    }
}

// Running background entry point
(() => {
    Background.register();
})();
