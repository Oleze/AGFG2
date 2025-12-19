import React from 'react';
import { useCartStore } from '../store/store';

const GameCard = ({ game, variant = 'default' }) => {
  const { addToCart } = useCartStore();
  
  // ПРАВИЛЬНОЕ получение данных из преобразованного объекта
  const isNew = game.is_new === true || game.isNew === true;
  const isPopular = game.is_popular === true || game.isPopular === true;
  const isOnSale = game.is_on_sale === true || game.discount === true;
  
  // Цены
  const price = parseFloat(game.price) || 0;
  const discountPrice = parseFloat(game.discount_price || game.discountPrice) || price;
  const hasDiscount = isOnSale && discountPrice < price;
  
  // Расчет скидки в процентах
  const discountPercent = hasDiscount && price > 0
    ? Math.round((1 - discountPrice / price) * 100)
    : 0;
  
  // Рейтинг
  const rating = parseFloat(game.rating) || 0;
  const safeRating = !isNaN(rating) ? rating : 0;
  const starsCount = Math.min(Math.floor(safeRating), 5);
  const formattedRating = safeRating.toFixed(1);
  
  // Формируем URL изображения
  const getImageUrl = () => {
    // Если путь начинается с /uploads
    if (game.image && game.image.startsWith('/uploads')) {
      return `http://localhost:5000${game.image}`;
    }
    
    // Если это полный URL
    if (game.image && game.image.startsWith('http')) {
      return game.image;
    }
    
    // Если поле image_url
    if (game.image_url) {
      if (game.image_url.startsWith('/uploads')) {
        return `http://localhost:5000${game.image_url}`;
      }
      if (game.image_url.startsWith('http')) {
        return game.image_url;
      }
    }
    
    // Placeholder
    const gameName = game.name || game.title || 'Игра';
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%232d2d3a"/><text x="150" y="100" font-family="Arial" font-size="18" fill="white" text-anchor="middle">${encodeURIComponent(gameName)}</text><text x="150" y="130" font-family="Arial" font-size="14" fill="%23888" text-anchor="middle">Нет изображения</text></svg>`;
  };

  const imageUrl = getImageUrl();

  // Функция добавления в корзину
  const handleAddToCart = () => {
    const gameForCart = {
      id: game.id,
      name: game.name || game.title,
      title: game.title || game.name,
      price: price,
      discountPrice: hasDiscount ? discountPrice : undefined,
      platform: game.platform,
      category: game.category,
      image: imageUrl,
      rating: safeRating,
      discount: hasDiscount ? discountPercent : undefined,
      is_new: isNew,
      is_popular: isPopular,
      is_on_sale: isOnSale
    };
    
    addToCart(gameForCart);
    
    // Анимация добавления
    const btn = document.querySelector(`[data-game-id="${game.id}"]`);
    if (btn) {
      const originalHtml = btn.innerHTML;
      const originalBg = btn.style.background;
      
      btn.innerHTML = '<i class="fas fa-check"></i> ДОБАВЛЕНО';
      btn.style.background = '#0fce7c';
      
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = originalBg;
      }, 1500);
    }
  };

  return (
    <div className={`game-card panel ${variant}`}>
      <div className="game-badges">
        {isNew && <span className="badge new">НОВИНКА</span>}
        {hasDiscount && <span className="badge discount">-{discountPercent}%</span>}
        {isPopular && <span className="badge popular">ПОПУЛЯРНО</span>}
      </div>
      
      <div className="game-image">
        <img 
          src={imageUrl} 
          alt={game.name || game.title}
          loading="lazy"
          style={{ 
            backgroundColor: '#2d2d3a',
            minHeight: '200px',
            width: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            const gameName = game.name || game.title || 'Игра';
            e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%232d2d3a"/><text x="150" y="100" font-family="Arial" font-size="18" fill="white" text-anchor="middle">${encodeURIComponent(gameName)}</text><text x="150" y="130" font-family="Arial" font-size="14" fill="%23ff6666" text-anchor="middle">Ошибка загрузки</text></svg>`;
          }}
        />
      </div>
      
      <div className="game-info">
        <h3 className="game-title">{game.name || game.title}</h3>
        <div className="game-meta">
          <span className="game-platform">{game.platform}</span>
          <span className="game-category">{game.category}</span>
        </div>
        
        <div className="game-rating">
          {'★'.repeat(starsCount)}
          {'☆'.repeat(5 - starsCount)}
          <span className="rating-value">{formattedRating}</span>
        </div>
        
        <div className="game-pricing">
          {hasDiscount ? (
            <>
              <div className="original-price">{price.toFixed(0)} ₽</div>
              <div className="current-price">{discountPrice.toFixed(0)} ₽</div>
              <div className="saving">Экономия {(price - discountPrice).toFixed(0)} ₽</div>
            </>
          ) : (
            <div className="current-price only">{price.toFixed(0)} ₽</div>
          )}
        </div>
        
        <button 
          className="auth-btn buy-btn"
          onClick={handleAddToCart}
          data-game-id={game.id}
          title={`Добавить "${game.name || game.title}" в корзину`}
        >
          <i className="fas fa-shopping-cart"></i> В КОРЗИНУ
        </button>
      </div>
    </div>
  );
};

export default GameCard;