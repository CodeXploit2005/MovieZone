import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiLogOut, FiMenu, FiX, FiSearch, 
  FiChevronDown, FiSun, FiMoon, FiUser, FiHeart 
} from 'react-icons/fi';
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
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
      setIsMobileMenuOpen(false);
    }
  };

  const genres = [
    t('genre_action'), t('genre_historical'), t('genre_war'), t('genre_scifi'), 
    t('genre_horror'), t('genre_comedy'), t('genre_anime'), t('genre_drama')
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
    <nav className={`fixed top-0 left-0 right-0 w-full h-[70px] z-50 transition-all duration-300 flex items-center justify-between px-4 md:px-10 border-b ${
      isScrolled 
        ? `${theme === 'dark' ? 'bg-[#0a0a0a]/95 border-zinc-800 shadow-xl backdrop-blur-md' : 'bg-white/95 border-gray-200 shadow-md backdrop-blur-md'}` 
        : `${theme === 'dark' ? 'bg-[#0a0a0a]/90 border-transparent' : 'bg-white border-transparent shadow-sm'}`
    }`}>
      <Link to="/" className="group flex items-center">
        <h1 className="text-2xl font-[1000] tracking-tighter">
          <span className="text-primary">MOVIE</span>
          <span className={`${theme === 'dark' ? 'text-white' : 'text-dark'}`}>ZONE</span>
        </h1>
      </Link>

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

      <div className="flex-1 flex items-center justify-end space-x-2 md:space-x-5">
        <div className="relative hidden md:flex items-center group">
          <form onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`rounded-full py-1.5 pl-4 pr-10 outline-none transition-all duration-500 ease-in-out font-bold text-sm w-[120px] lg:w-[180px] hover:w-[200px] focus:w-[250px] xl:focus:w-[300px] ${
                theme === 'dark' 
                  ? 'bg-zinc-900/60 border border-zinc-700 text-white placeholder:text-zinc-600 focus:border-primary focus:bg-zinc-900 focus:shadow-[0_0_20px_rgba(220,38,38,0.3)]' 
                  : 'bg-gray-100 border border-gray-200 text-dark placeholder:text-gray-400 focus:border-primary focus:bg-white focus:shadow-[0_0_15px_rgba(220,38,38,0.1)]'
              }`}
            />
            <FiSearch className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300 ${
              theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'
            } group-focus-within:text-primary`} size={16} />
          </form>
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.98 }} 
                className={`absolute top-full mt-4 right-0 border rounded-2xl shadow-2xl overflow-hidden z-[60] transition-shadow duration-500 hover:shadow-primary/20 ${
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
                      className={`flex items-center space-x-4 p-2.5 rounded-xl transition-all ${
                        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex-shrink-0 overflow-hidden rounded-xl shadow-lg w-10 h-14">
                        <img 
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://placehold.co/92x138/1a1a1a/e50914?text=No+Poster'} 
                          className="w-full h-full object-cover" 
                          alt={movie.title} 
                        />
                      </div>
                      <div className="flex-grow">
                        <p className={`text-[11px] font-bold line-clamp-1 mb-0.5 ${
                          theme === 'dark' ? 'text-white' : 'text-dark'
                        }`}>{movie.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-semibold ${
                            theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'
                          }`}>{movie.release_date?.split('-')[0]}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center space-x-2">
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
            {lang === 'vi' ? 'VN | VI' : 'US | EN'}
          </button>
        </div>

        {user ? (
          <div className="relative user-menu-container">
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden p-0.5 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Avatar 
                  src={user.avatar} 
                  alt={user.username}
                  size={40}
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
            </div>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-2 w-56 border rounded-xl shadow-2xl overflow-hidden z-[60] ${
                    theme === 'dark' ? 'bg-[#121212] border-zinc-800' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="p-2 space-y-1">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition ${
                        theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-dark hover:bg-gray-50'
                      }`}
                    >
                      <FiUser size={18} />
                      <span>{t('profile')}</span>
                    </Link>
                    <Link 
                      to="/favorites" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-bold transition ${
                        theme === 'dark' ? 'text-zinc-300 hover:bg-zinc-800' : 'text-dark hover:bg-gray-50'
                      }`}
                    >
                      <FiHeart size={18} />
                      <span>{t('favorites')}</span>
                    </Link>
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
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/login" className={`text-[10px] md:text-[12px] font-bold hover:text-primary transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-dark'
            }`}>{t('login')}</Link>
            <Link to="/register" className="bg-primary text-white px-3 md:px-5 py-1.5 rounded-full text-[10px] md:text-[12px] font-bold hover:bg-red-700 transition-all shadow-lg shadow-primary/20">{t('register')}</Link>
          </div>
        )}

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className={`lg:hidden p-3 rounded-full transition-all hover:scale-110 ${
            theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-dark'
          }`}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`lg:hidden fixed top-0 left-0 w-full h-full z-[1000] p-6 overflow-y-auto transition-colors ${
              theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-10">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center">
                <h1 className="text-2xl font-[1000] tracking-tighter">
                  <span className="text-primary">MOVIE</span>
                  <span className={`${theme === 'dark' ? 'text-white' : 'text-dark'}`}>ZONE</span>
                </h1>
              </Link>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleTheme} 
                  className={`p-3 rounded-full transition-all hover:scale-110 ${
                    theme === 'dark' ? 'bg-white/10 text-yellow-500' : 'bg-gray-100 text-blue-600'
                  }`}
                >
                  {theme === 'dark' ? <FiSun size={24} /> : <FiMoon size={24} />}
                </button>
                <button 
                  onClick={toggleLang}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                    theme === 'dark' ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-white text-primary border border-gray-200'
                  }`}
                >
                  {lang === 'vi' ? 'VI' : 'EN'}
                </button>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className={`p-3 rounded-full transition-all hover:bg-white/10 ${
                    theme === 'dark' ? 'text-white' : 'text-dark'
                  }`}
                >
                  <FiX size={28} />
                </button>
              </div>
            </div>

            <div className="mb-8 relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-2xl py-4 pl-5 pr-12 outline-none font-bold text-sm ${
                    theme === 'dark' ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-dark'
                  }`}
                />
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              </form>
            </div>

            <div className="space-y-6">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {link.type === 'dropdown' ? (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{link.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {link.items?.map(item => (
                          <Link key={item} to={`/search?q=${item}`} onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-bold p-3 rounded-xl transition-colors ${
                            theme === 'dark' ? 'bg-white/5 text-neutral-300' : 'bg-gray-50 text-neutral-600'
                          }`}>{item}</Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (!link.protected || user) && (
                      <Link to={link.path || '#'} onClick={() => setIsMobileMenuOpen(false)} className={`text-xl font-bold block ${
                        theme === 'dark' ? 'text-white' : 'text-dark'
                      }`}>{link.name}</Link>
                    )
                  )}
                </div>
              ))}
              <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}></div>
              {user ? (
                <div className="space-y-4">
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`text-xl font-bold block ${
                    theme === 'dark' ? 'text-white' : 'text-dark'
                  }`}>{t('profile')}</Link>
                  <button onClick={handleLogout} className="text-primary text-xl font-bold">{t('logout')}</button>
                </div>
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
