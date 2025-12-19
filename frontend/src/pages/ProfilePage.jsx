import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../App.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone: '',
    bio: '',
    country: '',
    city: '',
    birth_date: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    loadProfile();
  }, [navigate]);
  
  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // Проверяем есть ли метод getProfile в api
      if (!api.getProfile) {
        throw new Error('Метод getProfile не доступен. Проверьте файл api.js');
      }
      
      const result = await api.getProfile();
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Не удалось загрузить профиль');
      }
      
      setProfile(result.user);
      setFormData({
        username: result.user.username || '',
        full_name: result.user.full_name || '',
        phone: result.user.phone || '',
        bio: result.user.bio || '',
        country: result.user.country || '',
        city: result.user.city || '',
        birth_date: result.user.birth_date ? result.user.birth_date.split('T')[0] : ''
      });
      
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setErrorMessage(error.message || 'Не удалось загрузить профиль. Попробуйте войти снова.');
      
      // Если ошибка авторизации - перенаправляем на вход
      if (error.message.includes('Не авторизован') || error.message.includes('401')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setErrorMessage('');
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно быть не менее 3 символов';
    }
    
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Некорректный номер телефона';
    }
    
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth_date = 'Дата рождения не может быть в будущем';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');
      
      if (!api.updateProfile) {
        throw new Error('Метод updateProfile не доступен. Проверьте файл api.js');
      }
      
      const result = await api.updateProfile(formData);
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Не удалось обновить профиль');
      }
      
      // Обновляем localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { 
        ...currentUser, 
        ...result.user,
        balance: result.user.balance || currentUser.balance || 0
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Обновляем состояние
      setProfile(result.user);
      setSuccessMessage('Профиль успешно обновлен!');
      
      // Триггерим обновление header
      window.dispatchEvent(new Event('userChanged'));
      
      // Автоскрытие сообщения
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      setErrorMessage(error.message || 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка размера файла
    if (file.size > 2 * 1024 * 1024) {
      alert('Размер файла не должен превышать 2MB');
      return;
    }
    
    // В демо-режиме создаем временный URL
    const avatarUrl = URL.createObjectURL(file);
    
    try {
      if (!api.updateAvatar) {
        throw new Error('Метод updateAvatar не доступен');
      }
      
      // Отправляем на сервер
      const result = await api.updateAvatar(avatarUrl);
      
      if (!result.success) {
        throw new Error(result.error || 'Не удалось обновить аватар');
      }
      
      // Обновляем localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, avatar_url: avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Обновляем состояние
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setSuccessMessage('Аватар обновлен!');
      
      // Триггерим обновление
      window.dispatchEvent(new Event('userChanged'));
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Ошибка обновления аватара:', error);
      setErrorMessage(error.message || 'Не удалось обновить аватар');
    }
  };
  
  if (loading) {
    return (
      <div className="profile-page">
        <div className="page-header">
          <h1 className="page-title">ПРОФИЛЬ</h1>
          <p className="page-subtitle">Загрузка...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ</h1>
        <p className="page-subtitle">Управление вашим аккаунтом</p>
      </div>
      
      {errorMessage && (
        <div className="auth-error" style={{ margin: '0 auto 20px', maxWidth: '800px' }}>
          <i className="fas fa-exclamation-circle"></i> {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message panel" style={{ margin: '0 auto 20px', maxWidth: '800px' }}>
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}
      
      {profile ? (
        <div className="profile-container">
          <div className="profile-sidebar panel">
            <div className="avatar-section">
              <div className="avatar-preview">
                <img 
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0fce7c&color=fff&size=150`} 
                  alt="Аватар"
                  className="avatar-image"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${profile.username}&background=0fce7c&color=fff&size=150`;
                  }}
                />
              </div>
              
              <label className="avatar-upload-btn">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <i className="fas fa-camera"></i> Сменить аватар
              </label>
            </div>
            
            <div className="user-stats">
              <div className="stat-item">
                <div className="stat-value">{parseFloat(profile.balance || 0).toLocaleString('ru-RU')} ₽</div>
                <div className="stat-label">Баланс</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">
                  {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                </div>
                <div className="stat-label">Дата регистрации</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-value">
                  <span className={`role-badge ${profile.role}`}>
                    {profile.role === 'admin' ? '👑 Администратор' : 
                     profile.role === 'seller' ? '💰 Продавец' : 
                     profile.role === 'editor' ? '✏️ Редактор' : '👤 Пользователь'}
                  </span>
                </div>
                <div className="stat-label">Роль</div>
              </div>
            </div>
            
            <div className="profile-actions">
              <button 
                className="auth-btn login-btn" 
                onClick={() => navigate('/orders')}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <i className="fas fa-shopping-bag"></i> Мои заказы
              </button>
              <button 
                className="auth-btn login-btn" 
                onClick={() => navigate('/favorites')}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                <i className="fas fa-heart"></i> Избранное
              </button>
            </div>
          </div>
          
          <div className="profile-content panel">
            <h2 className="section-title">Редактирование профиля</h2>
            
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <i className="fas fa-envelope"></i> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile.email || ''}
                    disabled
                    className="form-input"
                  />
                  <div className="form-hint">Email нельзя изменить</div>
                </div>
                
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
                    placeholder="Ваш никнейм"
                  />
                  {errors.username && <div className="error-message">{errors.username}</div>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name" className="form-label">
                    <i className="fas fa-id-card"></i> Полное имя
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Имя Фамилия"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    <i className="fas fa-phone"></i> Телефон
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="+7 (999) 123-45-67"
                  />
                  {errors.phone && <div className="error-message">{errors.phone}</div>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="country" className="form-label">
                    <i className="fas fa-globe"></i> Страна
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Россия"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    <i className="fas fa-city"></i> Город
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Москва"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="birth_date" className="form-label">
                  <i className="fas fa-birthday-cake"></i> Дата рождения
                </label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className={`form-input ${errors.birth_date ? 'error' : ''}`}
                />
                {errors.birth_date && <div className="error-message">{errors.birth_date}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="bio" className="form-label">
                  <i className="fas fa-edit"></i> О себе
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Расскажите о себе..."
                  rows="4"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="auth-btn register-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Сохранение...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Сохранить изменения
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="auth-btn login-btn"
                  onClick={() => navigate('/')}
                  disabled={saving}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="profile-error panel" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '50px', color: '#ff6b6b', marginBottom: '20px' }}></i>
          <h2>Не удалось загрузить профиль</h2>
          <p>Попробуйте перезагрузить страницу или войти снова</p>
          <button 
            className="auth-btn register-btn"
            onClick={loadProfile}
            style={{ marginTop: '20px' }}
          >
            <i className="fas fa-redo"></i> Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;