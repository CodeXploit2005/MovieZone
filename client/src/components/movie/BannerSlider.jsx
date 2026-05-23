import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlay, FiInfo, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const BannerSlider = ({ movies }) => {
  const { theme, t } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  }, [movies.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  }, [movies.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex];
  const title = movie.title || movie.name || 'Untitled';
  const backdropUrl = movie.isCustom ? movie.backdrop_path : (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1920x1080/1a1a1a/e50914?text=No+Backdrop');
  const posterUrl = movie.isCustom ? movie.poster_path : (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster');

  return (
    <div className="relative h-[85vh] md:h-screen w-full overflow-hidden bg-black">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image with sophisticated mask */}
          <div className="absolute inset-0">
            <img 
              src={backdropUrl} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/1920x1080/1a1a1a/e50914?text=No+Backdrop';
              }}
            />
            {/* Darker, more cinematic overlays */}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
          </div>

          {/* Cinematic Split Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-10 lg:px-20">
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                
                {/* Left Side: Poster (Hidden on Mobile) */}
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="hidden lg:block w-[320px] xl:w-[380px] flex-shrink-0"
                >
                  {movie.id?.toString().startsWith('http') ? (
                    <a href={movie.id} target="_blank" rel="noopener noreferrer" className="block relative group perspective-1000">
                      <img 
                        src={posterUrl} 
                        className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary/50"
                        alt={title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[2px]">
                        <motion.div whileHover={{ scale: 1.1 }} className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                          <FiPlay className="fill-current text-white ml-1" size={32} />
                        </motion.div>
                      </div>
                    </a>
                  ) : (
                    <Link to={movie.isCustom ? `/movie/local_${movie.id}` : (movie.name ? `/movie/tv/${movie.id}` : `/movie/${movie.id}`)} className="block relative group perspective-1000">
                      <img 
                        src={posterUrl} 
                        className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary/50"
                        alt={title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[2px]">
                        <motion.div whileHover={{ scale: 1.1 }} className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                          <FiPlay className="fill-current text-white ml-1" size={32} />
                        </motion.div>
                      </div>
                    </Link>
                  )}
                </motion.div>

                {/* Right Side: Info */}
                <div className="flex-grow max-w-4xl text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                      <span className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                        {t('featured_movie')}
                      </span>
                      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <span className="text-yellow-500 font-black text-xs">★ {movie.vote_average?.toFixed(1)}</span>
                        <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">| {movie.release_date?.split('-')[0]}</span>
                      </div>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black drop-shadow-2xl leading-[1.1] tracking-tighter uppercase text-white">
                      {movie.title}
                    </h1>
                    
                    <p className="text-sm md:text-base lg:text-lg text-neutral-300 mb-8 line-clamp-2 md:line-clamp-3 drop-shadow-md max-w-2xl font-medium leading-relaxed">
                      {movie.overview}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                      {movie.id?.toString().startsWith('http') ? (
                        <a 
                          href={movie.id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center space-x-4 bg-primary text-white px-10 py-5 rounded-2xl font-black hover:bg-red-700 transition-all text-xs md:text-sm uppercase tracking-widest overflow-hidden relative"
                        >
                          <FiPlay className="fill-current relative z-10" size={24} />
                          <span className="relative z-10">{t('play_now')}</span>
                        </a>
                      ) : (
                        <Link 
                          to={movie.isCustom ? `/movie/local_${movie.id}` : `/movie/${movie.id}`}
                          className="group flex items-center space-x-4 bg-primary text-white px-10 py-5 rounded-2xl font-black hover:bg-red-700 transition-all text-xs md:text-sm uppercase tracking-widest overflow-hidden relative"
                        >
                          <FiPlay className="fill-current relative z-10" size={24} />
                          <span className="relative z-10">{t('play_now')}</span>
                        </Link>
                      )}
                      
                      <Link 
                        to={movie.isCustom ? `/movie/local_${movie.id}` : `/movie/${movie.id}`}
                        className="flex items-center space-x-4 bg-white/5 text-white px-10 py-5 rounded-2xl font-black hover:bg-white/10 transition-all backdrop-blur-xl border border-white/10 text-xs md:text-sm uppercase tracking-widest"
                      >
                        <FiInfo size={24} />
                        <span>{t('details')}</span>
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Moved to Sides */}
      <div className="absolute inset-y-0 left-4 md:left-10 flex items-center z-30">
        <button 
          onClick={prevSlide}
          className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-black/20 hover:bg-primary text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/5 hover:border-primary group"
        >
          <FiChevronLeft size={30} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-4 md:right-10 flex items-center z-30">
        <button 
          onClick={nextSlide}
          className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-black/20 hover:bg-primary text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/5 hover:border-primary group"
        >
          <FiChevronRight size={30} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Bottom Indicators */}
      <div className="absolute inset-x-0 bottom-10 px-4 md:px-20 lg:px-32 flex items-center justify-between z-20">
        <div className="hidden md:block text-white/50 font-black tracking-[0.3em] text-[10px] uppercase">
          <span className="text-primary">{String(currentIndex + 1).padStart(2, '0')}</span> 
          <span className="mx-2">/</span> 
          {String(movies.length).padStart(2, '0')}
        </div>
        <div className="flex space-x-3">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex ? 'w-12 bg-primary' : 'w-3 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(BannerSlider);
