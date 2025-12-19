import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Загружаем корзину из localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Сохраняем корзину при изменении
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Считаем итог
    const newTotal = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
    
    // Обновляем счетчик в заголовке
    updateCartCount();
  }, [cartItems]);

  const updateCartCount = () => {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = count;
    }
  };

  const addToCart = (game) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === game.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === game.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...game, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (gameId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.id !== gameId)
    );
  };

  const updateQuantity = (gameId, quantity) => {
    if (quantity < 1) {
      removeFromCart(gameId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === gameId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      total,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};