import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateLogin } from '../utils/validation';
import { api } from '../services/api';
import '../App.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    const validation = validateLogin(formData.email, formData.password);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const result = await api.login(formData.email, formData.password);
      
      if (result.success) {
        // Сохраняем токен и пользователя с балансом
        const userWithBalance = {
          ...result.user,
          balance: 1000 // Начальный баланс
        };
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(userWithBalance));
        
        // Триггерим событие для обновления Header
        window.dispatchEvent(new Event('userChanged'));
        
        navigate('/');
        // Даем время на обновление состояния
        setTimeout(() => window.location.reload(), 50);
      } else {
        setServerError(result.error || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      setServerError('Ошибка сервера. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container panel">
        <h1 className="auth-title">ВОЙТИ В АККАУНТ</h1>
        <p className="auth-subtitle">Введите email и пароль</p>
        
        {serverError && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <i className="fas fa-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="your@email.com"
              disabled={loading}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <i className="fas fa-lock"></i> Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <button 
            type="submit" 
            className="auth-btn submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Вход...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Войти
              </>
            )}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Нет аккаунта?{' '}
            <a href="/register" className="auth-link">
              Зарегистрироваться
            </a>
          </p>
          <p>
            <a href="/forgot-password" className="auth-link">
              Забыли пароль?
            </a>
          </p>
        </div>

        <div className="auth-test-accounts">
          <h3>Тестовые аккаунты:</h3>
          <div className="test-account">
            <strong>Админ:</strong> admin@test.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;