import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiExternalLink, FiUser, FiShield, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { toast } from 'react-toastify';

const AdminNavbar = () => {
  const { user, logout, theme, lang, toggleTheme, toggleLang, t } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info(t('logout_admin_success'));
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
      theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-100'
    } backdrop-blur-xl`}>
      <div className="container mx-auto px-4 md:px-10 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/admin" className="flex items-center space-x-2">
            <FiShield className="text-primary" size={24} />
            <span className="text-xl font-black tracking-tighter uppercase">
              Admin<span className="text-primary">Zone</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t('system_online')}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Controls */}
          <div className="hidden sm:flex items-center space-x-2 border-r border-white/10 pr-6 mr-2">
            <button 
              onClick={toggleLang}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all ${
                theme === 'dark' ? 'bg-white/5 text-neutral-400 hover:bg-white/10' : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
              }`}
            >
              {lang}
            </button>
            <button 
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                theme === 'dark' ? 'bg-white/5 text-yellow-500 hover:bg-white/10' : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
              }`}
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:block text-right">
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{user?.username}</p>
              <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">{t('admin_role')}</p>
            </div>
            <Avatar src={user?.avatar} size={40} className="border-2 border-primary" />
          </div>

          <div className="flex items-center space-x-2">
            <Link 
              to="/" 
              target="_blank"
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-neutral-400 hover:text-white group"
              title={t('preview_site')}
            >
              <FiExternalLink size={18} className="group-hover:scale-110 transition-transform" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
              title={t('logout')}
            >
              <FiLogOut size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;