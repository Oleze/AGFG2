const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // Импорт подключения к БД
const upload = require('./middleware/upload');

const app = express();

// ===================== CORS НАСТРОЙКА =====================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      null,
      'null'
    ];
    
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Логирование для отладки
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ===================== MIDDLEWARE =====================

// Проверка JWT токена - ОСТАВЛЯЕМ ОДНУ ВЕРСИЮ!
function authenticateToken(req, res, next) {
  try {
    console.log(' [authenticateToken] Проверка токена для URL:', req.url);
    console.log(' [authenticateToken] Заголовки:', req.headers);
    
    const authHeader = req.headers['authorization'];
    console.log(' [authenticateToken] Authorization header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log(' [authenticateToken] Токен отсутствует');
      return res.status(401).json({ error: 'Токен отсутствует' });
    }
    
    console.log(' [authenticateToken] Получен токен (первые 30 символов):', token.substring(0, 30) + '...');
    
    // Проверяем структуру токена
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log(' [authenticateToken] Неверный формат токена');
      return res.status(401).json({ error: 'Неверный формат токена' });
    }
    
    try {
      // Декодируем payload для отладки
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log(' [authenticateToken] Декодированные данные токена:', payload);
      console.log(' [authenticateToken] userId в токене:', payload.userId);
    } catch (decodeErr) {
      console.log(' [authenticateToken] Не могу декодировать payload:', decodeErr.message);
    }
    
    // Верифицируем токен
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-123', (err, user) => {
      if (err) {
        console.error(' [authenticateToken] Ошибка верификации токена:', err.message);
        console.error(' [authenticateToken] Полная ошибка:', err);
        return res.status(403).json({ error: 'Недействительный токен' });
      }
      
      console.log(' [authenticateToken] Токен верифицирован успешно');
      console.log(' [authenticateToken] Данные пользователя:', user);
      
      // Проверяем наличие userId
      if (!user.userId) {
        console.error(' [authenticateToken] В токене отсутствует userId. Токен содержит:', user);
        return res.status(400).json({ 
          success: false, 
          error: 'Неверный формат токена: отсутствует userId' 
        });
      }
      
      req.user = user;
      next();
    });
    
  } catch (error) {
    console.error(' [authenticateToken] Необработанная ошибка:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка аутентификации',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Проверка ролей
function checkRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
  };
}

// ===================== API ЭНДПОИНТЫ =====================

// 1. Корневой маршрут
app.get('/', (req, res) => {
  res.json({
    message: ' All Games For Gamers API',
    version: '1.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        updateAvatar: 'POST /api/auth/profile/avatar',
        updateBalance: 'PUT /api/auth/profile/balance'
      },
      games: {
        all: 'GET /api/games',
        single: 'GET /api/games/:id'
      },
      admin: {
        users: 'GET /api/admin/users (только для админов)'
      }
    }
  });
});

// 2. Получить все игры
app.get('/api/games', async (req, res) => {
  try {
    const [games] = await pool.query('SELECT * FROM products');
    res.json(games);
  } catch (error) {
    console.error('Ошибка получения игр:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. Получить одну игру по ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const [games] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (games.length === 0) {
      return res.status(404).json({ error: 'Игра не найдена' });
    }
    
    res.json(games[0]);
  } catch (error) {
    console.error('Ошибка получения игры:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 4. Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    // Проверяем существующего пользователя
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаём пользователя
    const [result] = await pool.query(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username]
    );
    
    // Генерируем токен
    const token = jwt.sign(
      { userId: result.insertId, email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: result.insertId,
        email,
        username,
        role: 'user',
        balance: 0,
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
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 5. Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    // Ищем пользователя
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const user = users[0];
    
    // Проверяем пароль
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Генерируем токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '7d' }
    );
    
    // Убираем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 6. ПОЛУЧИТЬ ПРОФИЛЬ - С ДЕТАЛЬНОЙ ОТЛАДКОЙ
// 6. ПОЛУЧИТЬ ПРОФИЛЬ - С ДЕТАЛЬНОЙ ОТЛАДКОЙ
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    console.log(' [GET /api/auth/profile] Запрос профиля получен');
    console.log(' [GET /api/auth/profile] Пользователь из токена:', req.user);
    
    const userId = req.user.userId;
    console.log(' [GET /api/auth/profile] UserID из токена:', userId);
    
    if (!userId) {
      console.error(' [GET /api/auth/profile] userId не определен');
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный формат токена: отсутствует userId' 
      });
    }
    
    console.log('📡 [GET /api/auth/profile] Выполняем запрос к БД для userId:', userId);
    
    // СНАЧАЛА ПОЛУЧИМ ВСЕ СТОЛБЦЫ ТАБЛИЦЫ
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.DB_NAME || 'game_store']);
    
    console.log(' [GET /api/auth/profile] Столбцы таблицы users:', columns.map(c => c.COLUMN_NAME));
    
    // Проверим наличие конкретных столбцов
    const columnNames = columns.map(c => c.COLUMN_NAME);
    console.log('   [GET /api/auth/profile] Проверяем столбцы:');
    console.log('   - avatar_url exists:', columnNames.includes('avatar_url'));
    console.log('   - full_name exists:', columnNames.includes('full_name'));
    console.log('   - phone exists:', columnNames.includes('phone'));
    console.log('   - bio exists:', columnNames.includes('bio'));
    console.log('   - country exists:', columnNames.includes('country'));
    console.log('   - city exists:', columnNames.includes('city'));
    console.log('   - birth_date exists:', columnNames.includes('birth_date'));
    
    // ПОСТРОИМ ЗАПРОС БЕЗ ПРОБЛЕМНЫХ СТОЛБЦОВ
    // Основные обязательные столбцы
    let selectFields = ['id', 'email', 'username', 'role', 'balance', 'created_at'];
    
    // Добавляем только существующие дополнительные столбцы
    const additionalFields = ['avatar_url', 'full_name', 'phone', 'bio', 'country', 'city', 'birth_date'];
    additionalFields.forEach(field => {
      if (columnNames.includes(field)) {
        selectFields.push(field);
      }
    });
    
    const query = `SELECT ${selectFields.join(', ')} FROM users WHERE id = ?`;
    console.log('📝 [GET /api/auth/profile] SQL запрос:', query);
    
    const [users] = await pool.query(query, [userId]);
    
    console.log('📊 [GET /api/auth/profile] Результат запроса:', {
      found: users.length,
      user: users[0] ? {
        id: users[0].id,
        email: users[0].email,
        username: users[0].username,
        hasAllFields: users[0]
      } : 'Нет данных'
    });
    
    if (users.length === 0) {
      console.error(' [GET /api/auth/profile] Пользователь не найден в БД для userId:', userId);
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден',
        userId: userId
      });
    }
    
    console.log(' [GET /api/auth/profile] Пользователь найден:', users[0].email);
    
    // Гарантируем что все ожидаемые поля есть в ответе
    const userResponse = {
      id: users[0].id,
      email: users[0].email,
      username: users[0].username,
      role: users[0].role || 'user',
      balance: users[0].balance || 0,
      created_at: users[0].created_at,
      // Добавляем только если они есть в результате
      avatar_url: users[0].avatar_url || null,
      full_name: users[0].full_name || null,
      phone: users[0].phone || null,
      bio: users[0].bio || null,
      country: users[0].country || null,
      city: users[0].city || null,
      birth_date: users[0].birth_date || null
    };
    
    res.json({ 
      success: true, 
      user: userResponse 
    });
    
  } catch (error) {
    console.error(' [GET /api/auth/profile] Ошибка получения профиля:', error);
    console.error(' [GET /api/auth/profile] Сообщение ошибки:', error.message);
    console.error(' [GET /api/auth/profile] Stack trace:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при получении профиля',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 7. ОБНОВИТЬ ПРОФИЛЬ
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { username, full_name, phone, bio, country, city, birth_date } = req.body;
    const userId = req.user.userId;
    
    // Проверка username на уникальность (кроме текущего пользователя)
    if (username) {
      const [existingUser] = await pool.query(
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
    
    // Обновляем профиль
    const [result] = await pool.query(
      `UPDATE users SET 
        username = COALESCE(?, username),
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        bio = COALESCE(?, bio),
        country = COALESCE(?, country),
        city = COALESCE(?, city),
        birth_date = COALESCE(?, birth_date)
      WHERE id = ?`,
      [username, full_name, phone, bio, country, city, birth_date, userId]
    );
    
    // Получаем обновленного пользователя
    const [users] = await pool.query(
      `SELECT id, email, username, role, balance, 
              avatar_url, full_name, phone, bio, 
              country, city, birth_date, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Профиль обновлен',
      user: users[0]
    });
    
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// 8. ОБНОВИТЬ АВАТАР
app.post('/api/auth/profile/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    const userId = req.user.userId;
    
    if (!avatar_url) {
      return res.status(400).json({ success: false, error: 'URL аватара обязателен' });
    }
    
    await pool.query(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatar_url, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Аватар обновлен',
      avatar_url
    });
    
  } catch (error) {
    console.error('Ошибка обновления аватара:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// 9. ОБНОВИТЬ БАЛАНС
app.put('/api/auth/profile/balance', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Сумма должна быть числом' 
      });
    }
    
    // Получаем текущий баланс
    const [users] = await pool.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    const currentBalance = parseFloat(users[0].balance) || 0;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Обновляем баланс
    await pool.query(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Баланс обновлен',
      new_balance: newBalance
    });
    
  } catch (error) {
    console.error('Ошибка обновления баланса:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

// 10. Админ: получение пользователей
app.get('/api/admin/users', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, username, role, balance, created_at FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 11. Загрузка изображения для игры
app.post('/api/games/:id/upload', authenticateToken, checkRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const gameId = req.params.id;
    const imageUrl = `/uploads/games/${req.file.filename}`;

    await pool.query(
      'UPDATE products SET image_url = ? WHERE id = ?',
      [imageUrl, gameId]
    );

    res.json({
      success: true,
      message: 'Изображение загружено',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 12. Получить изображение по имени
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'games', filename);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Изображение не найдено' });
    }
  });
});

// 13. Тестовый эндпоинт для проверки файлов
app.get('/api/test-images', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const uploadsPath = path.join(__dirname, 'uploads', 'games');
  
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({
      path: uploadsPath,
      files: files,
      absolutePath: path.resolve(uploadsPath)
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      currentDir: __dirname
    });
  }
});
// ===================== АДМИН ЭНДПОИНТЫ =====================

// Админ: получение статистики (простая версия)
app.get('/api/admin/stats', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    console.log(' [admin/stats] Запрос статистики');
    
    // Общая статистика
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalGames }]] = await pool.query('SELECT COUNT(*) as totalGames FROM products');
    
    // Считаем заказы и выручку (если таблица orders есть)
    let totalOrders = 0;
    let totalRevenue = 0;
    try {
      const [[{ orderCount }]] = await pool.query('SELECT COUNT(*) as orderCount FROM orders');
      const [[{ revenue }]] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status = "completed"');
      totalOrders = orderCount;
      totalRevenue = revenue;
    } catch (e) {
      console.log(' Таблица orders не существует, используем заглушки');
      totalOrders = 42;
      totalRevenue = 125000;
    }
    
    // Активные пользователи (последние 30 дней)
    const [[{ activeUsers }]] = await pool.query(
      'SELECT COUNT(*) as activeUsers FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
    );
    
    // Новые пользователи сегодня
    const today = new Date().toISOString().split('T')[0];
    const [[{ newUsersToday }]] = await pool.query(
      'SELECT COUNT(*) as newUsersToday FROM users WHERE DATE(created_at) = ?',
      [today]
    );
    
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(totalUsers),
        totalGames: parseInt(totalGames),
        totalOrders: parseInt(totalOrders),
        totalRevenue: parseFloat(totalRevenue) || 0,
        activeUsers: parseInt(activeUsers),
        newUsersToday: parseInt(newUsersToday)
      }
    });
    
  } catch (error) {
    console.error(' Ошибка получения статистики:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

// Админ: получение всех пользователей
app.get('/api/admin/users', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    console.log(' [admin/users] Получение списка пользователей');
    
    const [users] = await pool.query(`
      SELECT id, email, username, role, balance, 
             avatar_url, full_name, phone, bio,
             country, city, birth_date, created_at, updated_at,
             COALESCE(status, 'active') as status
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        balance: parseFloat(user.balance) || 0
      }))
    });
    
  } catch (error) {
    console.error(' Ошибка получения пользователей:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

// Админ: обновление роли пользователя
app.put('/api/admin/users/:id/role', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    console.log(` [admin/users/${userId}/role] Изменение роли на: ${role}`);
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Недопустимая роль' 
      });
    }
    
    // Нельзя изменить роль суперадмина (id = 1)
    if (parseInt(userId) === 1 && role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        error: 'Нельзя изменить роль суперадмина' 
      });
    }
    
    await pool.query(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, userId]
    );
    
    console.log(` Роль пользователя ${userId} обновлена на ${role}`);
    
    res.json({
      success: true,
      message: 'Роль пользователя обновлена'
    });
    
  } catch (error) {
    console.error(' Ошибка обновления роли:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

// Админ: обновление баланса пользователя
app.put('/api/admin/users/:id/balance', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { balance } = req.body;
    
    console.log(` [admin/users/${userId}/balance] Установка баланса: ${balance}`);
    
    if (balance === undefined || isNaN(balance)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверная сумма' 
      });
    }
    
    const newBalance = parseFloat(balance);
    
    await pool.query(
      'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newBalance, userId]
    );
    
    console.log(` Баланс пользователя ${userId} обновлен: ${newBalance}`);
    
    res.json({
      success: true,
      message: 'Баланс обновлен',
      newBalance
    });
    
  } catch (error) {
    console.error(' Ошибка обновления баланса:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

// Админ: удаление пользователя
app.delete('/api/admin/users/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log(` [admin/users/${userId}] Удаление пользователя`);
    
    // Нельзя удалить суперадмина (id = 1)
    if (parseInt(userId) === 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Нельзя удалить суперадмина' 
      });
    }
    
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
    console.log(` Пользователь ${userId} удален`);
    
    res.json({
      success: true,
      message: 'Пользователь удален'
    });
    
  } catch (error) {
    console.error(' Ошибка удаления пользователя:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

// Простой эндпоинт для добавления игры
app.post('/api/admin/games', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const { title, description, price, category, image_url } = req.body;
    
    console.log(` [admin/games] Добавление игры: ${title}`);
    
    if (!title || !price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Название и цена обязательны' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO products (title, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', price, category || 'action', image_url || '']
    );
    
    console.log(` Игра добавлена, ID: ${result.insertId}`);
    
    res.json({
      success: true,
      message: 'Игра добавлена',
      gameId: result.insertId
    });
    
  } catch (error) {
    console.error(' Ошибка добавления игры:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});

// Удаление игры
app.delete('/api/admin/games/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const gameId = req.params.id;
    
    console.log(` [admin/games/${gameId}] Удаление игры`);
    
    await pool.query('DELETE FROM products WHERE id = ?', [gameId]);
    
    console.log(` Игра ${gameId} удалена`);
    
    res.json({
      success: true,
      message: 'Игра удалена'
    });
    
  } catch (error) {
    console.error(' Ошибка удаления игры:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера',
      details: error.message 
    });
  }
});
// ОБНОВЛЕНИЕ ИГРЫ 
app.put('/api/admin/games/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
  try {
    const gameId = req.params.id;
    const gameData = req.body;
    
    console.log(`🔄 [admin/games/${gameId}] Обновление игры:`, gameData);
    
    // Проверка обязательных полей
    if (!gameData.title || !gameData.price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Название и цена обязательны' 
      });
    }
    
    // Проверяем существование игры
    const [existing] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [gameId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Игра не найдена' 
      });
    }
    
    // Обновляем игру
    const [result] = await pool.query(
      `UPDATE products SET 
        title = ?, 
        description = ?, 
        price = ?, 
        discount_price = ?,
        platform = ?, 
        category = ?, 
        image_url = ?, 
        rating = ?,
        is_new = ?, 
        is_popular = ?, 
        is_on_sale = ?
       WHERE id = ?`,
      [
        gameData.title || '',
        gameData.description || '',
        parseFloat(gameData.price) || 0,
        gameData.discount_price ? parseFloat(gameData.discount_price) : null,
        gameData.platform || 'PC',
        gameData.category || 'action',
        gameData.image_url || '',
        parseFloat(gameData.rating) || 0,
        gameData.is_new ? 1 : 0,
        gameData.is_popular ? 1 : 0,
        gameData.is_on_sale ? 1 : 0,
        gameId
      ]
    );
    
    console.log(`✅ Игра ${gameId} обновлена, затронуто строк: ${result.affectedRows}`);
    
    res.json({
      success: true,
      message: 'Игра обновлена',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Ошибка обновления игры:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при обновлении игры',
      details: error.message 
    });
  }
});


// ===================== ЗАПУСК СЕРВЕРА =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`✅ API игр: http://localhost:${PORT}/api/games`);
  console.log(`✅ API профиля: http://localhost:${PORT}/api/auth/profile`);
  console.log(`✅ API документация: http://localhost:${PORT}/`);
  console.log(`✅ CORS: Разрешено для всех (режим разработки)`);
});