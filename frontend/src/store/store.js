import { create } from 'zustand';

// Хранилище корзины
export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart')) || [],
  
  addToCart: (game) => 
    set((state) => {
      const existingItem = state.items.find(item => item.id === game.id);
      let newItems;
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === game.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...game, quantity: 1 }];
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('cart', JSON.stringify(newItems));
      
      // Обновляем счетчик в header
      updateCartCount(newItems);
      
      return { items: newItems };
    }),
    
  removeFromCart: (id) =>
    set((state) => {
      const newItems = state.items.filter(item => item.id !== id);
      localStorage.setItem('cart', JSON.stringify(newItems));
      updateCartCount(newItems);
      return { items: newItems };
    }),
    
  updateQuantity: (id, quantity) =>
    set((state) => {
      if (quantity < 1) {
        const newItems = state.items.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(newItems));
        updateCartCount(newItems);
        return { items: newItems };
      }
      
      const newItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      localStorage.setItem('cart', JSON.stringify(newItems));
      updateCartCount(newItems);
      return { items: newItems };
    }),
    
  clearCart: () => {
    localStorage.removeItem('cart');
    updateCartCount([]);
    set({ items: [] });
  },
  
  getTotalPrice: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      const price = item.discountPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  }
}));

// Функция обновления счетчика в header
const updateCartCount = (items) => {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.querySelector('.cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = count;
  }
  
  // Также обновляем все элементы с классом cart-count
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
  });
};

// Инициализация счетчика при загрузке
if (typeof window !== 'undefined') {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    const items = JSON.parse(savedCart);
    updateCartCount(items);
  }
}

// Хранилище пользователя
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAdmin: (JSON.parse(localStorage.getItem('user')) || {}).role === 'admin',
  
  login: (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ 
      user: userData,
      token,
      isAdmin: userData.role === 'admin' 
    });
    
    // Триггерим событие для обновления header
    window.dispatchEvent(new Event('userChanged'));
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAdmin: false });
    window.dispatchEvent(new Event('userChanged'));
  },
  
  updateProfile: (userData) => {
    const updatedUser = { ...useAuthStore.getState().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
    window.dispatchEvent(new Event('userChanged'));
  },
  
  updateBalance: (newBalance) => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, balance: newBalance };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
      window.dispatchEvent(new Event('userChanged'));
    }
  }
}));