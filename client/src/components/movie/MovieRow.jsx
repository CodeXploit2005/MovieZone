import { useRef } from 'react';
import MovieCard from './MovieCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const MovieRow = ({ title, movies, onLoadMore }) => {
  const { theme } = useAuth();
  const rowRef = useRef(null);

  const slide = (direction) => {
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

  if (!movies || movies.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="flex items-end justify-between mb-8 px-4 md:px-16 lg:px-32">
        <div className="flex items-center space-x-4">
          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter dark:text-white text-dark">
            {title}
          </h2>
        </div>
        <div className="hidden md:flex items-center space-x-3">
          <button 
            onClick={() => slide('left')}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${theme === 'dark' ? 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-dark hover:bg-gray-100'}`}
          >
            <FiChevronLeft size={20} />
          </button>
          <button 
            onClick={() => slide('right')}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-90 ${theme === 'dark' ? 'border-white/10 text-neutral-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-dark hover:bg-gray-100'}`}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={rowRef}
          className="flex space-x-6 md:space-x-8 overflow-x-auto no-scrollbar px-4 md:px-16 lg:px-32 pb-10"
        >
          {movies.map((movie) => (
            <div key={movie.id} className="w-[180px] md:w-[240px] flex-shrink-0">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
        
        {/* Subtle Edge Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r dark:from-[#0a0a0a] from-[#f8f9fa] to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l dark:from-[#0a0a0a] from-[#f8f9fa] to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block"></div>
      </div>
    </motion.div>
  );
};

export default MovieRow;
