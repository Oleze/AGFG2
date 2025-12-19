const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Параметры подключения (как в консоли)
const config = {
  host: 'localhost',
  user: 'root',       // как в mysql -u root
  password: '',       // как в -p (пустой если без пароля)
  multipleStatements: true // разрешаем несколько SQL команд
};

console.log(' Инициализация MariaDB для All Games For Gamers\n');

const connection = mysql.createConnection(config);

connection.connect(async (err) => {
  if (err) {
    console.error(' Ошибка подключения:', err.message);
    console.log('\n Подсказка:');
    console.log('Попробуй подключиться вручную: mysql -u root -p');
    console.log('Если работает — проверь параметры в config выше');
    process.exit(1);
  }

  console.log(' Подключено к серверу MariaDB');
  
  // 1. Создаём базу данных
  console.log('\n Создаю базу данных...');
  await query('CREATE DATABASE IF NOT EXISTS allgames_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  
  // 2. Используем её
  await query('USE allgames_db');
  console.log(' База данных allgames_db готова');
  
  // 3. Создаём таблицы
  console.log('\n  Создаю таблицы...');
  
  const tablesSQL = `
    -- Пользователи
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(100) NOT NULL,
      role ENUM('user', 'seller', 'editor', 'admin') DEFAULT 'user',
      avatar_url VARCHAR(500),
      balance DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Игры
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      discount_price DECIMAL(10, 2),
      platform VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image_url VARCHAR(500),
      rating DECIMAL(3, 2) DEFAULT 0.00,
      rating_count INT DEFAULT 0,
      is_new BOOLEAN DEFAULT TRUE,
      is_popular BOOLEAN DEFAULT FALSE,
      is_on_sale BOOLEAN DEFAULT FALSE,
      seller_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Заказы
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Элементы заказов
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT DEFAULT 1,
      price_at_purchase DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Новости
    CREATE TABLE IF NOT EXISTS news (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id INT,
      category VARCHAR(100),
      image_url VARCHAR(500),
      views INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  await query(tablesSQL);
  console.log(' Все таблицы созданы');
  
  // 4. Добавляем тестовые данные
  console.log('\n Добавляю тестовых пользователей...');
  
  // Хешируем пароли
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);
  
  // Добавляем пользователей
  await query(`
    INSERT IGNORE INTO users (email, password, username, role) VALUES
    ('admin@test.com', ?, 'Администратор', 'admin'),
    ('user@test.com', ?, 'Обычный игрок', 'user')
  `, [adminHash, userHash]);
  
  console.log(' Тестовые пользователи добавлены');
  console.log('    admin@test.com / admin123');
  console.log('    user@test.com / user123');
  
    // 5. Добавляем тестовые игры (без проблемной)
  console.log('\n🎮 Добавляю тестовые игры...');
  
  await query(`
    INSERT IGNORE INTO products 
    (title, price, discount_price, platform, category, image_url, rating, is_new, is_popular, is_on_sale) VALUES
    ('Cyberpunk 2077', 2999.00, 2499.00, 'PC/PS5/Xbox', 'RPG', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f', 4.7, 1, 1, 1),
    ('Elden Ring', 3499.00, NULL, 'PC/PS5/Xbox', 'Action RPG', 'https://images.unsplash.com/photo-1511512578047-dfb367046420', 4.9, 1, 1, 0),
    ('Call of Duty: MW3', 1999.00, 1499.00, 'PC/PS5/Xbox', 'Шутер', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f', 4.3, 0, 1, 1),
    ('Starfield', 2999.00, 1999.00, 'PC/Xbox', 'RPG', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f', 4.5, 1, 1, 1)
  `);
  
  console.log(' 5 тестовых игр добавлены');
  
  // 6. Завершаем
  console.log('\n========================================');
  console.log(' БАЗА ДАННЫХ УСПЕШНО ИНИЦИАЛИЗИРОВАНА!');
  console.log('========================================');
  console.log('\n Информация:');
  console.log('   База: allgames_db');
  console.log('   Хост: localhost');
  console.log('   Пользователь: root');
  console.log('\n Запусти сервер: npm run dev');
  console.log(' API будет доступен на http://localhost:5000');
  
  connection.end();
  process.exit(0);
});

// Вспомогательная функция для запросов
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error(' Ошибка SQL:', err.message);
        console.error('   Запрос:', sql.substring(0, 100) + '...');
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}