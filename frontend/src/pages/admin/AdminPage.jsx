// frontend/src/pages/admin/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/store';
import { Navigate } from 'react-router-dom';
import { api } from '../../services/api';

const AdminPage = () => {
  const { isAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  //   Состояние для модального окна редактирования 
  const [editModal, setEditModal] = useState({
    isOpen: false,
    game: null,
    formData: {}
  });
  // КОНЕЦ  
  
  // Проверка прав администратора
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  // Загрузка данных при загрузке компонента и смене вкладки
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'games') {
      loadGames();
    } else if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);
  
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(' Загружаем дашборд...');
      
      // Загружаем статистику
      const statsData = await api.admin.getStats();
      console.log(' Получена статистика:', statsData);
      setStats(statsData.stats);
      
      // Загружаем последних пользователей
      const usersData = await api.admin.getUsers();
      console.log('👥 Получены пользователи для дашборда:', usersData);
      
      // Безопасная обработка ответа
      let usersList = [];
      if (usersData && usersData.users && Array.isArray(usersData.users)) {
        usersList = usersData.users;
      } else if (usersData && Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData && usersData.success && Array.isArray(usersData.data)) {
        usersList = usersData.data;
      } else {
        console.log(' Неожиданная структура ответа:', usersData);
      }
      
      setUsers(usersList.slice(0, 5));
      
      // Загружаем игры для вкладки игр
      const gamesData = await api.getGames();
      setGames(gamesData || []);
      
    } catch (err) {
      console.error(' Ошибка загрузки дашборда:', err);
      setError('Ошибка загрузки данных: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.admin.getUsers();
      console.log(' Получены пользователи:', usersData);
      
      // Безопасная обработка ответа
      let usersList = [];
      if (usersData && usersData.users && Array.isArray(usersData.users)) {
        usersList = usersData.users;
      } else if (usersData && Array.isArray(usersData)) {
        usersList = usersData;
      } else if (usersData && usersData.success && Array.isArray(usersData.data)) {
        usersList = usersData.data;
      } else {
        console.log(' Неожиданная структура ответа:', usersData);
      }
      
      setUsers(usersList);
    } catch (err) {
      console.error(' Ошибка загрузки пользователей:', err);
      setError('Ошибка загрузки пользователей: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadGames = async () => {
    try {
      setLoading(true);
      const gamesData = await api.getGames();
      console.log(' Получены игры:', gamesData);
      setGames(gamesData || []);
    } catch (err) {
      console.error(' Ошибка загрузки игр:', err);
      setError('Ошибка загрузки игр: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadOrders = async () => {
    try {
      setLoading(true);
      // Пока используем заглушку, пока нет orders API
      setOrders([
        { id: 1001, email: 'test@mail.com', total_amount: 2999, status: 'completed', created_at: new Date().toISOString() }
      ]);
    } catch (err) {
      console.error(' Ошибка загрузки заказов:', err);
      setError('Ошибка загрузки заказов: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчики для пользователей
  const handleUpdateRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (window.confirm(`Изменить роль на "${newRole}"?`)) {
      try {
        await api.admin.updateUserRole(userId, newRole);
        alert(' Роль обновлена!');
        loadUsers(); // Перезагружаем список
      } catch (err) {
        alert(' Ошибка: ' + err.message);
      }
    }
  };
  
  const handleUpdateBalance = async (userId, currentBalance) => {
    const newBalance = prompt('Введите новый баланс:', currentBalance);
    if (newBalance !== null && !isNaN(newBalance)) {
      try {
        await api.admin.updateUserBalance(userId, parseFloat(newBalance));
        alert(' Баланс обновлен!');
        loadUsers();
      } catch (err) {
        alert(' Ошибка: ' + err.message);
      }
    }
  };
  
  const handleDeleteUser = async (userId, userEmail) => {
    if (window.confirm(`Удалить пользователя ${userEmail}?`)) {
      try {
        await api.admin.deleteUser(userId);
        alert(' Пользователь удален!');
        loadUsers();
      } catch (err) {
        alert(' Ошибка: ' + err.message);
      }
    }
  };
  
  // ▼▼▼  обработчики для игр ▼▼▼
  const handleAddGame = async () => {
    // Открываем модальное окно вместо prompt
    setEditModal({
      isOpen: true,
      game: null,
      formData: {
        title: '',
        description: '',
        price: '',
        discount_price: '',
        platform: 'PC',
        category: 'action',
        image_url: '',
        rating: '4.5',
        is_new: false,
        is_popular: false,
        is_on_sale: false
      }
    });
  };
  
  // Открыть редактирование игры
  const handleEditGame = (game) => {
    setEditModal({
      isOpen: true,
      game: game,
      formData: {
        title: game.title || '',
        description: game.description || '',
        price: game.price || '',
        discount_price: game.discount_price || '',
        platform: game.platform || 'PC',
        category: game.category || 'action',
        image_url: game.image_url || game.image || '',
        rating: game.rating || '4.5',
        is_new: Boolean(game.is_new),
        is_popular: Boolean(game.is_popular),
        is_on_sale: Boolean(game.is_on_sale)
      }
    });
  };
  
  // Сохранить игру
  const handleSaveGame = async () => {
    const { formData, game } = editModal;
    
    if (!formData.title.trim()) {
      alert('Введите название игры');
      return;
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      alert('Введите корректную цену');
      return;
    }
    
    const gameData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      platform: formData.platform,
      category: formData.category,
      image_url: formData.image_url.trim(),
      rating: parseFloat(formData.rating) || 0,
      is_new: formData.is_new ? 1 : 0,
      is_popular: formData.is_popular ? 1 : 0,
      is_on_sale: formData.is_on_sale ? 1 : 0
    };
    
    try {
      if (game) {
        // Обновление существующей игры
        await api.admin.updateGame(game.id, gameData);
        alert(' Игра обновлена!');
      } else {
        // Добавление новой игры
        await api.admin.createGame(gameData);
        alert(' Игра добавлена!');
      }
      
      setEditModal({ isOpen: false, game: null, formData: {} });
      loadGames();
    } catch (err) {
      alert(' Ошибка: ' + (err.message || 'Неизвестная ошибка'));
    }
  };
  
  const handleDeleteGame = async (gameId, gameName) => {
    if (window.confirm(`Удалить игру "${gameName}"?`)) {
      try {
        await api.admin.deleteGame(gameId);
        alert(' Игра удалена!');
        loadGames();
      } catch (err) {
        alert(' Ошибка: ' + err.message);
      }
    }
  };
  
  // Обработчик изменения формы
  const handleFormChange = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  };
  
  // Закрыть модальное окно
  const closeEditModal = () => {
    setEditModal({ isOpen: false, game: null, formData: {} });
  };
  //  КОНЕЦ  обработчиков 
  
  if (loading && activeTab === 'dashboard') {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Загрузка админ-панели...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="page-title">АДМИНИСТРАТИВНАЯ ПАНЕЛЬ</h1>
        <div className="admin-welcome">
          <i className="fas fa-crown"></i>
          <span>Панель управления • Всего прав</span>
        </div>
      </div>
      
      <div className="admin-layout">
        {/* Сайдбар */}
        <div className="admin-sidebar">
          <div className="admin-user">
            <div className="admin-avatar">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="admin-user-info">
              <div className="admin-name">Администратор</div>
              <div className="admin-role">SUPER ADMIN</div>
            </div>
          </div>
          
          <nav className="admin-nav">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <i className="fas fa-chart-line"></i>
              <span>Дашборд</span>
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users"></i>
              <span>Пользователи</span>
              {stats && <span className="nav-badge">{stats.totalUsers}</span>}
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'games' ? 'active' : ''}`}
              onClick={() => setActiveTab('games')}
            >
              <i className="fas fa-gamepad"></i>
              <span>Игры</span>
              {stats && <span className="nav-badge">{stats.totalGames}</span>}
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <i className="fas fa-shopping-cart"></i>
              <span>Заказы</span>
              {stats && <span className="nav-badge">{stats.totalOrders || 0}</span>}
            </button>
          </nav>
        </div>
        
        {/* Контент */}
        <div className="admin-content">
          {error && (
            <div className="admin-error">
              <p>{error}</p>
              <button onClick={loadDashboardData}>Попробовать снова</button>
            </div>
          )}
          
          {/* Статистика */}
          {activeTab === 'dashboard' && stats && (
            <div className="dashboard">
              <div className="stats-grid">
                <div className="stat-card admin">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Пользователей</div>
                  </div>
                  <div className="stat-change positive">
                    +{stats.newUsersToday || 0} сегодня
                  </div>
                </div>
                
                <div className="stat-card admin">
                  <div className="stat-icon">
                    <i className="fas fa-gamepad"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalGames}</div>
                    <div className="stat-label">Игр в каталоге</div>
                  </div>
                  <div className="stat-change positive">
                    {stats.activeUsers || stats.totalUsers} активных
                  </div>
                </div>
                
                <div className="stat-card admin">
                  <div className="stat-icon">
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalOrders || 0}</div>
                    <div className="stat-label">Заказов</div>
                  </div>
                  <div className="stat-change positive">+0 сегодня</div>
                </div>
                
                <div className="stat-card admin">
                  <div className="stat-icon">
                    <i className="fas fa-ruble-sign"></i>
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stats.totalRevenue?.toLocaleString() || '0'} ₽</div>
                    <div className="stat-label">Общая выручка</div>
                  </div>
                  <div className="stat-change positive">+0% за месяц</div>
                </div>
              </div>
              
              {/* Последние пользователи */}
              <div className="recent-activity panel">
                <h3>Последние пользователи</h3>
                <div className="activity-list">
                  {users && users.length > 0 ? (
                    users.map(user => (
                      <div key={user.id} className="activity-item">
                        <div className="activity-icon success">
                          <i className="fas fa-user-plus"></i>
                        </div>
                        <div className="activity-info">
                          <div className="activity-title">{user.username || user.email}</div>
                          <div className="activity-desc">{user.email}</div>
                          <div className="activity-time">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="activity-amount">
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-users">
                      <p>Нет пользователей для отображения</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Пользователи */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="tab-header">
                <h2>Управление пользователями ({users?.length || 0})</h2>
                <button onClick={loadUsers} className="auth-btn">
                  <i className="fas fa-sync-alt"></i> Обновить
                </button>
              </div>
              
              <div className="admin-table panel">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Имя</th>
                      <th>Роль</th>
                      <th>Баланс</th>
                      <th>Дата регистрации</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                          Загрузка пользователей...
                        </td>
                      </tr>
                    ) : users && users.length > 0 ? (
                      users.map(user => (
                        <tr key={user.id}>
                          <td>#{user.id}</td>
                          <td>{user.email}</td>
                          <td>{user.username || 'Не указано'}</td>
                          <td>
                            <select 
                              value={user.role} 
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="role-select"
                            >
                              <option value="user">Пользователь</option>
                              <option value="admin">Администратор</option>
                            </select>
                          </td>
                          <td>
                            {(user.balance || 0).toLocaleString()} ₽
                            <button 
                              onClick={() => handleUpdateBalance(user.id, user.balance || 0)}
                              className="balance-edit-btn"
                              title="Изменить баланс"
                            >
                              ✏️
                            </button>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              {user.id !== 1 && (
                                <button 
                                  onClick={() => handleDeleteUser(user.id, user.email)}
                                  className="action-btn delete"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>
                          Пользователи не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* ▼▼▼  вкладка игр ▼▼▼ */}
          {activeTab === 'games' && (
            <div className="games-tab">
              <div className="tab-header">
                <h2>Управление играми ({games?.length || 0})</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={loadGames} className="auth-btn">
                    <i className="fas fa-sync-alt"></i> Обновить
                  </button>
                  <button onClick={handleAddGame} className="auth-btn register-btn">
                    <i className="fas fa-plus"></i> Добавить игру
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <div className="spinner"></div>
                  <p>Загрузка игр...</p>
                </div>
              ) : games && games.length > 0 ? (
                <div className="games-grid admin">
                  {games.map(game => (
                    <div key={game.id} className="game-card admin">
                      <div className="game-image">
                        {game.image_url || game.image ? (
                          <img src={game.image_url || game.image} alt={game.title} />
                        ) : (
                          <div className="image-placeholder">🎮</div>
                        )}
                        {/* Теги */}
                        <div className="game-tags">
                          {game.is_new && <span className="tag new">НОВИНКА</span>}
                          {game.is_popular && <span className="tag popular">ПОПУЛЯРНО</span>}
                          {game.is_on_sale && <span className="tag sale">РАСПРОДАЖА</span>}
                        </div>
                      </div>
                      <div className="game-info">
                        <h3>{game.title}</h3>
                        <p className="game-category">{game.category}</p>
                        <p className="game-price">
                          {game.is_on_sale && game.discount_price ? (
                            <>
                              <span className="old-price">{game.price} ₽</span>
                              <span className="current-price">{game.discount_price} ₽</span>
                            </>
                          ) : (
                            <span>{game.price} ₽</span>
                          )}
                        </p>
                        <p className="game-rating">
                          Рейтинг: {game.rating || '0.0'} ★
                        </p>
                      </div>
                      <div className="game-actions">
                        <button 
                          onClick={() => handleEditGame(game)}
                          className="edit-game-btn"
                        >
                          <i className="fas fa-edit"></i> Редактировать
                        </button>
                        <button 
                          onClick={() => handleDeleteGame(game.id, game.title)}
                          className="delete-game-btn"
                        >
                          <i className="fas fa-trash"></i> Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '40px'}}>
                  <p>Игры не найдены</p>
                </div>
              )}
            </div>
          )}
          {/* ▲▲▲ КОНЕЦ  вкладки ▲▲▲ */}
          
          {/* Заказы */}
          {activeTab === 'orders' && (
            <div className="orders-tab">
              <h2>Управление заказы</h2>
              <div style={{padding: '20px', textAlign: 'center'}}>
                <p>Раздел заказов в разработке</p>
                <p>Всего заказов: {orders?.length || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  Модальное окно редактирования игры ▼▼▼ */}
      {editModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content admin-modal">
            <div className="modal-header">
              <h3>{editModal.game ? 'Редактирование игры' : 'Добавление новой игры'}</h3>
              <button onClick={closeEditModal} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Название игры *</label>
                <input
                  type="text"
                  value={editModal.formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Название игры"
                  className="form-control"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Категория *</label>
                  <select
                    value={editModal.formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="form-control"
                  >
                    <option value="action">Экшн / Шутер</option>
                    <option value="rpg">RPG</option>
                    <option value="strategy">Стратегия</option>
                    <option value="sports">Спортивные</option>
                    
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Платформа *</label>
                  <select
                    value={editModal.formData.platform}
                    onChange={(e) => handleFormChange('platform', e.target.value)}
                    className="form-control"
                  >
                    <option value="PC">PC</option>
                    <option value="PS5">PlayStation 5</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                    <option value="Switch">Nintendo Switch</option>
                    <option value="PC/PS5/Xbox">Все платформы</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Основная цена (₽) *</label>
                  <input
                    type="number"
                    value={editModal.formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    placeholder="999"
                    min="0"
                    step="1"
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Цена со скидкой (₽)</label>
                  <input
                    type="number"
                    value={editModal.formData.discount_price || ''}
                    onChange={(e) => handleFormChange('discount_price', e.target.value)}
                    placeholder="Оставьте пустым если нет скидки"
                    min="0"
                    step="1"
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={editModal.formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Описание игры..."
                  rows="3"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>URL изображения</label>
                <input
                  type="url"
                  value={editModal.formData.image_url}
                  onChange={(e) => handleFormChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Рейтинг</label>
                <input
                  type="number"
                  value={editModal.formData.rating}
                  onChange={(e) => handleFormChange('rating', e.target.value)}
                  placeholder="4.5"
                  min="0"
                  max="5"
                  step="0.1"
                  className="form-control"
                />
              </div>
              
              {/* Теги/флаги */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editModal.formData.is_new}
                    onChange={(e) => handleFormChange('is_new', e.target.checked)}
                  />
                  <span>Пометить как НОВИНКА</span>
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editModal.formData.is_popular}
                    onChange={(e) => handleFormChange('is_popular', e.target.checked)}
                  />
                  <span>Пометить как ПОПУЛЯРНО</span>
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editModal.formData.is_on_sale}
                    onChange={(e) => handleFormChange('is_on_sale', e.target.checked)}
                  />
                  <span>Пометить как РАСПРОДАЖА</span>
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeEditModal} className="auth-btn secondary">
                Отмена
              </button>
              <button onClick={handleSaveGame} className="auth-btn register-btn">
                {editModal.game ? 'Сохранить изменения' : 'Добавить игру'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AdminPage;