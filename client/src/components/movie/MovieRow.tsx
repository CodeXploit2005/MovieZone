import { useRef, useState, useEffect, useCallback } from 'react';
import MovieCard from './MovieCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Movie } from '../../types/movie';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onLoadMore?: () => void;
}

const MovieRow = ({ title, movies, onLoadMore }: MovieRowProps) => {
  const { theme } = useAuth();
  const rowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle scroll event for infinite scroll on touch/mobile
  const handleScroll = useCallback(() => {
    if (!rowRef.current || !onLoadMore) return;
    
    const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
    
    // If we're near the end, load more
    if (scrollLeft + clientWidth >= scrollWidth - 500) {
      onLoadMore();
    }
  }, [onLoadMore]);

  const slide = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
      
      // Calculate next scroll position
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      
      // Infinite scroll logic: if sliding right and near the end, load more
      if (direction === 'right' && scrollLeft + clientWidth >= scrollWidth - 500 && onLoadMore) {
        onLoadMore();
      }

      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const currentRef = rowRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  if (!movies || movies.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="flex items-end justify-between mb-6 md:mb-8 px-4 md:px-16 lg:px-32">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-1.5 h-6 md:h-8 bg-primary rounded-full"></div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tighter dark:text-white text-dark">
            {title}
          </h2>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <button 
            onClick={() => slide('left')}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all active:scale-90 ${theme === 'dark' ? 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-dark hover:bg-gray-100'}`}
          >
            <FiChevronLeft size={24} />
          </button>
          <button 
            onClick={() => slide('right')}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all active:scale-90 ${theme === 'dark' ? 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-dark hover:bg-gray-100'}`}
          >
            <FiChevronRight size={24} />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={rowRef}
          className="flex space-x-4 md:space-x-6 lg:space-x-8 overflow-x-auto no-scrollbar px-4 md:px-16 lg:px-32 pb-8 md:pb-10 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            setIsDragging(true);
            setStartX(e.pageX - (rowRef.current?.offsetLeft || 0));
            setScrollLeft(rowRef.current?.scrollLeft || 0);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (!isDragging || !rowRef.current) return;
            e.preventDefault();
            const x = e.pageX - (rowRef.current.offsetLeft || 0);
            const walk = (x - startX) * 2;
            rowRef.current.scrollLeft = scrollLeft - walk;
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            setStartX(e.touches[0].pageX - (rowRef.current?.offsetLeft || 0));
            setScrollLeft(rowRef.current?.scrollLeft || 0);
          }}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={(e) => {
            if (!isDragging || !rowRef.current) return;
            const x = e.touches[0].pageX - (rowRef.current.offsetLeft || 0);
            const walk = (x - startX) * 2;
            rowRef.current.scrollLeft = scrollLeft - walk;
          }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="w-[140px] sm:w-[160px] md:w-[200px] lg:w-[240px] flex-shrink-0">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
        
        {/* Subtle Edge Gradients - Always visible on mobile, hover on desktop */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r dark:from-[#0a0a0a] from-[#f8f9fa] to-transparent pointer-events-none z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l dark:from-[#0a0a0a] from-[#f8f9fa] to-transparent pointer-events-none z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </motion.div>
  );
};

export default MovieRow;
