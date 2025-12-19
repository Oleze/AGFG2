// Валидация данных игры
const validateGame = (gameData) => {
  const errors = [];
  
  if (!gameData.title || gameData.title.trim() === '') {
    errors.push('Название обязательно');
  }
  
  if (!gameData.price || isNaN(gameData.price) || gameData.price <= 0) {
    errors.push('Цена должна быть положительным числом');
  }
  
  if (!gameData.platform || gameData.platform.trim() === '') {
    errors.push('Платформа обязательна');
  }
  
  return errors;
};

// В роуте создания игры
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const gameData = req.body;
    
    // Валидация
    const validationErrors = validateGame(gameData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        errors: validationErrors 
      });
    }
    
    // ... остальной код создания игры
  } catch (error) {
    console.error('Ошибка создания игры:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера' 
    });
  }
});