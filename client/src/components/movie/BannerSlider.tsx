import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiChevronLeft, FiChevronRight, FiPlay, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Movie } from '../../types';

interface BannerSliderProps {
  movies: Movie[];
}

const BannerSlider = ({ movies }: BannerSliderProps) => {
  const { theme, t } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(nextSlide, 7000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const currentMovie = movies[currentIndex];
  if (!currentMovie) return null;

  const imagePath = currentMovie.backdrop_path || currentMovie.poster_path;
  const imageUrl = imagePath 
    ? `https://image.tmdb.org/t/p/original${imagePath}` 
    : 'https://placehold.co/1920x1080/111111/e50914?text=No+Image';

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="w-full flex-shrink-0 relative h-[500px] lg:h-[600px] xl:h-[700px]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src={imageUrl}
              alt={currentMovie.title || currentMovie.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
              resetTimer();
            }}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-110"
          >
            <FiChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
              resetTimer();
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-110"
          >
            <FiChevronRight size={24} />
          </button>

          <div className="relative z-10 h-full flex flex-col justify-center px-10 lg:px-20 max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/30">
                {t('trending_now')}
              </span>
              {currentMovie.vote_average && (
                <div className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800">
                  <span className="text-yellow-400 text-lg md:text-xl">★</span>
                  <span className="text-white font-bold text-sm md:text-base">
                    {currentMovie.vote_average.toFixed(1)}
                  </span>
                  <span className="text-zinc-400 text-xs md:text-sm">
                    {currentMovie.release_date?.split('-')[0] || 
                     currentMovie.first_air_date?.split('-')[0] || ''}
                  </span>
                </div>
              )}
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 md:mb-6 leading-tight drop-shadow-2xl">
              {currentMovie.title || currentMovie.name}
            </h2>

            <p className="text-sm md:text-lg text-zinc-300 mb-6 md:mb-10 line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-lg">
              {currentMovie.overview}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-5">
              <Link 
                to={`/movie/${currentMovie.id}`}
                className="flex items-center gap-2 md:gap-3 bg-primary text-white px-6 md:px-10 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-red-700 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95"
              >
                <FiPlay size={isMobile ? 18 : 24} className="fill-current" />
                {t('watch_now')}
              </Link>

              <Link 
                to={`/movie/${currentMovie.id}`}
                className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-md text-white px-6 md:px-10 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg border border-white/20 hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <FiInfo size={isMobile ? 18 : 24} />
                {t('details')}
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-5 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2 md:gap-3">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              resetTimer();
            }}
            className={`transition-all rounded-full ${
              index === currentIndex 
                ? 'w-8 md:w-10 h-2 md:h-3 bg-primary' 
                : 'w-2 md:w-3 h-2 md:h-3 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
