import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Movie } from '../../types/movie';

interface BannerSliderProps {
  movies: (Movie & { isCustom?: boolean })[];
}

const BannerSlider = ({ movies }: BannerSliderProps) => {
  const { t } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

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

  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex];
  const title = movie.title || movie.name || 'Untitled';
  const backdropUrl = movie.isCustom ? movie.backdrop_path : (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1920x1080/1a1a1a/e50914?text=No+Backdrop');
  const posterUrl = movie.isCustom ? movie.poster_path : (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster');

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallback: string) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = fallback;
  };

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
          {/* Background Image with mask */}
          <div className="absolute inset-0">
            <img 
              src={backdropUrl} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, 'https://placehold.co/1920x1080/1a1a1a/e50914?text=No+Backdrop')}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-10 lg:px-20">
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                
                {/* Left Side: Poster */}
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="hidden lg:block w-[320px] xl:w-[380px] flex-shrink-0"
                >
                  {movie.id?.toString().startsWith('http') ? (
                    <a href={movie.id.toString()} target="_blank" rel="noopener noreferrer" className="block relative group perspective-1000">
                      <img 
                        src={posterUrl} 
                        className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-primary/20 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary"
                        alt={title}
                        onError={(e) => handleImageError(e, 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster')}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[1px]">
                        <motion.div whileHover={{ scale: 1.1 }} className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.5)]">
                          <FiPlay className="fill-current text-white ml-1" size={28} />
                        </motion.div>
                      </div>
                    </a>
                  ) : (
                    <Link to={movie.isCustom ? `/movie/local_${movie.id}` : (movie.name ? `/movie/tv/${movie.id}` : `/movie/${movie.id}`)} className="block relative group perspective-1000">
                      <img 
                        src={posterUrl} 
                        className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-primary/20 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary"
                        alt={title}
                        onError={(e) => handleImageError(e, 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster')}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[1px]">
                        <motion.div whileHover={{ scale: 1.1 }} className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.5)]">
                          <FiPlay className="fill-current text-white ml-1" size={28} />
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
                      {movie.title || movie.name}
                    </h1>
                    
                    <p className="text-sm md:text-base lg:text-lg text-neutral-300 mb-8 line-clamp-2 md:line-clamp-3 drop-shadow-md max-w-2xl font-medium leading-relaxed">
                      {movie.overview}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                      <Link 
                        to={movie.isCustom ? `/movie/local_${movie.id}` : (movie.name ? `/movie/tv/${movie.id}` : `/movie/${movie.id}`)}
                        className="group flex items-center space-x-4 bg-primary text-white px-10 py-5 rounded-2xl font-black hover:bg-red-700 transition-all text-xs md:text-sm uppercase tracking-widest overflow-hidden relative"
                      >
                        <FiPlay className="fill-current relative z-10" size={24} />
                        <span className="relative z-10">{t('play_now')}</span>
                      </Link>
                      
                      <Link 
                        to={movie.isCustom ? `/movie/local_${movie.id}` : (movie.name ? `/movie/tv/${movie.id}` : `/movie/${movie.id}`)}
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

      {/* Slider Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-2xl bg-black/40 hover:bg-primary backdrop-blur-md text-white shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center group border border-white/5"
      >
        <FiChevronLeft size={32} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-30 w-14 h-14 rounded-2xl bg-black/40 hover:bg-primary backdrop-blur-md text-white shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center group border border-white/5"
      >
        <FiChevronRight size={32} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-10 left-0 w-full z-30 px-4 md:px-10 lg:px-20">
        <div className="flex items-center justify-between">
          {/* Page Counter (Bottom Left) */}
          <div className="flex items-center space-x-2 font-black text-[10px] md:text-xs tracking-widest uppercase">
            <span className="text-primary">{(currentIndex + 1).toString().padStart(2, '0')}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-white/60">{movies.length.toString().padStart(2, '0')}</span>
          </div>

          {/* Indicators (Bottom Right) */}
          <div className="flex items-center space-x-2">
            {movies.slice(0, 6).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  i === currentIndex 
                    ? 'w-10 bg-primary shadow-[0_0_20px_rgba(229,9,20,0.6)]' 
                    : 'w-3 bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(BannerSlider);
