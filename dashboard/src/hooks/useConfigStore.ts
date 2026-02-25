import { create } from 'zustand';

interface ConfigState {
    apiUrl: string;
    setApiUrl: (url: string) => void;
}

export const useConfigStore = create<ConfigState>((set) => {
    let initialUrl = import.meta.env.VITE_API_URL || '';

    // Auto-discovery for Render
    if (!initialUrl && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('.onrender.com') && !hostname.includes('-api')) {
            // Strip variant suffixes like '-alpha', '-beta' to get base service name
            // e.g. alpha-orion-alpha.onrender.com -> alpha-orion-api.onrender.com
            const baseHostname = hostname.replace('.onrender.com', '');
            const baseName = baseHostname.replace(/-alpha$/, '').replace(/-beta$/, '').replace(/-staging$/, '').replace(/-dev$/, '');
            initialUrl = `https://${baseName}-api.onrender.com`;
            console.log(`[ConfigStore] Resolved API URL: ${initialUrl} (from: ${hostname})`);
        }
    }

    return {
        apiUrl: initialUrl,
        setApiUrl: (url) => set({ apiUrl: url })
    };
});
