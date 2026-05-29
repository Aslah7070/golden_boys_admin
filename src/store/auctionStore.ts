import { create } from 'zustand';
import { Player, AuctionFilters } from '@/types';

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

interface AuctionState {
  // Auction Modal & Player Selection
  selectedPlayer: Player | null;
  isBuyModalOpen: boolean;
  
  // Search & Filters
  filters: AuctionFilters;
  
  // Toast Notifications
  toasts: ToastState[];
  
  // Actions
  setSelectedPlayer: (player: Player | null) => void;
  setBuyModalOpen: (isOpen: boolean) => void;
  updateFilters: (filters: Partial<AuctionFilters>) => void;
  resetFilters: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;
}

const initialFilters: AuctionFilters = {
  search: '',
  position: '',
  category: '',
  status: 'all',
};

export const useAuctionStore = create<AuctionState>((set) => ({
  selectedPlayer: null,
  isBuyModalOpen: false,
  filters: initialFilters,
  toasts: [],

  setSelectedPlayer: (player) => set({ selectedPlayer: player }),
  
  setBuyModalOpen: (isOpen) => set({ isBuyModalOpen: isOpen }),
  
  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
    
  resetFilters: () => set({ filters: initialFilters }),

  showToast: (message, type = 'success') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { message, type, id }],
    }));

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
