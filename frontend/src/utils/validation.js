// Валидация форм
export const validateLogin = (email, password) => {
  const errors = {};

  // Валидация email
  if (!email) {
    errors.email = 'Email обязателен';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Некорректный email';
  }

  // Валидация пароля
  if (!password) {
    errors.password = 'Пароль обязателен';
  } else if (password.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegister = (email, password, username) => {
  const errors = {};

  // Валидация email
  if (!email) {
    errors.email = 'Email обязателен';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Некорректный email';
  }

  // Валидация пароля
  if (!password) {
    errors.password = 'Пароль обязателен';
  } else if (password.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.password = 'Пароль должен содержать буквы в верхнем и нижнем регистре и цифры';
  }

  // Валидация имени пользователя
  if (!username) {
    errors.username = 'Имя пользователя обязательно';
  } else if (username.length < 3) {
    errors.username = 'Имя должно быть не менее 3 символов';
  } else if (username.length > 20) {
    errors.username = 'Имя должно быть не более 20 символов';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Валидация игры (для админки)
export const validateGame = (gameData) => {
  const errors = {};

  if (!gameData.title || gameData.title.trim() === '') {
    errors.title = 'Название обязательно';
  }

  if (!gameData.price || isNaN(gameData.price) || gameData.price <= 0) {
    errors.price = 'Цена должна быть положительным числом';
  }

  if (!gameData.platform || gameData.platform.trim() === '') {
    errors.platform = 'Платформа обязательна';
  }

  if (!gameData.category || gameData.category.trim() === '') {
    errors.category = 'Категория обязательна';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};