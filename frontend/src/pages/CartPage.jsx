import React from 'react';
import { useCartStore } from '../store/store';
import { useAuthStore } from '../store/store';
import { Link, useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const { user, updateBalance } = useAuthStore();
  const navigate = useNavigate();
  
  const totalPrice = getTotalPrice();
  
  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.balance < totalPrice) {
      alert('Недостаточно средств на балансе!');
      return;
    }
    
    // Списание денег
    const newBalance = user.balance - totalPrice;
    updateBalance(newBalance);
    
    // Очистка корзины
    clearCart();
    
    // Редирект на страницу успеха
    navigate('/order-success');
  };
  
  if (items.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="page-header">
          <h1 className="page-title">КОРЗИНА</h1>
          <p className="page-subtitle">Ваша корзина пуста</p>
          <Link to="/catalog" className="auth-btn register-btn">
            ПЕРЕЙТИ В КАТАЛОГ
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="cart-page">
      <div className="page-header">
        <h1 className="page-title">КОРЗИНА</h1>
        <p className="page-subtitle">Оформление заказа</p>
      </div>
      
      <div className="cart-container">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item panel">
              <div className="cart-item-image">
                <img src={item.image} alt={item.name} />
              </div>
              
              <div className="cart-item-info">
                <h3 className="cart-item-title">{item.name}</h3>
                <div className="cart-item-platform">{item.platform}</div>
                
                <div className="cart-item-controls">
                  <div className="quantity-control">
                    <button 
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="quantity-btn"
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="remove-btn"
                  >
                    <i className="fas fa-trash"></i> Удалить
                  </button>
                </div>
              </div>
              
              <div className="cart-item-price">
                <div className="price-total">
                  {item.discountPrice 
                    ? (item.discountPrice * item.quantity).toLocaleString() 
                    : (item.price * item.quantity).toLocaleString()
                  } ₽
                </div>
                <div className="price-unit">
                  {item.discountPrice 
                    ? `${item.discountPrice.toLocaleString()} ₽ / шт`
                    : `${item.price.toLocaleString()} ₽ / шт`
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary panel">
          <h3 className="summary-title">СВОДКА ЗАКАЗА</h3>
          
          <div className="summary-row">
            <span>Товары ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
            <span>{totalPrice.toLocaleString()} ₽</span>
          </div>
          
          <div className="summary-row">
            <span>Скидка</span>
            <span className="discount">−0 ₽</span>
          </div>
          
          <div className="summary-divider"></div>
          
          <div className="summary-total">
            <span>ИТОГО</span>
            <span className="total-price">{totalPrice.toLocaleString()} ₽</span>
          </div>
          
          {user && (
            <div className="user-balance-info">
              <i className="fas fa-wallet"></i>
              <span>Ваш баланс: <strong>{user.balance.toLocaleString()} ₽</strong></span>
              {user.balance < totalPrice && (
                <div className="balance-warning">
                  <i className="fas fa-exclamation-triangle"></i> Недостаточно средств!
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={handleCheckout}
            className="auth-btn register-btn checkout-btn"
            disabled={user && user.balance < totalPrice}
          >
            <i className="fas fa-lock"></i> {user ? 'ОФОРМИТЬ ЗАКАЗ' : 'ВОЙТИ ДЛЯ ОПЛАТЫ'}
          </button>
          
          <button onClick={clearCart} className="auth-btn login-btn clear-btn">
            ОЧИСТИТЬ КОРЗИНУ
          </button>
          
          <div className="secure-payment">
            <i className="fas fa-shield-alt"></i>
            <span>Безопасная оплата • Гарантия возврата</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;