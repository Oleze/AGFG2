const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // оставь пустым если без пароля
  database: 'mysql' // пробуем подключиться к системной БД
});

connection.connect((err) => {
  if (err) {
    console.error(' Ошибка подключения:', err.message);
    console.log('\n Возможные решения:');
    console.log('1. Запущен ли MySQL сервер?');
    console.log('2. Пользователь root существует?');
    console.log('3. Пароль правильный?');
    console.log('\n Попробуй подключиться вручную:');
    console.log('   mysql -u root -p');
    return;
  }
  
  console.log(' Подключение к MariaDB успешно!');
  
  // Покажи доступные базы данных
  connection.query('SHOW DATABASES', (err, results) => {
    if (err) {
      console.error('Ошибка запроса:', err.message);
    } else {
      console.log('\n Доступные базы данных:');
      results.forEach(row => console.log('  -', row.Database));
    }
    connection.end();
  });
});