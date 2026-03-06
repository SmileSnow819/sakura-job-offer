import React, { useState } from 'react';
import { Sparkles, Compass, PenTool, ExternalLink, Hash, Share2, Check } from 'lucide-react';
import bookmarkData from './bookmarks.json';

// 图标映射
const IconMap = {
  Compass: <Compass size={20} />,
  PenTool: <PenTool size={20} />,
};

// 获取网站的 Favicon 作为图标
const getFavicon = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch (e) {
    return 'https://www.google.com/s2/favicons?sz=64&domain=example.com';
  }
};

const SakuraPetals = () => {
  // 生成飘落的樱花花瓣
  const petals = Array.from({ length: 25 }).map((_, i) => {
    const left = Math.random() * 100;
    const animationDuration = 5 + Math.random() * 10;
    const animationDelay = Math.random() * 5;
    const size = 10 + Math.random() * 15;
    const opacity = 0.3 + Math.random() * 0.5;

    return (
      <div
        key={i}
        className="absolute pointer-events-none rounded-tl-full rounded-br-full rounded-tr-sm rounded-bl-sm"
        style={{
          left: `${left}%`,
          top: '-20px',
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#ffb7c5',
          opacity: opacity,
          boxShadow: '0 0 10px rgba(255, 183, 197, 0.5)',
          animation: `fall ${animationDuration}s linear infinite`,
          animationDelay: `-${animationDelay}s`,
          transform: 'rotate(45deg)',
        }}
      />
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0);
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(50px);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .text-brown { color: #5D4037; }
        .hover-pink:hover { color: #FF6B9E; }
        .border-pink-hover:hover { border-color: #FFB7C5; box-shadow: 0 10px 25px -5px rgba(255, 183, 197, 0.4); transform: translateY(-2px); }
        
        /* 隐藏滚动条但保留功能 */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {petals}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(bookmarkData.categories[0].id);
  const [toast, setToast] = useState(null);

  const activeCategory = bookmarkData.categories.find(c => c.id === activeTab);

  const handleShare = (e, url) => {
    e.preventDefault();
    e.stopPropagation();

    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      setToast('链接复制成功啦！(ﾉ>ω<)ﾉ');
    } catch (err) {
      setToast('复制失败了 QAQ');
    }
    
    document.body.removeChild(textArea);

    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f5] via-[#e6f2ff] to-[#ffe6f0] font-sans selection:bg-[#ffb7c5] selection:text-white relative overflow-hidden">
      <SakuraPetals />

      <div className="w-full px-4 md:px-8 flex flex-col md:flex-row gap-6 relative z-10 h-screen py-4 md:py-8">
        
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#FFB7C5] to-[#a1c4fd] rounded-full flex items-center justify-center mb-4 shadow-inner text-white animate-[float_4s_ease-in-out_infinite]">
              <Sparkles size={28} />
            </div>
            <h1 className="text-lg font-bold text-brown mb-1 tracking-wide">sakura-offer-hub</h1>
            <p className="text-xs text-[#8D6E63] font-medium opacity-80">Anime Job Hub</p>
          </div>

          <nav className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
            {bookmarkData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap md:whitespace-normal font-medium ${
                  activeTab === category.id
                    ? 'bg-gradient-to-r from-[#ffe6f0] to-white text-[#FF6B9E] shadow-sm border border-[#ffb7c5]/50'
                    : 'text-brown hover:bg-white/60 hover-pink'
                }`}
              >
                <span className={`${activeTab === category.id ? 'text-[#FF6B9E]' : 'opacity-70'}`}>
                  {IconMap[category.icon]}
                </span>
                {category.name}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto hide-scrollbar flex flex-col">
          <header className="mb-8 flex items-center gap-3">
            <Hash size={24} className="text-[#FFB7C5]" />
            <h2 className="text-2xl font-bold text-brown">
              {activeCategory?.name}
            </h2>
            <div className="ml-auto text-sm text-[#8D6E63] bg-white/50 px-4 py-1.5 rounded-full border border-white/80">
              共 {activeCategory?.links.length} 个书签
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {activeCategory?.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/80 transition-all duration-300 border-pink-hover relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-gradient-to-br from-[#ffe6f0] to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden group-hover:scale-110 transition-transform duration-300">
                    <img 
                      src={getFavicon(link.url)} 
                      alt="icon" 
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMWM0ZmQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PGxpbmUgeDE9IjIiIHkxPSIxMiIgeDI9IjIyIiB5Mj0iMTIiPjwvbGluZT48cGF0aCBkPSJNMTIgMmExNS4zIDE1LjMgMCAwIDEgNCAxMGExNS4zIDE1LjMgMCAwIDEtNCAxMCAxNS4zIDE1LjMgMCAwIDEtNC0xMCAxNS4zIDE1LjMgMCAwIDEgNC0xMHoiPjwvcGF0aD48L3N2Zz4=';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-brown hover-pink truncate transition-colors duration-300">
                      {link.title}
                    </h3>
                    <p className="text-xs text-[#A1887F] truncate mt-1 opacity-80">
                      {new URL(link.url).hostname.replace('www.', '')}
                    </p>
                  </div>
                  <div 
                    onClick={(e) => handleShare(e, link.url)}
                    className="p-2 -mr-2 text-[#D7CCC8] hover:text-[#FFB7C5] transition-colors flex-shrink-0 relative z-20 rounded-full hover:bg-[#ffe6f0]"
                    title="复制链接分享"
                  >
                    <Share2 size={16} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </main>

      </div>

      {toast && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-[#ffb7c5] text-[#FF6B9E] px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(255,183,197,0.4)] flex items-center gap-2 z-50 transition-all">
          <Check size={18} strokeWidth={3} />
          <span className="font-bold tracking-wide text-sm">{toast}</span>
        </div>
      )}
    </div>
  );
}
