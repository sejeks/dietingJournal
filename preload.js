const { contextBridge, ipcRenderer } = require('electron');

// Log that preload script is running
console.log('Preload - Script running');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
        invoke: async (channel, data) => {
            // Whitelist channels
            const validChannels = ['load-data', 'save-data'];
            if (!validChannels.includes(channel)) {
                throw new Error(`Invalid channel: ${channel}`);
            }

            console.log('Preload - Invoking channel:', channel, 'with data:', data);
            try {
                const result = await ipcRenderer.invoke(channel, data);
                console.log('Preload - Received result from channel:', channel, ':', result);
                return result;
            } catch (error) {
                console.error('Preload - Error in channel:', channel, ':', error);
                throw error;
            }
        }
    }
);

// Log that preload script has completed
console.log('Preload - Script completed'); 