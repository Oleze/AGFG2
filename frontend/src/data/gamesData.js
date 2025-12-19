// frontend/src/data/gamesData.js
import { api } from '../services/api';

// Локальные данные для fallback
export const localGames = [
  {
    id: 1,
    name: "Cyberpunk 2077: Phantom Liberty",
    title: "Cyberpunk 2077: Phantom Liberty",
    price: 2999,
    discount_price: 2499,
    is_on_sale: true,
    platform: "PC/PS5/Xbox",
    category: "RPG",
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop",
    rating: 4.7,
    is_new: true,
    is_popular: true
  },
  // ... другие игры если нужно
];

// Функция для преобразования данных игры
const transformGameData = (game) => {
  const isNew = game.is_new === 1 || game.is_new === true || game.isNew === true;
  const isPopular = game.is_popular === 1 || game.is_popular === true || game.isPopular === true;
  const isOnSale = game.is_on_sale === 1 || game.is_on_sale === true || game.discount === true;
  
  return {
    ...game,
    // Оригинальные поля из БД (с нормализацией)
    is_new: Boolean(isNew),
    is_popular: Boolean(isPopular),
    is_on_sale: Boolean(isOnSale),
    discount_price: game.discount_price || game.discountPrice,
    
    // Для обратной совместимости с компонентами
    isNew: Boolean(isNew),
    isPopular: Boolean(isPopular),
    discount: Boolean(isOnSale),
    discountPrice: game.discount_price || game.discountPrice,
    
    // Унифицированные названия
    name: game.name || game.title || '',
    title: game.title || game.name || '',
    
    // Изображение
    image: game.image || game.image_url,
    image_url: game.image_url || game.image
  };
};

// Основная функция для получения игр
export const getGames = async () => {
  try {
    console.log('🔄 Загружаем игры с сервера...');
    const serverGames = await api.getGames();
    
    if (serverGames && serverGames.length > 0) {
      console.log(`✅ Получено ${serverGames.length} игр с сервера`);
      
      // Преобразуем данные с сервера
      const transformedGames = serverGames.map(transformGameData);
      
      // Отладка
      console.log('🎮 Пример преобразованной игры:', {
        title: transformedGames[0]?.title,
        is_new: transformedGames[0]?.is_new,
        is_popular: transformedGames[0]?.is_popular,
        is_on_sale: transformedGames[0]?.is_on_sale,
        category: transformedGames[0]?.category
      });
      
      return transformedGames;
    } else {
      console.log('⚠️ Сервер вернул пустой массив, используем локальные');
      // Преобразуем локальные данные
      return localGames.map(transformGameData);
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки с сервера, используем локальные:', error.message);
    // Преобразуем локальные данные
    return localGames.map(transformGameData);
  }
};

// Для обратной совместимости
export const games = localGames;