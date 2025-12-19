import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import { getGames } from '../data/gamesData';

const SalesPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 23,
    minutes: 47,
    seconds: 0
  });

  // Таймер обратного отсчета
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Загрузка игр
  useEffect(() => {
    async function loadGames() {
      try {
        const gamesData = await getGames();
        console.log(' Загружено игр для распродажи:', gamesData.length);
        setGames(gamesData);
      } catch (error) {
        console.error(' Ошибка загрузки игр:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadGames();
  }, []);

  // Фильтруем игры со скидкой (is_on_sale = true И discount_price < price)
  const saleGames = games.filter(game => {
    const isOnSale = game.is_on_sale === true || game.is_on_sale === 1 || game.discount === true;
    const hasDiscountPrice = game.discount_price && parseFloat(game.discount_price) < parseFloat(game.price);
    return isOnSale && hasDiscountPrice;
  });

  // Рассчитываем максимальную скидку
  const calculateMaxDiscount = () => {
    if (saleGames.length === 0) return 0;
    
    return Math.max(...saleGames.map(game => {
      const price = parseFloat(game.price) || 0;
      const discountPrice = parseFloat(game.discount_price) || price;
      if (price === 0) return 0;
      return Math.round((1 - discountPrice / price) * 100);
    }));
  };

  // Рассчитываем общую экономию
  const calculateTotalSavings = () => {
    return saleGames.reduce((sum, game) => {
      const price = parseFloat(game.price) || 0;
      const discountPrice = parseFloat(game.discount_price) || price;
      return sum + (price - discountPrice);
    }, 0);
  };

  const maxDiscount = calculateMaxDiscount();
  const totalSavings = calculateTotalSavings();

  if (loading) {
    return (
      <div className="sales-page">
        <div className="page-header">
          <h1 className="page-title">РАСПРОДАЖИ</h1>
          <p className="page-subtitle">Загрузка данных о скидках...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1 className="page-title">РАСПРОДАЖИ</h1>
        <p className="page-subtitle">
          {saleGames.length === 0 
            ? 'К сожалению, сейчас нет активных распродаж' 
            : `Скидки до -${maxDiscount}% на ${saleGames.length} игр`}
        </p>
        
        <div className="sale-timer">
          <div className="timer-title">
            <i className="fas fa-clock"></i> До конца распродажи:
          </div>
          <div className="timer-display">
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.days.toString().padStart(2, '0')}</span>
              <span className="timer-label">дней</span>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="timer-label">часов</span>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="timer-label">мин</span>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="timer-label">сек</span>
            </div>
          </div>
        </div>
      </div>

      {saleGames.length > 0 && (
        <>
          <div className="sale-stats">
            <div className="sale-stat-card">
              <div className="sale-stat-icon">🔥</div>
              <div className="sale-stat-value">{saleGames.length}</div>
              <div className="sale-stat-label">игр со скидкой</div>
            </div>
            
            <div className="sale-stat-card highlight">
              <div className="sale-stat-icon">💰</div>
              <div className="sale-stat-value">-{maxDiscount}%</div>
              <div className="sale-stat-label">максимальная скидка</div>
            </div>
            
            <div className="sale-stat-card">
              <div className="sale-stat-icon">💸</div>
              <div className="sale-stat-value">{Math.round(totalSavings)} ₽</div>
              <div className="sale-stat-label">общая экономия</div>
            </div>
          </div>

          <div className="discount-banner">
            <div className="banner-content">
              <div className="banner-title">🔥 ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ 🔥</div>
              <div className="banner-subtitle">
                Успей купить по лучшей цене! Экономьте до {Math.round(totalSavings)} ₽
              </div>
            </div>
          </div>
        </>
      )}

      <div className="games-grid sale">
        {saleGames.length > 0 ? (
          saleGames.map(game => (
            <GameCard key={game.id} game={game} variant="sale" />
          ))
        ) : (
          <div className="no-sales">
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <h3>Активных распродаж нет</h3>
              <p>
                В данный момент нет игр со скидками.
                {games.length > 0 && (
                  <>
                    <br />
                    В каталоге есть <strong>{games.length} игр</strong>, но ни одна не помечена как распродажа.
                  </>
                )}
              </p>
              
              <div className="action-buttons">
                <button 
                  className="auth-btn"
                  onClick={() => window.location.href = '/catalog'}
                >
                  <i className="fas fa-gamepad"></i> Перейти в каталог
                </button>
                
                <button 
                  className="auth-btn secondary"
                  onClick={() => {
                    console.log('ДАННЫЕ ДЛЯ ОТЛАДКИ:');
                    console.log('Все игры:', games.map(g => ({
                      title: g.title,
                      price: g.price,
                      discount_price: g.discount_price,
                      is_on_sale: g.is_on_sale,
                      discount: g.discount
                    })));
                  }}
                >
                  <i className="fas fa-bug"></i> Проверить данные
                </button>
              </div>
              
              {/* Подсказка для админа */}
              <div className="admin-hint">
                <p>
                  <strong>Для админа:</strong> Чтобы добавить игры в распродажу:
                </p>
                <ol>
                  <li>Зайдите в админ-панель</li>
                  <li>Откройте раздел "Игры"</li>
                  <li>Для нужной игры установите "В распродаже" = Да</li>
                  <li>Укажите цену со скидкой (меньше основной)</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;