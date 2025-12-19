import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateRegister } from '../utils/validation';
import { api } from '../services/api';
import '../App.css'; // Добавьте этот импорт

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const validateForm = () => {
    const validation = validateRegister(formData.email, formData.password, formData.username);
    const newErrors = { ...validation.errors };

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const result = await api.register(formData.email, formData.password, formData.username);
      
      if (result.success) {
        // СОХРАНЯЕМ ПОЛЬЗОВАТЕЛЯ С БАЛАНСОМ
        const userWithBalance = {
          ...result.user,
          balance: 1000 // Начальный баланс
        };
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(userWithBalance));
        
        // ТРИГГЕРИМ СОБЫТИЕ ДЛЯ ОБНОВЛЕНИЯ HEADER
        window.dispatchEvent(new Event('userChanged'));
        
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/');
          // Даем время на обновление интерфейса
          setTimeout(() => window.location.reload(), 50);
        }, 2000);
      } else {
        setServerError(result.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setServerError('Ошибка сервера. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container panel success">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h1 className="auth-title">РЕГИСТРАЦИЯ УСПЕШНА!</h1>
          <p className="auth-subtitle">
            Вы успешно зарегистрировались. Перенаправляем на главную...
          </p>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#0fce7c' }}>
            <i className="fas fa-gift"></i> Вам начислено 1000 ₽ на баланс!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container panel">
        <h1 className="auth-title">СОЗДАТЬ АККАУНТ</h1>
        <p className="auth-subtitle">Заполните форму регистрации</p>
        
        {serverError && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <i className="fas fa-user"></i> Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Ваше имя"
              disabled={loading}
              minLength="3"
              maxLength="20"
            />
            {errors.username && <div className="error-message">{errors.username}</div>}
          </div>

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
              placeholder="Минимум 6 символов"
              disabled={loading}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
            <div className="password-hint">
              Пароль должен содержать заглавные и строчные буквы, цифры
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <i className="fas fa-lock"></i> Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Повторите пароль"
              disabled={loading}
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <div className="form-terms">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">
              Я согласен с условиями использования и политикой конфиденциальности
            </label>
          </div>

          <div className="registration-bonus">
            <i className="fas fa-gift"></i>
            <span>Бонус за регистрацию: 1000 ₽ на баланс!</span>
          </div>

          <button 
            type="submit" 
            className="auth-btn submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Регистрация...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Зарегистрироваться
              </>
            )}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Уже есть аккаунт?{' '}
            <a href="/login" className="auth-link">
              Войти
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;