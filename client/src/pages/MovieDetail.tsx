import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import movieService from '../services/movieService';
import commentService from '../services/commentService';
import favoriteService from '../services/favoriteService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { 
  FiStar, FiPlay, FiPlus,
  FiCheck, FiAlertCircle,
  FiShare2, FiX,
  FiMessageSquare, FiThumbsUp, FiCornerDownRight, FiSend, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/common/Avatar';

import { Movie } from '../types/movie';
import { IComment } from '../types/comment';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, theme, t, lang, setIsModalOpen, formatMsg } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [trailer, setTrailer] = useState<{ key: string } | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const [replyingTo, setReplyTo] = useState<string | null>(null); // commentId
  const [replyToUser, setReplyToUser] = useState<string | null>(null); // username
  const [replyContent, setReplyContent] = useState('');

  const communityRating = useMemo(() => {
    if (comments.length === 0) return movie?.vote_average || 0;
    const total = comments.reduce((acc, c) => acc + (c.rating || 0), 0);
    return (total / comments.length) * 2; 
  }, [comments, movie]);

  const fetchMovieData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      const isTV = window.location.pathname.includes('/movie/tv/');
      
      const [movieData, commentsData] = await Promise.all([
        movieService.getMovieById(id as string, apiLang, isTV ? 'tv' : 'movie'),
        commentService.getComments(id as string).catch(() => [])
      ]);

      // Normalize TV data to match Movie structure for UI
      const normalizedMovie = {
        ...movieData,
        title: movieData.title || movieData.name,
        release_date: movieData.release_date || movieData.first_air_date,
        runtime: movieData.runtime || (movieData.episode_run_time ? movieData.episode_run_time[0] : null)
      };

      setMovie(normalizedMovie);
      setComments(commentsData || []);

      // Improved YouTube ID extraction
      const extractYoutubeId = (url: string | null) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };

      if (movieData.trailerUrl) {
        const youtubeId = extractYoutubeId(movieData.trailerUrl);
        if (youtubeId) {
          setTrailer({ key: youtubeId });
        } else if (movieData.isLocal) {
          setTrailer(null);
        }
      } 
      
      // Fallback to TMDB videos if no custom trailer or if it's a TMDB movie
      if (!movieData.isLocal || (movieData.isLocal && !movieData.trailerUrl)) {
        const youtubeTrailer = movieData.videos?.results?.find(
          (vid: any) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
        );
        if (youtubeTrailer) setTrailer(youtubeTrailer);
      }

      if (user?.token) {
        favoriteService.getFavorites(user.token).then(data => {
          setIsFavorite(data?.some((f: any) => f.movieId === id.toString()));
        }).catch(() => {});

        // Add to watch history
        userService.addToWatchHistory(user.token, {
          movieId: id,
          title: movieData.title,
          posterPath: movieData.posterPath || movieData.poster_path
        }).catch(err => console.error('Error updating watch history:', err));
      }
    } catch (err) {
      setError(t('movie_data_error'));
    } finally {
      setLoading(false);
    }
  }, [id, user, lang, t]);

  useEffect(() => {
    fetchMovieData();
  }, [fetchMovieData]);

  useEffect(() => {
    if (showVideo) {
      setIsModalOpen(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsModalOpen(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      setIsModalOpen(false);
      document.body.style.overflow = 'unset';
    };
  }, [showVideo, setIsModalOpen]);

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: movie?.title,
        text: movie?.overview,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(t('copied_link'));
    }
  };

  const toggleFavorite = async () => {
    if (!user || !movie || !id) {
      toast.info(t('login_required_fav'));
      if (!user) navigate('/login');
      return;
    }
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(user.token, id as string);
        setIsFavorite(false);
        toast.success(formatMsg(t('fav_removed')));
      } else {
        await favoriteService.addFavorite(user.token, { 
          movieId: id as string, 
          movieTitle: movie.title || '', 
          posterPath: movie.poster_path || '', 
          releaseDate: movie.release_date || '', 
          voteAverage: movie.vote_average || 0 
        });
        setIsFavorite(true);
        toast.success(formatMsg(t('fav_added')));
      }
    } catch (e: any) {
      toast.error(formatMsg(e.response?.data?.message || t('fav_error')));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast.info(t('login_required_comm'));
      navigate('/login');
      return;
    }
    try {
      const data = await commentService.addComment(user.token, { 
        movieId: id as string, 
        content: newComment, 
        rating 
      });
      setComments([data, ...comments]);
      setNewComment('');
      toast.success(t('comment_posted'));
    } catch (e) { toast.error(t('comment_error')); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('confirm_withdraw_comment')) || !user?.token) return;
    try {
      await commentService.deleteComment(user.token, commentId);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success(t('comment_withdrawn'));
    } catch (e) { toast.error(t('delete_error')); }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm(t('confirm_delete_reply')) || !user?.token) return;
    try {
      await commentService.deleteReply(user.token, commentId, replyId);
      setComments(comments.map(c => {
        if (c._id === commentId) {
          return { ...c, replies: c.replies.filter((r: any) => r._id !== replyId) };
        }
        return c;
      }));
      toast.success(t('reply_deleted'));
    } catch (e) { toast.error(t('delete_error')); }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return navigate('/login');
    try {
      const data = await commentService.likeComment(user.token, commentId);
      setComments(comments.map(c => c._id === commentId ? { ...c, likes: data.likes } : c));
    } catch (e) { toast.error(t('fav_error')); }
  };

  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!user) return navigate('/login');
    try {
      const data = await commentService.likeReply(user.token, commentId, replyId);
      setComments(comments.map(c => {
        if (c._id === commentId) {
          const updatedReplies = c.replies.map((r: any) => 
            r._id === replyId ? { ...r, likes: data.likes } : r
          );
          return { ...c, replies: updatedReplies };
        }
        return c;
      }));
    } catch (e) { toast.error(t('fav_error')); }
  };

  const handleReplySubmit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!replyContent.trim()) return;
    try {
      const data = await commentService.addReply(user.token, commentId, { 
        content: replyContent, 
        replyToUser 
      });
      setComments(comments.map(c => c._id === commentId ? data : c));
      setReplyContent('');
      setReplyTo(null);
      setReplyToUser(null);
      toast.success(t('reply_posted'));
    } catch (e) { toast.error(t('comment_error')); }
  };

  const handleReport = async (commentId: string) => {
    if (!user) return navigate('/login');
    const reason = window.prompt(lang === 'vi' ? 'Lý do báo cáo vi phạm?' : 'Reason for reporting?');
    if (!reason) return;
    try {
      await commentService.reportComment(user.token, commentId, reason);
      toast.success(formatMsg(t('reported_success')));
    } catch (e: any) { 
      toast.error(formatMsg(e.response?.data?.message || t('fav_error'))); 
    }
  };

  const movieInfoItems = useMemo(() => {
    if (!movie) return [];
    return [
      { 
        label: t('runtime'), 
        value: movie.isLocal ? movie.runtime : `${movie.runtime} ${t('minutes')}` 
      },
      { label: t('release_date'), value: movie.release_date?.split('-')[0] },
      { label: t('countries'), value: movie.production_countries?.[0]?.name || 'N/A' },
      { label: t('genres'), value: movie.genres?.[0]?.name }
    ];
  }, [movie, t]);

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-primary font-black uppercase tracking-widest animate-pulse">{t('loading')}</div>;
  if (error || !movie) return <div className="min-h-screen bg-dark flex items-center justify-center text-white font-bold">{t('movie_not_found')}</div>;

  return (
    <div className={`transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-black'} pb-32`}>
      <AnimatePresence>
        {showVideo && trailer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 md:p-10">
            <button onClick={() => setShowVideo(false)} className="absolute top-6 right-6 text-white hover:text-primary transition-all z-[10010]"><FiX size={40} /></button>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <iframe src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`} className="w-full h-full" allowFullScreen title="Trailer"></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-[50vh] md:h-[80vh] w-full overflow-hidden">
        <img 
          src={movie.isLocal ? movie.backdrop_path : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
          className="w-full h-full object-cover opacity-60" 
          alt="backdrop" 
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-[#0a0a0a]' : 'from-[#f8f9fa]'} via-transparent to-transparent`} />
      </div>

      <div className="container mx-auto px-4 md:px-10 lg:px-20 -mt-32 md:-mt-64 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-[350px] flex-shrink-0 space-y-8">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
              <img 
                src={movie.isLocal ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                className="w-full" 
                alt="poster" 
              />
              <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-2 py-1 rounded uppercase">HD 4K</div>
            </motion.div>
            
            <button onClick={() => trailer ? setShowVideo(true) : toast.info(t('no_trailer'))} className="w-full bg-primary hover:bg-red-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center space-x-4"><FiPlay className="fill-current" size={24} /><span>{t('play_now')}</span></button>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={toggleFavorite} 
                className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 flex items-center justify-center space-x-2 border overflow-hidden group/fav w-full hover:scale-105 active:scale-95 ${
                  isFavorite 
                    ? 'bg-white text-black border-white shadow-xl shadow-white/10' 
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 transition-transform duration-300 group-hover/fav:scale-110">
                  {isFavorite ? <FiCheck size={18} /> : <FiPlus size={18} />}
                  <span className="whitespace-nowrap">{isFavorite ? t('saved_fav') : t('save_fav')}</span>
                </div>
              </button>
              <button 
                onClick={handleShare} 
                className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center space-x-2 hover:scale-105 active:scale-95 shadow-xl hover:shadow-white/5"
              >
                <FiShare2 size={18} />
                <span>{t('share')}</span>
              </button>
            </div>

            <div className={`p-8 rounded-[2rem] border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 text-neutral-400' : 'bg-white border-gray-200 text-gray-600 shadow-lg'} space-y-4 text-xs font-bold uppercase tracking-widest`}>
              <div className="flex justify-between items-center"><FiStar className="text-yellow-500" /> <span className={`${theme === 'dark' ? 'text-white' : 'text-dark'} text-lg font-black`}>{communityRating.toFixed(1)}</span></div>
              <div className={`h-[1px] ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`} />
              <div className="flex justify-between items-center">{t('views')}: <span className={theme === 'dark' ? 'text-white' : 'text-dark'}>{movie.isLocal ? (movie.views || 0).toLocaleString() : ((movie.popularity || 0) * 10).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="flex-grow space-y-12">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h1 className={`text-4xl md:text-7xl font-black leading-tight tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{movie.title}</h1>
              <p className="text-primary font-black italic text-xl uppercase">{movie.tagline}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {movieInfoItems.map((item, i) => (
                  <div key={i} className={`p-4 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <p className="text-[8px] text-neutral-500 font-black mb-1 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</p>
                    <p className={`text-xs font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-dark'} whitespace-nowrap overflow-hidden text-ellipsis`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p className={`text-lg leading-relaxed font-medium p-8 rounded-3xl border transition-colors ${theme === 'dark' ? 'text-neutral-300 bg-white/5 border-white/5' : 'text-gray-700 bg-white border-gray-200 shadow-sm'}`}>{movie.overview}</p>
            </motion.div>

            <div className="space-y-12 p-6 md:p-12 rounded-[2.5rem] border transition-all duration-300 shadow-2xl relative overflow-hidden group w-full max-w-7xl mx-auto">
              <div className={`absolute inset-0 transition-opacity duration-300 ${theme === 'dark' ? 'bg-black/40' : 'bg-white'}`} />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 border-b border-white/5 pb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-1.5 h-8 bg-primary rounded-full flex-shrink-0" />
                  <h3 className={`text-xl md:text-3xl font-black uppercase tracking-tighter whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
                    {t('community_rating')}
                  </h3>
                  <span className="text-primary/30 font-black tracking-widest text-base md:text-xl">/ {comments.length}</span>
                </div>
                
                <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
                  <div className="flex space-x-0.5">
                    {[1,2,3,4,5].map(s => (
                      <FiStar key={s} size={14} className={(communityRating || 0)/2 >= s ? 'text-yellow-500 fill-current' : 'text-neutral-800'} />
                    ))}
                  </div>
                  <span className="font-black text-lg text-yellow-500">{communityRating.toFixed(1)}</span>
                </div>
              </div>
              
              {user ? (
                <form onSubmit={handleCommentSubmit} className="space-y-8 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center space-x-6 bg-gray-100 dark:bg-black/40 p-4 rounded-2xl w-fit border border-gray-200 dark:border-white/5 shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{t('feeling')}</span>
                      <div className="flex space-x-3">
                        {[1,2,3,4,5].map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            onClick={() => setRating(s)} 
                            className={`transition-all hover:scale-125 ${rating >= s ? 'text-yellow-500' : 'text-neutral-700'}`}
                          >
                            <FiStar size={24} className={rating >= s ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group/input">
                    <textarea 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      placeholder={t('your_thought')} 
                      className={`w-full border rounded-[2rem] p-8 text-lg outline-none transition-all min-h-[150px] font-medium leading-relaxed ${theme === 'dark' ? 'bg-black/60 border-white/10 text-white focus:border-primary placeholder:text-neutral-700' : 'bg-white border-gray-200 text-dark focus:border-primary placeholder:text-gray-300 shadow-2xl'}`} 
                      required 
                    />
                    <div className="absolute bottom-6 right-8">
                      <button 
                        type="submit" 
                        className="group flex items-center space-x-3 bg-primary text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl"
                      >
                        <span className="relative z-10">{t('send_rating')}</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center p-12 bg-black/20 rounded-[2.5rem] border border-white/5 backdrop-blur-md relative z-10">
                  <FiMessageSquare size={48} className="mx-auto mb-6 text-neutral-700" />
                  <Link to="/login" className="inline-block bg-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl">
                    {t('login_required_comm')}
                  </Link>
                </div>
              )}
              
              <div className="relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {comments.map((c, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }} 
                        key={c._id} 
                        className={`flex flex-col gap-4 p-6 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-100 shadow-md'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <Avatar 
                              src={c.user?.avatar} 
                              alt={c.user?.username} 
                              size={44} 
                              className="rounded-xl border border-primary/10" 
                            />
                            <div>
                              <h4 className={`font-black text-sm uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{c.user?.username}</h4>
                              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 bg-yellow-500/10 px-3 py-1 rounded-xl border border-yellow-500/20">
                            <FiStar size={10} className="text-yellow-500 fill-current" />
                            <span className="text-yellow-500 font-black text-xs">{c.rating}</span>
                          </div>
                        </div>
                        <p className={`text-[13px] leading-relaxed font-medium min-h-[40px] ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{c.content}</p>
                        
                        <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                          <div className="flex items-center gap-8">
                            <button 
                              onClick={() => handleLike(c._id)}
                              className={`text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2.5 ${user && c.likes?.includes(user._id) ? 'text-primary scale-110' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                              <FiThumbsUp size={18} className={user && c.likes?.includes(user._id) ? 'fill-current' : ''} />
                              <span>{c.likes?.length || 0}</span>
                            </button>
                            
                            <button 
                              onClick={() => {
                                if (replyingTo === c._id && !replyToUser) {
                                  setReplyTo(null);
                                } else {
                                  setReplyTo(c._id);
                                  setReplyToUser(null);
                                }
                              }}
                              className={`text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2.5 ${replyingTo === c._id && !replyToUser ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                              <div className="relative">
                                <FiMessageSquare size={18} />
                                {c.replies?.length > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-dark animate-pulse font-bold">
                                    {c.replies.length}
                                  </span>
                                )}
                              </div>
                              <span>{t('reply')}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-5">
                            {/* Only show Report if NOT owner */}
                            {user?._id !== (c.user?._id || c.user) && (
                              <button 
                                onClick={() => handleReport(c._id)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-neutral-500 hover:bg-yellow-500/20 hover:text-yellow-500 transition-all border border-transparent hover:border-yellow-500/30"
                                title={t('report')}
                              >
                                <FiAlertCircle size={18} />
                              </button>
                            )}

                            {/* Only show Delete if Owner or Admin */}
                            {(user && (user._id === (c.user?._id || c.user) || user.role === 'admin')) && (
                              <button 
                                onClick={() => handleDeleteComment(c._id)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-neutral-500 hover:bg-red-500/20 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                                title={t('withdraw')}
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Replies List */}
                        {c.replies?.length > 0 && (
                          <div className={`mt-2 space-y-3 pl-3 border-l-2 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} max-h-[200px] overflow-y-auto custom-scrollbar`}>
                            {c.replies.map((reply: any, rid: number) => (
                              <div key={rid} className="flex gap-2 group/reply">
                                <Avatar src={reply.user?.avatar} size={20} className="rounded-md flex-shrink-0 mt-0.5" />
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[9px] font-black uppercase truncate ${theme === 'dark' ? 'text-white/80' : 'text-dark/80'}`}>{reply.user?.username}</p>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[7px] text-neutral-500 font-bold whitespace-nowrap">{new Date(reply.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                      
                                      {/* Like Reply button */}
                                      <button 
                                        onClick={() => handleLikeReply(c._id, reply._id)}
                                        className={`text-[7px] font-black uppercase transition-all flex items-center space-x-1 ${user && reply.likes?.includes(user._id) ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
                                      >
                                        <FiThumbsUp size={10} className={user && reply.likes?.includes(user._id) ? 'fill-current' : ''} />
                                        <span>{reply.likes?.length || 0}</span>
                                      </button>

                                      {/* New Reply to Reply button */}
                                      <button 
                                        onClick={() => {
                                          setReplyTo(c._id);
                                          setReplyToUser(reply.user?.username);
                                        }}
                                        className="text-[7px] font-black uppercase text-neutral-500 hover:text-primary transition-colors opacity-0 group-hover/reply:opacity-100"
                                      >
                                        {t('reply')}
                                      </button>

                                      {(user && (user._id === (reply.user?._id || reply.user) || user.role === 'admin')) && (
                                        <button 
                                          onClick={() => handleDeleteReply(c._id, reply._id)}
                                          className="text-neutral-500 hover:text-red-500 transition-colors opacity-0 group-hover/reply:opacity-100"
                                          title={t('delete_comm')}
                                        >
                                          <FiTrash2 size={8} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className={`text-[10px] leading-snug font-medium break-words ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    {reply.replyToUser && (
                                      <span className="text-primary font-bold mr-1 italic">@{reply.replyToUser}</span>
                                    )}
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        <AnimatePresence>
                          {replyingTo === c._id && (
                            <motion.form 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              onSubmit={(e) => handleReplySubmit(e, c._id)}
                              className="relative mt-2"
                            >
                              {replyToUser && (
                                <div className="flex items-center space-x-2 mb-1.5 ml-3 px-2 py-1 bg-primary/10 rounded-lg w-fit border border-primary/20">
                                  <span className="text-[7px] font-black uppercase text-primary tracking-widest flex items-center">
                                    <FiCornerDownRight className="mr-1" /> {lang === 'vi' ? 'Phản hồi' : 'Replying to'} @{replyToUser}
                                  </span>
                                  <button 
                                    onClick={() => setReplyToUser(null)}
                                    className="text-primary/40 hover:text-primary transition-colors flex items-center border-l border-primary/20 pl-1.5 ml-1.5"
                                  >
                                    <FiX size={10} />
                                  </button>
                                </div>
                              )}
                              <div className="relative">
                                <input 
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={replyToUser ? `${t('reply')} @${replyToUser}...` : t('reply')}
                                  className={`w-full border rounded-xl py-2 pl-3 pr-10 text-[10px] outline-none focus:border-primary transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-dark'}`}
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-red-700 transition-colors">
                                  <FiSend size={14} />
                                </button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {comments.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <FiMessageSquare size={48} className="mx-auto mb-4 text-neutral-700" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs text-neutral-500">{t('no_comments')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MovieDetail);
