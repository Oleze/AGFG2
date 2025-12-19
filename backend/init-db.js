const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  let connection;
  
  try {
    // Подключаемся к серверу (без указания БД)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    
    console.log(' Подключено к MySQL серверу');
    
    // Создаём базу данных если не существует
    await connection.query('CREATE DATABASE IF NOT EXISTS allgames_db');
    console.log(' База данных allgames_db создана или уже существует');
    
    // Переключаемся на созданную БД
    await connection.query('USE allgames_db');
    
    // Создаём таблицы
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        role ENUM('guest', 'user', 'seller', 'editor', 'admin') DEFAULT 'user',
        avatar_url VARCHAR(500),
        balance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2),
        platform VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(500),
        rating DECIMAL(3, 2) DEFAULT 0,
        rating_count INT DEFAULT 0,
        is_new BOOLEAN DEFAULT TRUE,
        is_popular BOOLEAN DEFAULT FALSE,
        is_on_sale BOOLEAN DEFAULT FALSE,
        seller_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'paid', 'completed', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        quantity INT DEFAULT 1,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )`
    ];
    
    // Создаём таблицы по очереди
    for (let i = 0; i < tables.length; i++) {
      await connection.query(tables[i]);
      console.log(` Таблица ${i + 1} создана/проверена`);
    }
    
    console.log(' Все таблицы созданы!');
    
    // Добавляем тестового админа (с хешированным паролем)
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await connection.query(
      `INSERT INTO users (email, password, username, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE password = ?`,
      [adminEmail, hashedPassword, 'Администратор', 'admin', hashedPassword]
    );
    
    console.log(' Тестовый администратор создан/обновлён');
    console.log(' Email:', adminEmail);
    console.log(' Пароль:', adminPassword);
    
    // Добавляем тестовые игры
    const testGames = [
  {
    title: "Cyberpunk 2077",
    description: "Ролевая игра в открытом мире будущего",
    price: 2999.00,
    discount_price: 2499.00,
    platform: "PC/PS5/Xbox",
    category: "RPG",
    image_url: "/uploads/games/cyberpunk.jpg", // Путь к локальному файлу
    rating: 4.7,
    rating_count: 1500,
    is_new: true,
    is_popular: true,
    is_on_sale: true
  },
      {
        title: "Elden Ring",
        description: "Фэнтезийная action-RPG с открытым миром",
        price: 3499.00,
        platform: "PC/PS5/Xbox",
        category: "Action",
        image_url: "https://example.com/elden.jpg",
        is_new: false,
        is_popular: true
      },
      {
        title: "Call of Duty: Modern Warfare 3",
        description: "Шутер от первого лица",
        price: 1999.00,
        platform: "PC/PS5/Xbox",
        category: "Shooter",
        image_url: "https://example.com/cod.jpg",
        is_on_sale: true,
        discount_price: 1499.00
      }
    ];
    
    for (const game of testGames) {
      await connection.query(
        'INSERT IGNORE INTO products SET ?',
        game
      );
    }
    
    console.log(' Тестовые игры добавлены');
    
  } catch (error) {
    console.error(' Ошибка при инициализации БД:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log(' Соединение закрыто');
    }
  }
}

// Запускаем инициализацию
initDatabase().then(() => {
  console.log(' Инициализация БД завершена успешно!');
  console.log(' Теперь у тебя есть:');
  console.log('   - База данных allgames_db');
  console.log('   - Таблицы: users, products, orders, order_items');
  console.log('   - Админ: admin@test.com / admin123');
  console.log('   - Тестовые игры в каталоге');
});