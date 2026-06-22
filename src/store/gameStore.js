import { create } from 'zustand';

// Helper function to get prefix key for local storage (same as in App.jsx)
const getKey = (key) => {
  const email = localStorage.getItem('gacha_auth_email');
  return email ? `gacha_${email}_${key}` : `gacha_${key}`;
};

const useGameStore = create((set, get) => ({
  // Core Economy
  coins: parseInt(localStorage.getItem(getKey('coins')) || '1000'),
  
  // Actions
  addCoins: (amount) => set((state) => {
    const newCoins = state.coins + amount;
    localStorage.setItem(getKey('coins'), newCoins.toString());
    return { coins: newCoins };
  }),
  
  subtractCoins: (amount) => set((state) => {
    const newCoins = Math.max(0, state.coins - amount);
    localStorage.setItem(getKey('coins'), newCoins.toString());
    return { coins: newCoins };
  }),

  // Explicit setter for dev/cheats or specific overrides
  setCoins: (amount) => set(() => {
    localStorage.setItem(getKey('coins'), amount.toString());
    return { coins: amount };
  }),
  
  // Method to re-initialize if the user logs in/out and changes email
  rehydrate: () => set(() => ({
    coins: parseInt(localStorage.getItem(getKey('coins')) || '1000'),
  }))
}));

export default useGameStore;
