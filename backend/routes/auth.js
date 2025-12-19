const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware аутентификации
const authenticate = (req, res, next) => {
  try {
    console.log('🔍 [authenticate] Проверка токена...');
    console.log('🔍 [authenticate] Заголовки:', req.headers);
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ [authenticate] Заголовок Authorization отсутствует');
      return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    }
    
    console.log('🔍 [authenticate] Authorization header:', authHeader);
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      console.log('❌ [authenticate] Токен отсутствует в заголовке');
      return res.status(401).json({ success: false, error: 'Токен отсутствует' });
    }
    
    console.log('🔑 [authenticate] Получен токен (первые 30 символов):', token.substring(0, 30) + '...');
    
    // Проверяем структуру токена
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ [authenticate] Неверный формат токена');
      return res.status(401).json({ success: false, error: 'Неверный формат токена' });
    }
    
    try {
      // Декодируем payload для отладки
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('📋 [authenticate] Декодированные данные токена:', payload);
      console.log('🔑 [authenticate] userId в токене:', payload.userId);
    } catch (decodeErr) {
      console.log('⚠️ [authenticate] Не могу декодировать payload:', decodeErr.message);
    }
    
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ [authenticate] Токен верифицирован успешно');
    console.log('👤 [authenticate] Данные пользователя:', decoded);
    
    // Проверяем наличие userId
    if (!decoded.userId) {
      console.error('❌ [authenticate] В токене отсутствует userId. Токен содержит:', decoded);
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный формат токена: отсутствует userId' 
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ [authenticate] Ошибка верификации токена:', error.message);
    console.error('❌ [authenticate] Полная ошибка:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Неверный токен' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Токен истек' });
    } else {
      return res.status(401).json({ success: false, error: 'Ошибка аутентификации' });
    }
  }
};

// 📌 ТЕСТОВЫЙ ЭНДПОИНТ ДЛЯ ПРОВЕРКИ АУТЕНТИФИКАЦИИ
router.get('/test-auth', authenticate, (req, res) => {
  console.log('✅ [test-auth] Запрос получен');
  res.json({
    success: true,
    message: 'Аутентификация работает!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// 📌 ПРОВЕРКА ТОКЕНА (без запроса к БД)
router.get('/verify', authenticate, (req, res) => {
  console.log('✅ [verify] Токен валиден');
  res.json({
    success: true,
    message: 'Токен валиден',
    user: req.user
  });
});

// Валидация email
const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

// Валидация пароля
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Валидация имени пользователя
const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};

//  РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    console.log('📝 [register] Регистрация пользователя:', { email, username });
    
    //  БЭКЕНД ВАЛИДАЦИЯ
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Некорректный email формат' 
      });
    }
    
    if (!password || !validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Пароль должен быть не менее 6 символов' 
      });
    }
    
    if (!username || !validateUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Имя должно быть от 3 до 20 символов' 
      });
    }
    
    // Проверяем, существует ли пользователь
    const [existingUser] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем пользователя
    const [result] = await db.execute(
      'INSERT INTO users (email, password, username, role, balance) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, username, 'user', 1000]
    );
    
    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: result.insertId, email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log(' [register] Пользователь создан, ID:', result.insertId);
    
    res.json({
      success: true,
      token,
      user: {
        id: result.insertId,
        email,
        username,
        role: 'user',
        balance: 1000,
        avatar_url: null,
        full_name: null,
        phone: null,
        bio: null,
        country: null,
        city: null,
        birth_date: null
      }
    });
    
  } catch (error) {
    console.error(' [register] Ошибка регистрации:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при регистрации',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ВХОД
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('📝 [login] Попытка входа:', { email });
    
    //  БЭКЕНД ВАЛИДАЦИЯ
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Некорректный email' 
      });
    }
    
    if (!password || !validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Пароль должен быть не менее 6 символов' 
      });
    }
    
    // Ищем пользователя
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log(' [login] Пользователь не найден:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный email или пароль' 
      });
    }
    
    const user = users[0];
    console.log(' [login] Пользователь найден, ID:', user.id);
    
    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log(' [login] Неверный пароль для пользователя:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный email или пароль' 
      });
    }
    
    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('[login] Токен сгенерирован для userId:', user.id);
    
    // Убираем пароль из ответа и добавляем все поля профиля
    const { password: _, ...userWithoutPassword } = user;
    
    // Гарантируем что все поля профиля есть в ответе
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      balance: user.balance || 0,
      avatar_url: user.avatar_url || null,
      full_name: user.full_name || null,
      phone: user.phone || null,
      bio: user.bio || null,
      country: user.country || null,
      city: user.city || null,
      birth_date: user.birth_date || null,
      created_at: user.created_at
    };
    
    console.log(' [login] Успешный вход для пользователя:', userResponse.email);
    
    res.json({
      success: true,
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error(' [login] Ошибка входа:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при входе',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📌 ПОЛУЧИТЬ ПРОФИЛЬ (только для аутентифицированных) - С ОТЛАДКОЙ
router.get('/profile', authenticate, async (req, res) => {
  try {
    console.log('📝 [profile] Запрос профиля получен');
    console.log(' [profile] Пользователь из токена:', req.user);
    
    const userId = req.user.userId;
    console.log(' [profile] UserID из токена:', userId);
    
    if (!userId) {
      console.error(' [profile] userId не определен');
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный формат токена: отсутствует userId' 
      });
    }
    
    console.log(' [profile] Выполняем запрос к БД для userId:', userId);
    
    const [users] = await db.execute(
      `SELECT id, email, username, role, balance, 
              avatar_url, full_name, phone, bio, 
              country, city, birth_date, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    console.log(' [profile] Результат запроса к БД:', {
      found: users.length,
      user: users[0] ? {
        id: users[0].id,
        email: users[0].email,
        username: users[0].username
      } : 'Нет данных'
    });
    
    if (users.length === 0) {
      console.error(' [profile] Пользователь не найден в БД для userId:', userId);
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден',
        userId: userId
      });
    }
    
    console.log(' [profile] Пользователь найден:', users[0].email);
    
    res.json({ 
      success: true, 
      user: users[0] 
    });
    
  } catch (error) {
    console.error(' [profile] Ошибка получения профиля:', error);
    console.error(' [profile] Сообщение ошибки:', error.message);
    console.error(' [profile] Stack trace:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при получении профиля',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

//  ОБНОВИТЬ ПРОФИЛЬ
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, full_name, phone, bio, country, city, birth_date } = req.body;
    const userId = req.user.userId;
    
    console.log('📝 [update-profile] Обновление профиля для userId:', userId);
    
    // Проверка username на уникальность (кроме текущего пользователя)
    if (username) {
      const [existingUser] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Имя пользователя уже занято' 
        });
      }
    }
    
    // Валидация телефона (опционально)
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Некорректный номер телефона' 
      });
    }
    
    // Валидация даты рождения
    if (birth_date) {
      const birthDate = new Date(birth_date);
      const today = new Date();
      if (birthDate > today) {
        return res.status(400).json({ 
          success: false, 
          error: 'Дата рождения не может быть в будущем' 
        });
      }
    }
    
    // Обновляем профиль
    const [result] = await db.execute(
      `UPDATE users SET 
        username = COALESCE(?, username),
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        bio = COALESCE(?, bio),
        country = COALESCE(?, country),
        city = COALESCE(?, city),
        birth_date = COALESCE(?, birth_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [username, full_name, phone, bio, country, city, birth_date, userId]
    );
    
    console.log(' [update-profile] Профиль обновлен, affected rows:', result.affectedRows);
    
    // Получаем обновленного пользователя
    const [users] = await db.execute(
      `SELECT id, email, username, role, balance, 
              avatar_url, full_name, phone, bio, 
              country, city, birth_date, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Профиль обновлен',
      user: users[0]
    });
    
  } catch (error) {
    console.error(' [update-profile] Ошибка обновления профиля:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

//  ОБНОВИТЬ АВАТАР
router.post('/profile/avatar', authenticate, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    const userId = req.user.userId;
    
    console.log('📝 [avatar] Обновление аватара для userId:', userId);
    
    if (!avatar_url) {
      return res.status(400).json({ success: false, error: 'URL аватара обязателен' });
    }
    
    await db.execute(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatar_url, userId]
    );
    
    console.log(' [avatar] Аватар обновлен');
    
    res.json({ 
      success: true, 
      message: 'Аватар обновлен',
      avatar_url
    });
    
  } catch (error) {
    console.error(' [avatar] Ошибка обновления аватара:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

//  ОБНОВИТЬ БАЛАНС
router.put('/profile/balance', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;
    
    console.log('📝 [balance] Обновление баланса для userId:', userId, 'amount:', amount);
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Сумма должна быть числом' 
      });
    }
    
    // Получаем текущий баланс
    const [users] = await db.execute(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    const currentBalance = parseFloat(users[0].balance) || 0;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Обновляем баланс
    await db.execute(
      'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newBalance, userId]
    );
    
    console.log(' [balance] Баланс обновлен:', { currentBalance, newBalance });
    
    res.json({ 
      success: true, 
      message: 'Баланс обновлен',
      new_balance: newBalance
    });
    
  } catch (error) {
    console.error(' [balance] Ошибка обновления баланса:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

module.exports = router;