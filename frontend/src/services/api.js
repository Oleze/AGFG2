// frontend/src/services/api.js
const API_URL = 'http://localhost:5000/api';

// Преобразование данных с сервера в формат фронтенда
function transformGameData(game) {
  return {
    id: game.id,
    name: game.title,
    title: game.title,
    price: parseFloat(game.price) || 0,
    discountPrice: game.discount_price ? parseFloat(game.discount_price) : null,
    discount: game.discount_price && game.price 
      ? Math.round(((parseFloat(game.price) - parseFloat(game.discount_price)) / parseFloat(game.price)) * 100)
      : 0,
    platform: game.platform,
    category: game.category,
    image: game.image_url || '',
    rating: parseFloat(game.rating) || 0,
    isNew: Boolean(game.is_new),
    isPopular: Boolean(game.is_popular),
    isOnSale: Boolean(game.is_on_sale),
    description: game.description
  };
}

// Получить токен из localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Базовые заголовки для авторизованных запросов
const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Обработка ответов от API
const handleResponse = async (response) => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(' Ошибка обработки ответа:', error);
    throw error;
  }
};

export const api = {
    
  // Получить все игры
  async getGames() {
    try {
      console.log(' Запрашиваем игры...');
      const response = await fetch(`${API_URL}/games`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(` Получено ${data.length} игр`);
      return data.map(transformGameData);
    } catch (error) {
      console.error(' Ошибка получения игр:', error);
      throw error;
    }
  },

  // Получить игру по ID
  async getGame(id) {
    try {
      const response = await fetch(`${API_URL}/games/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return transformGameData(data);
    } catch (error) {
      console.error(` Ошибка получения игры ${id}:`, error);
      throw error;
    }
  },

  // Регистрация
  async register(email, password, username) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error(' Ошибка регистрации:', error);
      throw error;
    }
  },

  // Вход
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error(' Ошибка входа:', error);
      throw error;
    }
  },

  //  ПРОФИЛЬ - Получить профиль пользователя
  async getProfile() {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error(' Ошибка получения профиля:', error);
      throw error;
    }
  },

  //  ПРОФИЛЬ - Обновить профиль
  async updateProfile(profileData) {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error(' Ошибка обновления профиля:', error);
      throw error;
    }
  },

  //  ПРОФИЛЬ - Обновить аватар
  async updateAvatar(avatarUrl) {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/auth/profile/avatar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ avatar_url: avatarUrl })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error(' Ошибка обновления аватара:', error);
      throw error;
    }
  },

  //  ПРОФИЛЬ - Обновить баланс
  async updateBalance(amount) {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_URL}/auth/profile/balance`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error(' Ошибка обновления баланса:', error);
      throw error;
    }
  },

  //  ЗАКАЗЫ - Создать заказ (временная реализация)
  async createOrder(orderData) {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      // Временная реализация - в реальном проекте здесь будет API вызов
      console.log(' Создание заказа:', orderData);
      
      // Имитация успешного создания заказа
      return {
        success: true,
        orderId: Date.now(),
        message: 'Заказ успешно создан',
        total: orderData.total
      };
    } catch (error) {
      console.error(' Ошибка создания заказа:', error);
      throw error;
    }
  },

  //  ЗАКАЗЫ - Получить мои заказы
  async getMyOrders() {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      // Временная реализация
      console.log(' Получение заказов...');
      
      // Имитация получения заказов
      return {
        success: true,
        orders: []
      };
    } catch (error) {
      console.error(' Ошибка получения заказов:', error);
      throw error;
    }
  },

  //  Проверка авторизации
  checkAuth() {
    return !!getToken();
  },

  //  Получить данные пользователя из localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error(' Ошибка парсинга пользователя:', error);
      return null;
    }
  },

  //  Выйти из системы
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
  },

  //  АДМИН МЕТОДЫ
  admin: {
      updateGame: async (gameId, gameData) => {
    try {
      const response = await axios.put(`${API_URL}/api/admin/games/${gameId}`, gameData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(' Ошибка обновления игры:', error);
      throw error;
    }
  },

  
    // Статистика
    async getStats() {
      try {
        const response = await fetch(`${API_URL}/admin/stats`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка получения статистики:', error);
        throw error;
      }
    },
    
    // Пользователи
    async getUsers() {
      try {
        const response = await fetch(`${API_URL}/admin/users`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка получения пользователей:', error);
        throw error;
      }
    },
    
    // Обновить роль пользователя
    async updateUserRole(userId, role) {
      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ role })
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка обновления роли:', error);
        throw error;
      }
    },
    
    // Обновить баланс пользователя
    async updateUserBalance(userId, balance) {
      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/balance`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ balance })
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка обновления баланса:', error);
        throw error;
      }
    },
    
    // Удалить пользователя
    async deleteUser(userId) {
      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка удаления пользователя:', error);
        throw error;
      }
    },
    
    // Создать игру
    async createGame(gameData) {
      try {
        const response = await fetch(`${API_URL}/admin/games`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(gameData)
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка создания игры:', error);
        throw error;
      }
    },
    
    // Удалить игру
    async deleteGame(gameId) {
      try {
        const response = await fetch(`${API_URL}/admin/games/${gameId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка удаления игры:', error);
        throw error;
      }
    },
    
    // Получить заказы (админ)
    async getOrders() {
      try {
        const response = await fetch(`${API_URL}/admin/orders`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка получения заказов:', error);
        throw error;
      }
    },
    
    // Обновить статус заказа
    async updateOrderStatus(orderId, status) {
      try {
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status })
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка обновления статуса заказа:', error);
        throw error;
      }
    },
    
    // Обновить игру
    async updateGame(gameId, gameData) {
      try {
        const response = await fetch(`${API_URL}/admin/games/${gameId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(gameData)
        });
        
        return await handleResponse(response);
      } catch (error) {
        console.error(' Ошибка обновления игры:', error);
        throw error;
      }
    }
  }
};

export default api;