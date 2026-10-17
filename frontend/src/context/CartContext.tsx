import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: number;
  product_code?: string;
  name: string;
  description: string;
  price: number;
  sw: number;
  image_url: string;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  options?: Record<string, any>;
  category: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: number, selectedColor?: string, selectedSize?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalSw: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('mlm_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('mlm_cart', JSON.stringify(items));
  }, [items]);

  const matchesItem = (
    item: CartItem,
    productId: number,
    color?: string,
    size?: string
  ) => {
    if (item.product.id !== productId) return false;
    if (color !== undefined && (item.selectedColor || '') !== (color || '')) return false;
    if (size !== undefined && (item.selectedSize || '') !== (size || '')) return false;
    return true;
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setItems((prevItems) => {
      const existing = prevItems.find((item) =>
        matchesItem(item, product.id, selectedColor, selectedSize)
      );
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prevItems.map((item) =>
          matchesItem(item, product.id, selectedColor, selectedSize)
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [
        ...prevItems,
        {
          product,
          quantity: Math.min(quantity, product.stock),
          selectedColor,
          selectedSize,
        },
      ];
    });
  };

  const removeFromCart = (
    productId: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !matchesItem(item, productId, selectedColor, selectedSize)
      )
    );
  };

  const updateQuantity = (
    productId: number,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedSize);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        matchesItem(item, productId, selectedColor, selectedSize)
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalSw = items.reduce((sum, item) => sum + item.product.sw * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalSw,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
