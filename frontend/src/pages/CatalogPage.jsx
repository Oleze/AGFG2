import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { getGames } from '../data/gamesData';

const CatalogPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  useEffect(() => {
    async function loadGames() {
      try {
        console.log(' Начинаем загрузку игр...');
        const gamesData = await getGames();
        console.log(' Игры загружены:', gamesData.length, 'шт.');
        
        // Отладочная информация
        if (gamesData.length > 0) {
          console.log('🔍 ПРОВЕРКА ДАННЫХ:');
          gamesData.slice(0, 3).forEach((game, i) => {
            console.log(`${i+1}. ${game.title}`);
            console.log('   is_new:', game.is_new, typeof game.is_new);
            console.log('   is_popular:', game.is_popular, typeof game.is_popular);
            console.log('   is_on_sale:', game.is_on_sale, typeof game.is_on_sale);
            console.log('   category:', game.category);
          });
        }
        
        setGames(gamesData);
      } catch (err) {
        console.error(' Критическая ошибка:', err);
        setError('Не удалось загрузить игры. Проверьте подключение к серверу.');
        setGames([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadGames();
  }, []);

  // ПРАВИЛЬНАЯ фильтрация с преобразованием типов
  const filteredGames = games.filter(game => {
    // Преобразуем значения в булевы для надежности
    const isNew = Boolean(game.is_new);
    const isPopular = Boolean(game.is_popular);
    const isOnSale = Boolean(game.is_on_sale);
    
    if (filter === 'all') return true;
    
    if (filter === 'новинки') return isNew;
    if (filter === 'распродажа') return isOnSale;
    if (filter === 'популярные') return isPopular;
    
    // Категории
    if (filter === 'rpg') {
      if (!game.category) return false;
      const cat = game.category.toLowerCase();
      return cat.includes('rpg') || cat === 'action rpg';
    }
    
    if (filter === 'шутеры') {
      if (!game.category) return false;
      const cat = game.category.toLowerCase();
      // Все что не RPG и не пустое - считаем шутерами
      return !cat.includes('rpg') && cat !== 'action rpg' && cat.trim() !== '';
    }
    
    if (filter === 'стратегии') {
      if (!game.category) return false;
      const cat = game.category.toLowerCase();
      return cat.includes('страте') || cat.includes('strategy');
    }
    
    return false;
  });

  // Сортировка с учетом всех полей
  const sortedGames = [...filteredGames].sort((a, b) => {
    // Преобразуем для сортировки
    const aIsNew = Boolean(a.is_new);
    const bIsNew = Boolean(b.is_new);
    const aIsPopular = Boolean(a.is_popular);
    const bIsPopular = Boolean(b.is_popular);
    const aIsOnSale = Boolean(a.is_on_sale);
    const bIsOnSale = Boolean(b.is_on_sale);
    
    switch(sortBy) {
      case 'newest':
        // Сначала новинки, затем по дате создания
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
        
      case 'popular':
        // Сначала популярные, затем по рейтингу
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
        
      case 'price-low':
        // По возрастанию цены (учитываем скидку)
        const priceA = aIsOnSale && a.discount_price ? 
          parseFloat(a.discount_price) : parseFloat(a.price || 0);
        const priceB = bIsOnSale && b.discount_price ? 
          parseFloat(b.discount_price) : parseFloat(b.price || 0);
        return priceA - priceB;
        
      case 'price-high':
        // По убыванию цены (учитываем скидку)
        const priceAHigh = aIsOnSale && a.discount_price ? 
          parseFloat(a.discount_price) : parseFloat(a.price || 0);
        const priceBHigh = bIsOnSale && b.discount_price ? 
          parseFloat(b.discount_price) : parseFloat(b.price || 0);
        return priceBHigh - priceAHigh;
        
      default:
        return 0;
    }
  });

  // Подсчет статистики
  const calculateStats = () => {
    const stats = {
      total: games.length,
      новинки: games.filter(g => Boolean(g.is_new)).length,
      распродажа: games.filter(g => Boolean(g.is_on_sale)).length,
      популярные: games.filter(g => Boolean(g.is_popular)).length,
    };
    
    // Категории
    const allCategories = games.map(g => g.category).filter(Boolean);
    const uniqueCategories = [...new Set(allCategories)];
    
    stats.rpg = games.filter(g => 
      g.category && (
        g.category.includes('RPG') || 
        g.category.toLowerCase().includes('rpg')
      )
    ).length;
    
    stats.шутеры = games.filter(g => {
      if (!g.category) return false;
      const cat = g.category.toLowerCase();
      return !cat.includes('rpg') && cat !== 'action rpg' && cat.trim() !== '';
    }).length;
    
    stats.стратегии = games.filter(g => 
      g.category && (
        g.category.toLowerCase().includes('страте') || 
        g.category.toLowerCase().includes('strategy')
      )
    ).length;
    
    console.log('📈 Статистика:', stats);
    console.log('🏷️ Уникальные категории:', uniqueCategories);
    
    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="catalog-page">
        <div className="page-header">
          <h1 className="page-title">КАТАЛОГ ИГР</h1>
          <p className="page-subtitle">Загрузка игр с сервера...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page">
        <div className="page-header">
          <h1 className="page-title">ОШИБКА</h1>
          <p className="page-subtitle" style={{ color: 'red' }}>{error}</p>
          <button 
            className="auth-btn" 
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <div className="page-header">
        <h1 className="page-title">КАТАЛОГ ИГР</h1>
        <p className="page-subtitle">
          {games.length} игр загружено с сервера | 
          Новинки: {stats.новинки} | 
          Распродажа: {stats.распродажа} | 
          Популярные: {stats.популярные}
        </p>
      </div>
      
      <div className="catalog-controls">
        <div className="filter-buttons">
          {[
            { key: 'all', label: 'Все', count: stats.total },
            { key: 'новинки', label: 'Новинки', count: stats.новинки },
            { key: 'распродажа', label: 'Распродажа', count: stats.распродажа },
            { key: 'популярные', label: 'Популярные', count: stats.популярные },
            { key: 'rpg', label: 'RPG', count: stats.rpg },
            { key: 'шутеры', label: 'Шутеры', count: stats.шутеры },
            { key: 'стратегии', label: 'Стратегии', count: stats.стратегии }
          ].map(item => (
            <button 
              key={item.key}
              className={`filter-btn ${filter === item.key ? 'active' : ''}`}
              onClick={() => {
                console.log(`Выбран фильтр: ${item.key} (${item.count} игр)`);
                setFilter(item.key);
              }}
              disabled={item.count === 0}
              title={item.count === 0 ? 'Нет игр в этой категории' : `Показать ${item.count} игр`}
            >
              <span className="filter-label">{item.label}</span>
              {item.count > 0 && (
                <span className="filter-count">{item.count}</span>
              )}
            </button>
          ))}
        </div>
        
        <div className="sort-container">
          <span className="sort-label">Сортировка:</span>
          <select 
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => {
              console.log(`Выбрана сортировка: ${e.target.value}`);
              setSortBy(e.target.value);
            }}
          >
            <option value="newest">Сначала новинки</option>
            <option value="popular">По популярности</option>
            <option value="price-low">Цена: по возрастанию</option>
            <option value="price-high">Цена: по убыванию</option>
          </select>
        </div>
      </div>
      
      {/* Информация о выбранном фильтре */}
      {filter !== 'all' && (
        <div className="filter-info">
          <div className="filter-indicator">
            <span className="filter-active">
              <i className="fas fa-filter"></i> Активный фильтр: <strong>{filter}</strong>
            </span>
            <span className="filter-results">
              Найдено игр: <strong>{sortedGames.length}</strong>
            </span>
            <button 
              className="clear-filter-btn"
              onClick={() => setFilter('all')}
            >
              <i className="fas fa-times"></i> Сбросить фильтр
            </button>
          </div>
        </div>
      )}
      
      <div className="games-grid">
        {sortedGames.length > 0 ? (
          sortedGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        ) : (
          <div className="no-games">
            <div className="no-games-content">
              <h3>
                <i className="fas fa-search"></i> Игры не найдены
              </h3>
              <p>По фильтру "<strong>{filter}</strong>" не найдено ни одной игры.</p>
              
              {/* Показываем доступные категории */}
              <div className="available-categories">
                <p>Доступные категории в базе данных:</p>
                <div className="category-tags">
                  {Array.from(new Set(games.map(g => g.category).filter(Boolean))).map((cat, idx) => {
                    const count = games.filter(g => g.category === cat).length;
                    return (
                      <span 
                        key={idx}
                        className="category-tag"
                        onClick={() => {
                          console.log('Выбрана категория:', cat);
                          setFilter(cat.toLowerCase());
                        }}
                        title={`${count} игр`}
                      >
                        {cat} <span className="tag-count">({count})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <button 
                className="auth-btn primary-btn"
                onClick={() => setFilter('all')}
              >
                <i className="fas fa-gamepad"></i> Показать все игры
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Отладочная информация (можно удалить после тестирования) */}
      <div className="debug-info" style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '8px',
        fontSize: '13px',
        color: '#aaa',
        border: '1px solid #333'
      }}>
        <h4 style={{ marginBottom: '10px', color: '#0af' }}>
          <i className="fas fa-bug"></i> Отладка фильтрации
        </h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <strong>Фильтр:</strong> {filter}<br/>
            <strong>Найдено игр:</strong> {sortedGames.length}<br/>
            <strong>Всего игр:</strong> {games.length}
          </div>
          <div>
            <strong>Новинки в БД:</strong> {stats.новинки}<br/>
            <strong>Популярные в БД:</strong> {stats.популярные}<br/>
            <strong>Распродажа в БД:</strong> {stats.распродажа}
          </div>
          <div>
            <strong>RPG в БД:</strong> {stats.rpg}<br/>
            <strong>Шутеры в БД:</strong> {stats.шутеры}<br/>
            <strong>Стратегии в БД:</strong> {stats.стратегии}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;