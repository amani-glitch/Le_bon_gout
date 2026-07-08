import { create } from "zustand";

interface SalesBotState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/** Lets landing CTAs ("Talk to Botler") open the sales widget from anywhere. */
export const useSalesBotStore = create<SalesBotState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
