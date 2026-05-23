import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiPlay } from 'react-icons/fi';

const MovieCard = ({ movie, onTrailerClick }) => {
  const title = movie.title || movie.name || 'Untitled';
  const releaseDate = movie.release_date || movie.first_air_date || '';
  
  const imageUrl = movie.isLocal
    ? movie.poster_path
    : (movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster');

  const handleTrailerClick = (e) => {
    if (onTrailerClick) {
      e.preventDefault();
      e.stopPropagation();
      onTrailerClick(movie);
    }
  };

  return (
    <motion.div
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="relative flex-shrink-0 w-full rounded-lg overflow-hidden shadow-lg group cursor-pointer dark:bg-[#1a1a1a] bg-white border dark:border-white/5 border-gray-100"
    >
      <Link to={movie.isLocal ? `/movie/local_${movie.id}` : (movie.name ? `/movie/tv/${movie.id}` : `/movie/${movie.id}`)}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster';
            }}
          />
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3">
            <button 
              onClick={handleTrailerClick}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300 hover:scale-110 active:scale-95 shadow-xl shadow-primary/40 border-none outline-none"
            >
              <FiPlay className="fill-current text-white ml-1" size={20} />
            </button>
          </div>

          {/* Mọt Phim Style Labels */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            <span className="bg-[#ff9800] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md uppercase">
              HD
            </span>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md uppercase">
              {movie.name ? 'Series' : 'Vietsub'}
            </span>
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
            <FiStar className="fill-current" />
            <span>{movie.vote_average ? movie.vote_average.toFixed(1) : '0.0'}</span>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-3">
          <h3 className="text-sm font-bold dark:text-neutral-200 text-dark line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-[11px] dark:text-neutral-500 text-gray-500 mt-1 flex justify-between items-center">
            <span>{releaseDate?.split('-')[0] || 'N/A'}</span>
            <span className="dark:text-neutral-400 text-gray-400">HD 4K</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default memo(MovieCard);
