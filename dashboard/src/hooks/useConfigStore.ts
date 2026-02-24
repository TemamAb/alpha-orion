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
            initialUrl = `https://${hostname.replace('.onrender.com', '-api.onrender.com')}`;
        }
    }

    return {
        apiUrl: initialUrl,
        setApiUrl: (url) => set({ apiUrl: url })
    };
});
