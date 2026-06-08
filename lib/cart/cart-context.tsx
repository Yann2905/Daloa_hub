"use client";

import * as React from "react";
import type { CategorySlug } from "@/lib/constants";

export interface CartLine {
  productId: string;
  vendorId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  categorySlug: CategorySlug;
  isBulky: boolean;
  stock: number;
}

interface CartState {
  lines: CartLine[];
}

type Action =
  | { type: "add"; line: Omit<CartLine, "quantity">; quantity?: number }
  | { type: "remove"; productId: string }
  | { type: "setQty"; productId: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

const STORAGE_KEY = "daloa-hub-cart-v1";

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "add": {
      const existing = state.lines.find((l) => l.productId === action.line.productId);
      const qty = action.quantity ?? 1;
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.productId === action.line.productId
              ? { ...l, quantity: Math.min(l.quantity + qty, l.stock) }
              : l,
          ),
        };
      }
      return { lines: [...state.lines, { ...action.line, quantity: Math.min(qty, action.line.stock) }] };
    }
    case "remove":
      return { lines: state.lines.filter((l) => l.productId !== action.productId) };
    case "setQty":
      return {
        lines: state.lines
          .map((l) =>
            l.productId === action.productId
              ? { ...l, quantity: Math.max(0, Math.min(action.quantity, l.stock)) }
              : l,
          )
          .filter((l) => l.quantity > 0),
      };
    case "clear":
      return { lines: [] };
    case "hydrate":
      return action.state;
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  /** Tous les articles proviennent-ils d'un meme vendeur ? (contrainte V1) */
  vendorId: string | null;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { lines: [] });

  // Hydratation depuis localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value: CartContextValue = {
    ...state,
    add: (line, quantity) => dispatch({ type: "add", line, quantity }),
    remove: (productId) => dispatch({ type: "remove", productId }),
    setQty: (productId, quantity) => dispatch({ type: "setQty", productId, quantity }),
    clear: () => dispatch({ type: "clear" }),
    count: state.lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: state.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    vendorId: state.lines[0]?.vendorId ?? null,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart doit etre utilise dans CartProvider");
  return ctx;
}
