import React from 'react';
import { news } from '../data/newsData'; // Теперь правильный импорт

const NewsPage = () => {
  return (
    <div className="news-page">
      <div className="page-header">
        <h1 className="page-title">НОВОСТИ ИГРОВОГО МИРА</h1>
        <p className="page-subtitle">Самые свежие анонсы, обзоры и события</p>
      </div>
      
      <div className="news-grid">
        {news.map(item => (
          <div key={item.id} className="news-card panel">
            <div className="news-header">
              <span className="news-category">{item.category}</span>
              <span className="news-date">{item.date}</span>
            </div>
            <h3 className="news-title">{item.title}</h3>
            <p className="news-preview">{item.preview}</p>
            <a href="#" className="news-read-more">Читать полностью →</a>
          </div>
        ))}
      </div>
      
      <div className="news-sidebar">
        <h3 className="sidebar-title">ТОП ТЕМЫ</h3>
        <ul className="topics-list">
          <li className="topic-item">• Итоги Game Awards 2024</li>
          <li className="topic-item">• NVIDIA RTX 5000: первое тестирование</li>
          <li className="topic-item">• PlayStation Plus обновил каталог</li>
        </ul>
      </div>
    </div>
  );
};

export default NewsPage;