import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { getGames } from '../data/gamesData';

const PopularPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        const gamesData = await getGames();
        console.log(' Загружено игр для популярной страницы:', gamesData.length);
        setGames(gamesData);
      } catch (error) {
        console.error(' Ошибка загрузки игр:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadGames();
  }, []);

  // Фильтруем только популярные игры (is_popular = true)
  const popularGames = games.filter(game => 
    game.is_popular === true || game.is_popular === 1 || game.isPopular === true
  );

  // Сортируем по рейтингу (от высокого к низкому)
  const sortedPopularGames = [...popularGames].sort((a, b) => 
    (b.rating || 0) - (a.rating || 0)
  );

  // Рассчитываем средний рейтинг
  const averageRating = popularGames.length > 0
    ? (popularGames.reduce((sum, game) => sum + (game.rating || 0), 0) / popularGames.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="popular-page">
        <div className="page-header">
          <h1 className="page-title">ПОПУЛЯРНЫЕ ИГРЫ</h1>
          <p className="page-subtitle">Загрузка данных...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="popular-page">
      <div className="page-header">
        <h1 className="page-title">ПОПУЛЯРНЫЕ ИГРЫ</h1>
        <p className="page-subtitle">
          Топ игр по оценкам сообщества | 
          {popularGames.length === 0 ? ' Нет популярных игр в базе' : ` Найдено: ${popularGames.length} игр`}
        </p>
      </div>
      
      <div className="popular-stats">
        <div className="stat-card">
          <div className="stat-value">{popularGames.length}</div>
          <div className="stat-label">игр в топе</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{averageRating}</div>
          <div className="stat-label">средний рейтинг</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {popularGames.filter(g => g.is_on_sale).length}
          </div>
          <div className="stat-label">со скидкой</div>
        </div>
      </div>

      {popularGames.length === 0 ? (
        <div className="no-popular-games">
          <div className="empty-state">
            <h3> Популярных игр пока нет</h3>
            <p>
              В базе данных нет игр с отметкой "Популярно". 
              {games.length > 0 && (
                <>
                  <br />
                  Всего в каталоге: <strong>{games.length} игр</strong>, но ни одна не помечена как популярная.
                </>
              )}
            </p>
            <div className="action-buttons">
              <button 
                className="auth-btn"
                onClick={() => window.location.href = '/catalog'}
              >
                Перейти в каталог
              </button>
              <button 
                className="auth-btn secondary"
                onClick={() => {
                  console.log('ВСЕ ИГРЫ:', games.map(g => ({
                    title: g.title,
                    is_popular: g.is_popular,
                    isPopular: g.isPopular,
                    rating: g.rating
                  })));
                }}
              >
                Проверить данные
              </button>
            </div>
            
            {/* Информация для отладки */}
            <div className="debug-info" style={{
              marginTop: '20px',
              padding: '10px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '5px',
              fontSize: '12px'
            }}>
              <p><strong>Отладка:</strong> Всего загружено {games.length} игр</p>
              <p>Поля is_popular в первой игре: {JSON.stringify(games[0]?.is_popular)}</p>
              <p>Поля isPopular в первой игре: {JSON.stringify(games[0]?.isPopular)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="games-grid highlight">
          {sortedPopularGames.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              variant="popular" 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularPage;