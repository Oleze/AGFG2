import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import './App.css';

// Импортируем страницы
import CatalogPage from './pages/CatalogPage';
import PopularPage from './pages/PopularPage';
import SalesPage from './pages/SalesPage';
import NewsPage from './pages/NewsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import AdminPage from './pages/admin/AdminPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';

// Импортируем store
import { useCartStore, useAuthStore } from './store/store';

// Компонент ProtectedRoute
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Header компонент
const Header = () => {
  const location = useLocation();
  const { items } = useCartStore();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [balance, setBalance] = useState(0);

  // Загружаем пользователя и баланс
  useEffect(() => {
    if (user) {
      setBalance(user.balance || 0);
    }
    
    const handleUserChange = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setBalance(userData.balance || 0);
      } else {
        setBalance(0);
      }
    };
    
    window.addEventListener('userChanged', handleUserChange);
    return () => window.removeEventListener('userChanged', handleUserChange);
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = isMenuOpen ? '' : 'hidden';
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const menuItems = [
    { path: '/', label: 'ГЛАВНАЯ' },
    { path: '/catalog', label: 'КАТАЛОГ ИГР' },
    { path: '/popular', label: 'ПОПУЛЯРНЫЕ' },
    { path: '/sales', label: 'РАСПРОДАЖИ' },
    { path: '/news', label: 'НОВОСТИ' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/admin', label: 'АДМИНКА' });
  }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="header">
        <div className="burger-menu" onClick={toggleMenu}>
          <div className={`burger-icon ${isMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <Link to="/" className="logo">ALL GAMES FOR GAMERS</Link>
        
        <div className="auth-buttons">
          <Link to="/cart" className="cart-icon">
            <i className="fas fa-shopping-cart"></i>
            <span className="cart-count">{cartCount}</span>
          </Link>
          
          {user ? (
            <div className="user-info">
              <div className="balance">
                <i className="fas fa-coins"></i>
                <span className="balance-amount">{balance.toLocaleString()} ₽</span>
              </div>
              <div className="user-profile">
                <Link to="/profile" className="profile-btn">
                  <i className="fas fa-user-circle"></i>
                  <span className="username">{user.username || user.email.split('@')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="logout-btn">
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="auth-btn login-btn">ВХОД</Link>
              <Link to="/register" className="auth-btn register-btn">РЕГИСТРАЦИЯ</Link>
            </>
          )}
        </div>
      </header>

      {/* Голографическое меню */}
      <div className={`holo-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="holo-grid"></div>
        <div className="holo-scanline"></div>
        
        <div className="holo-menu-items">
          {menuItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`holo-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={toggleMenu}
            >
              <span className="holo-menu-item-text">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="holo-auth-buttons">
          {user ? (
            <div className="holo-user-info">
              <div className="holo-balance">
                <i className="fas fa-coins"></i>
                <span>Баланс: {balance.toLocaleString()} ₽</span>
              </div>
              <div className="holo-user-profile">
                <span className="holo-username">
                  <i className="fas fa-user"></i> {user.username || user.email}
                </span>
                {user.role === 'admin' && (
                  <span className="holo-admin-badge">👑 Админ</span>
                )}
                <button onClick={() => { handleLogout(); toggleMenu(); }} className="holo-logout-btn">
                  <i className="fas fa-sign-out-alt"></i> Выйти
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="holo-auth-btn holo-login-btn" onClick={toggleMenu}>ВХОД</Link>
              <Link to="/register" className="holo-auth-btn holo-register-btn" onClick={toggleMenu}>РЕГИСТРАЦИЯ</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Главный App компонент
function App() {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);

  // Курсор
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursorRef.current && cursorDotRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
        cursorDotRef.current.style.left = e.clientX + 'px';
        cursorDotRef.current.style.top = e.clientY + 'px';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Скролл хедера
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 50);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Router>
      <div className="App">
        <div className="custom-cursor" ref={cursorRef}></div>
        <div className="cursor-dot" ref={cursorDotRef}></div>
        
        <Header />
        
        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/popular" element={<PopularPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Защищенные маршруты */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            <Route path="/order-success" element={
              <div className="page" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div className="success-icon" style={{ fontSize: '80px', color: '#0fce7c' }}>
                  ✅
                </div>
                <h1>ЗАКАЗ УСПЕШНО ОФОРМЛЕН!</h1>
                <p style={{ fontSize: '18px', margin: '20px 0' }}>
                  Ваш заказ принят в обработку. Игры будут доступны в вашей библиотеке.
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
                  <Link to="/" className="auth-btn">
                    На главную
                  </Link>
                  <Link to="/catalog" className="auth-btn register-btn">
                    Продолжить покупки
                  </Link>
                </div>
              </div>
            } />
            
            {/* Запасной маршрут */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          
          <footer className="footer">
            <p>© 2024 ALL GAMES FOR GAMERS. Все права защищены.</p>
            <p>Игровая платформа нового поколения</p>
          </footer>
        </main>
      </div>
    </Router>
  );
}

export default App;