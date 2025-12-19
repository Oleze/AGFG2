import { useEffect, useState, useRef } from 'react';
import "../App.css";
import { getGames } from '../data/gamesData'; // Импортируем функцию загрузки игр
import GameCard from '../components/GameCard'; // Импортируем компонент GameCard

const HomePage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Загрузка игр при монтировании компонента
  useEffect(() => {
    async function loadGames() {
      try {
        console.log(' Загрузка игр для главной страницы...');
        const gamesData = await getGames();
        console.log(' Игры загружены:', gamesData);
        setGames(gamesData);
      } catch (error) {
        console.error(' Ошибка загрузки игр:', error);
        setGames([]); // Пустой массив при ошибке
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  // Эффект для курсора (оставляем как было)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current && cursorDotRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top = `${e.clientY}px`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // toggleMenu функция (оставляем как было)
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        fontSize: '20px'
      }}>
        Загрузка игр...
      </div>
    );
  }

  return (
    <>
      {/* Ваш контент главной страницы без Header и HoloMenu */}
      <div className="content">
        <div className="bg"></div>
        
        <section className="text-section">
          <h1>ALL GAMES FOR GAMERS</h1>
          <p>Крупнейший маркетплейс игр, внутриигровой валюты и эксклюзивных предметов.</p>
        </section>
        
        <div className="panels-container">
          <section className="panel">
            <h2>ЦИФРОВЫЕ ИГРЫ</h2>
            <p>Более 10,000 игр для всех платформ.</p>
          </section>
          {/* ... остальные панели ... */}
        </div>

        <section className="games-section">
          <h2>ПОПУЛЯРНЫЕ ИГРЫ</h2>
          <div className="games-container">
            {games.length > 0 ? (
              games.slice(0, 6).map(game => ( // Показываем только первые 6 игр
                <GameCard key={game.id} game={game} /> // Используем компонент GameCard
              ))
            ) : (
              <div className="no-games">
                <p>Игры временно недоступны</p>
                <button 
                  className="auth-btn" 
                  onClick={() => window.location.reload()}
                >
                  Обновить
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;