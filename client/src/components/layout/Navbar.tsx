import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiMenu, FiX, FiSearch, FiChevronDown, FiSun, FiMoon, FiUser, FiHeart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Avatar from '../common/Avatar';

interface NavLink {
  name: string;
  path?: string;
  type?: 'dropdown';
  items?: string[];
  protected?: boolean;
}

const Navbar = () => {
  const { user, logout, theme, toggleTheme, lang, toggleLang, t } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsHovered, setIsSuggestionsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 1) {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/movies/search?query=${searchQuery}`);
          setSuggestions(res.data.results.slice(0, 5));
        } catch (error) {
          console.error(error);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setSuggestions([]);
      setSearchQuery('');
    }
  };

  const genres = [
    t('genre_action'), t('genre_historical'), t('genre_war'), t('genre_scifi'), 
    t('genre_horror'), t('genre_comedy'), t('genre_animation'), t('genre_drama')
  ];
  const countries = [
    t('country_china'), t('country_korea'), t('country_japan'), t('country_usa'), 
    t('country_thailand'), t('country_western')
  ];

  const navLinks: NavLink[] = [
    { name: t('home'), path: '/' },
    { name: t('genres'), type: 'dropdown', items: genres },
    { name: t('countries'), type: 'dropdown', items: countries },
    { name: t('movies'), path: `/search?q=${t('movies')}&type=movie` },
    { name: t('series'), path: `/search?q=${t('series')}&type=tv` },
    { name: t('favorites'), path: '/favorites', protected: true },
  ];

  return (
    <nav className={`fixed top-0 w-full h-[70px] z-[1000] transition-all duration-300 flex items-center px-4 md:px-10 border-b ${
      isScrolled 
        ? `${theme === 'dark' ? 'bg-[#0a0a0a]/95 border-zinc-800 shadow-xl backdrop-blur-md' : 'bg-white/95 border-gray-200 shadow-md backdrop-blur-md'}` 
        : `${theme === 'dark' ? 'bg-[#0a0a0a]/90 border-transparent' : 'bg-white border-transparent shadow-sm'}`
    }`}>
      {/* 1. Logo Section */}
      <div className="flex-shrink-0">
        <Link to="/" className="group flex items-center">
          <h1 className="text-2xl font-[1000] tracking-tighter">
            <span className="text-primary">MOVIE</span>
            <span className={`${theme === 'dark' ? 'text-white' : 'text-dark'}`}>ZONE</span>
          </h1>
        </Link>
      </div>

      {/* 2. Main Menu */}
      <div className="hidden lg:flex items-center ml-12 space-x-7 text-[13px] font-black uppercase tracking-wider">
        {navLinks.map((link) => (
          (!link.protected || user) && (
            <div key={link.name} className="relative group" onMouseEnter={() => link.type === 'dropdown' && setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
              {link.type === 'dropdown' ? (
                <button className={`flex items-center space-x-1.5 transition-colors py-2 whitespace-nowrap ${
                  theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-primary'
                }`}>
                  <span>{link.name}</span>
                  <FiChevronDown className={`transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} size={14} />
                </button>
              ) : (
                <Link 
                  to={link.path || '#'} 
                  className={`relative transition-all py-1 whitespace-nowrap ${
                    location.pathname === link.path 
                      ? 'text-primary border-b-2 border-primary' 
                      : `${theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-primary'}`
                  }`}
                >
                  {link.name}
                </Link>
              )}
              
              {link.type === 'dropdown' && (
                <AnimatePresence>
                  {activeDropdown === link.name && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }} 
                      className={`absolute top-full left-0 mt-1 w-56 p-3 grid grid-cols-2 gap-1.5 rounded-xl shadow-2xl border ${
                        theme === 'dark' ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-100'
                      }`}
                    >
                      {link.items?.map(item => (
                        <Link 
                          key={item} 
                          to={`/search?q=${item}`} 
                          onClick={() => setActiveDropdown(null)}
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all hover:text-primary ${
                            theme === 'dark' ? 'text-white hover:bg-white/5' : 'text-dark hover:bg-gray-50'
                          }`}
                        >
                          {item}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          )
        ))}
      </div>

      {/* 3. Right Section */}
      <div className="flex-1 flex items-center justify-end space-x-5">
        
        {/* Search Bar */}
        <div className="relative flex items-center group">
          <form onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                rounded-full py-1.5 pl-4 pr-10 outline-none transition-all duration-500 ease-in-out font-bold text-sm
                w-[180px] hover:w-[200px] focus:w-[280px] xl:focus:w-[300px]
                ${theme === 'dark' 
                  ? 'bg-zinc-900/60 border border-zinc-700 text-white placeholder:text-zinc-600 focus:border-primary focus:bg-zinc-900 focus:shadow-[0_0_20px_rgba(220,38,38,0.2)]' 
                  : 'bg-gray-100 border border-gray-200 text-dark placeholder:text-gray-400 focus:border-primary focus:bg-white focus:shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                }
              `}
            />
            <FiSearch className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${
              theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
            } group-focus-within:text-primary`} size={16} />
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  width: isSuggestionsHovered ? (window.innerWidth >= 1280 ? 400 : 350) : (window.innerWidth >= 1280 ? 300 : 280)
                }} 
                exit={{ opacity: 0, y: 10, scale: 0.98 }} 
                onMouseEnter={() => setIsSuggestionsHovered(true)}
                onMouseLeave={() => setIsSuggestionsHovered(false)}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`absolute top-full mt-4 right-0 border rounded-2xl shadow-2xl overflow-hidden z-[120] transition-shadow duration-300 hover:shadow-primary/20 ${
                  theme === 'dark' ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-white border-gray-100'
                }`}
              >
                <div className="p-2 space-y-0.5">
                  {suggestions.map(movie => (
                    <Link 
                      key={movie.id} 
                      to={`/movie/${movie.id}`} 
                      onClick={() => {
                        setSuggestions([]);
                        setSearchQuery('');
                      }} 
                      className={`flex items-center space-x-4 p-2.5 rounded-xl transition-all group/item ${
                        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex-shrink-0 overflow-hidden rounded-lg shadow-lg w-10 h-14">
                        <img 
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://placehold.co/92x138/1a1a1a/e50914?text=No+Poster'} 
                          className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" 
                          alt={movie.title} 
                        />
                      </div>
                      <div className="flex-grow">
                        <p className={`text-[13px] font-bold group-hover/item:text-primary transition-colors line-clamp-1 mb-0.5 ${
                          theme === 'dark' ? 'text-white' : 'text-dark'
                        }`}>{movie.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold ${
                            theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'
                          }`}>{movie.release_date?.split('-')[0]}</span>
                          <span className="w-1 h-1 rounded-full bg-neutral-600" />
                          <span className="text-[11px] font-black text-primary">{movie.vote_average?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {/* Explore More Item */}
                  <Link 
                    to={`/search?q=${searchQuery}`}
                    onClick={() => {
                      setSuggestions([]);
                      setSearchQuery('');
                    }}
                    className={`flex items-center justify-center p-3 mt-1 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                      theme === 'dark' 
                        ? 'bg-white/5 text-zinc-400 hover:bg-primary hover:text-white' 
                        : 'bg-gray-50 text-gray-500 hover:bg-primary hover:text-white'
                    }`}
                  >
                     <span>{t('explore_more')}</span>
                   </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme & Language Controls */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme} 
            className={`p-2 transition-all rounded-full hover:scale-110 ${
              theme === 'dark' ? 'text-yellow-500 hover:bg-zinc-800' : 'text-blue-600 hover:bg-gray-100'
            }`}
          >
            {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          <button 
            onClick={toggleLang}
            className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${
              theme === 'dark' ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {lang === 'vi' ? 'VN | ' : 'US | '}
            <span className={theme === 'dark' ? 'text-white' : 'text-primary'}>
              {lang === 'vi' ? 'VI' : 'EN'}
            </span>
          </button>
        </div>

        {/* User Profile Area */}
        {user ? (
          <div className="relative user-menu-container">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden p-0.5 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                  <Avatar 
                    src={user.avatar} 
                    alt={user.username}
                    size={40}
                    className="w-full h-full rounded-full object-cover" 
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              </div>
              <div className="hidden xl:flex items-center space-x-2">
                <div className="text-left leading-tight">
                  <p className={`text-[9px] font-bold uppercase opacity-50 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{t('welcome')}</p>
                  <p className={`text-[13px] font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{user.username}</p>
                </div>
                <FiChevronDown 
                  className={`transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''} ${
                    theme === 'dark' ? 'text-white/50 group-hover:text-white' : 'text-dark/50 group-hover:text-dark'
                  }`} 
                  size={16} 
                />
              </div>
            </div>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-2 w-52 border rounded-xl shadow-2xl overflow-hidden z-[120] ${
                    theme === 'dark' ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="p-2 space-y-1">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition group ${
                        theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-dark hover:bg-gray-50'
                      }`}
                    >
                      <FiUser size={18} className="group-hover:text-primary transition-colors" />
                      <span>{t('profile')}</span>
                    </Link>
                    <Link 
                      to="/favorites" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition group ${
                        theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-dark hover:bg-gray-50'
                      }`}
                    >
                      <FiHeart size={18} className="group-hover:text-primary transition-colors" />
                      <span>{t('favorites')}</span>
                    </Link>
                    <div className={`h-[1px] my-1 mx-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}></div>
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold text-red-500 transition ${
                        theme === 'dark' ? 'hover:bg-red-600/10' : 'hover:bg-red-50'
                      }`}
                    >
                      <FiLogOut size={18} />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className={`text-[12px] font-bold hover:text-primary transition-colors ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{t('login')}</Link>
            <Link to="/register" className="bg-primary text-white px-5 py-1.5 rounded-full text-[12px] font-bold hover:bg-red-700 transition-all shadow-lg shadow-primary/20">{t('register')}</Link>
          </div>
        )}
      </div>

      <button className="lg:hidden text-white ml-4" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <FiMenu size={24} className={theme === 'dark' ? 'text-white' : 'text-dark'} />
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="lg:hidden fixed inset-0 bg-white dark:bg-dark z-[1100] p-6 overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-10">
              <span className="text-2xl font-black text-primary">MOVIEZONE</span>
              <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/5 text-yellow-500' : 'bg-gray-100 text-blue-600'}`}>{theme === 'dark' ? <FiSun size={24} /> : <FiMoon size={24} />}</button>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-dark dark:text-white"><FiX size={32} /></button>
              </div>
            </div>
            <div className="space-y-6">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {link.type === 'dropdown' ? (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{link.name}</p>
                      <div className="grid grid-cols-2 gap-4">
                        {link.items?.map(item => (
                          <Link key={item} to={`/search?q=${item}`} onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-neutral-600 dark:text-neutral-300">{item}</Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (!link.protected || user) && (
                      <Link to={link.path || '#'} onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold block text-dark dark:text-white">{link.name}</Link>
                    )
                  )}
                </div>
              ))}
              <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5"></div>
              {user ? (
                <button onClick={handleLogout} className="text-primary text-xl font-bold">{t('logout')}</button>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-primary text-xl font-bold block">{t('login')}</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
