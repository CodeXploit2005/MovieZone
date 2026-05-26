import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, FiMessageSquare, FiUsers, FiFilm, 
  FiTrash2, FiCheck, FiX, 
  FiTrendingUp, FiArrowUpRight, FiSearch, FiPlus, FiImage,
  FiHeart, FiCornerDownRight, FiEdit2, FiSave, FiUpload, FiAlertCircle,
  FiSlash, FiUserCheck, FiActivity, FiSend, FiMessageCircle
} from 'react-icons/fi';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Avatar from '../components/common/Avatar';
import supportService from '../services/supportService';

import { IComment } from '../types/comment';
import { Movie } from '../types/movie';
import { AdminStats, UserRequest, Banner, AdminGroup, AdminMessage, SupportConversation } from '../types/admin';

const AdminDashboard = () => {
  const { user, theme, t, formatMsg } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [stats, setStats] = useState<AdminStats>({ 
    users: 0, 
    comments: 0, 
    movies: 0, 
    activeUsers: 0,
    latestUsers: [],
    healthChart: [],
    movieStorage: [],
    latestComments: []
  });
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [comments, setComments] = useState<IComment[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Chat State
  const [chatMessages, setChatMessages] = useState<AdminMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [editingAdminMsg, setEditingAdminMsg] = useState<{ id: string; content: string } | null>(null);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<any>('group'); // 'group' or admin object
  const [adminGroups, setAdminGroups] = useState<AdminGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Support Chat State
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([]);
  const [selectedSupportUser, setSelectedSupportUser] = useState<any>(null); // User object
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportReply, setSupportReply] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [editingSupportMsg, setEditingSupportMsg] = useState<{ id: string; content: string } | null>(null);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');

  // Quick View State
  const [activeQuickView, setActiveQuickView] = useState<string | null>(null); // 'users', 'active', 'comments', 'movies'

  // Edit states
  const [editingComment, setEditingComment] = useState<{ id: string; content: string; isReply: boolean; commentId?: string; parentId?: string } | null>(null); 
  const [uploading, setUploading] = useState({ movie: false, banner: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [commentFilter, setCommentFilter] = useState('all'); 
  const [commentSort, setCommentSort] = useState('newest'); 
  
  const [isEditingContent, setIsEditingContent] = useState<{ type: 'movie' | 'banner'; data: any } | null>(null);

  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    posterPath: '',
    trailerUrl: '',
    runtime: '',
    country: '',
    genres: '',
    releaseDate: ''
  });

  const [bannerForm, setBannerForm] = useState({
    title: '',
    image: '',
    movie: '',
    link: '' 
  });

  const fetchData = useCallback(async () => {
    try {
      if (!user?.token) return;
      const [statsData, reqData, commData, movieData, bannerData, adminListData] = await Promise.all([
        adminService.getStats(user.token),
        adminService.getRequests(user.token),
        adminService.getComments(user.token),
        adminService.getMovies(user.token),
        adminService.getBanners(user.token),
        adminService.getAdmins(user.token)
      ]);
      setStats(statsData);
      setRequests(reqData);
      setComments(commData);
      setMovies(movieData);
      setBanners(bannerData);
      setAdminList(adminListData);
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    } finally {
      setLoading(false);
    }
  }, [user?.token, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchChatMessages = useCallback(async () => {
    try {
      if (!user?.token) return;
      setChatLoading(true);
      const receiverId = selectedReceiver === 'group' ? 'group' : selectedReceiver._id;
      const data = await adminService.getAdminMessages(user.token, receiverId, selectedGroupId || undefined);
      setChatMessages(data);
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setChatLoading(false);
    }
  }, [selectedReceiver, selectedGroupId, user?.token]);

  const fetchAdminGroups = useCallback(async () => {
    try {
      if (!user?.token) return;
      const data = await adminService.getAdminGroups(user.token);
      setAdminGroups(data);
    } catch (error) {
      console.error('Error fetching admin groups:', error);
    }
  }, [user?.token]);

  const fetchSupportConversations = useCallback(async () => {
    try {
      if (!user?.token) return;
      const data = await supportService.getAdminConversations(user.token);
      setSupportConversations(data);
    } catch (error) {
      console.error('Error fetching support conversations:', error);
    }
  }, [user?.token]);

  const fetchSupportMessages = useCallback(async (userId: string) => {
    try {
      if (!user?.token) return;
      setSupportLoading(true);
      const data = await supportService.getAdminUserMessages(user.token, userId);
      setSupportMessages(data);
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setSupportLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatMessages();
      fetchAdminGroups();
    }
    if (activeTab === 'support') {
      fetchSupportConversations();
    }
  }, [selectedReceiver, selectedGroupId, activeTab, fetchChatMessages, fetchAdminGroups, fetchSupportConversations]);

  useEffect(() => {
    if (activeTab === 'support' && selectedSupportUser) {
      fetchSupportMessages(selectedSupportUser._id);
      const interval = setInterval(() => fetchSupportMessages(selectedSupportUser._id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedSupportUser, fetchSupportMessages]);

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReply.trim() || !selectedSupportUser || !user?.token) return;

    try {
      const data = await supportService.adminReplyMessage(user.token, selectedSupportUser._id, supportReply);
      setSupportMessages(prev => [...prev, data]);
      setSupportReply('');
      fetchSupportConversations(); // Update unread counts and last messages
    } catch (error) {
      toast.error(t('send_failed'));
    }
  };

  const handleSupportKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendSupportReply(e as any);
    }
  };

  const handleUpdateSupportMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupportMsg?.content.trim() || !user?.token) return;

    try {
      const data = await supportService.updateMessage(user.token, editingSupportMsg.id, editingSupportMsg.content);
      setSupportMessages(supportMessages.map(m => m._id === editingSupportMsg.id ? data : m));
      setEditingSupportMsg(null);
      toast.success(formatMsg(t('msg_updated')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleDeleteSupportMsg = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_msg')) || !user?.token) return;
    try {
      await supportService.deleteMessage(user.token, id);
      setSupportMessages(supportMessages.filter(m => m._id !== id));
      toast.success(formatMsg(t('msg_withdrawn')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.token) return;

    try {
      const receiverId = selectedReceiver === 'group' ? 'group' : selectedReceiver._id;
      const data = await adminService.sendAdminMessage(user.token, newMessage, receiverId, selectedGroupId || undefined);
      setChatMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (error: any) {
      console.error('Chat error:', error.response?.data || error.message);
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleDeleteSupportConversation = async (userId: string) => {
    if (!window.confirm(t('confirm_delete_conversation'))) return;
    try {
      if (!user?.token) return;
      await supportService.deleteConversation(user.token, userId);
      toast.success(formatMsg(t('msg_withdrawn')));
      setSelectedSupportUser(null);
      fetchSupportConversations();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
      toast.error(t('group_name_and_members_required'));
      return;
    }
    try {
      if (!user?.token) return;
      await adminService.createAdminGroup(user.token, newGroupName, selectedGroupMembers);
      toast.success(formatMsg(t('updated_success')));
      setNewGroupName('');
      setSelectedGroupMembers([]);
      setShowCreateGroup(false);
      fetchAdminGroups();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleDeleteAdminGroup = async (groupId: string) => {
    if (!window.confirm(t('confirm_delete_group'))) return;
    try {
      if (!user?.token) return;
      await adminService.deleteAdminGroup(user.token, groupId);
      toast.success(formatMsg(t('msg_withdrawn')));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
        setSelectedReceiver('group');
      }
      fetchAdminGroups();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleDeleteAdminMsg = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_comment')) || !user?.token) return;
    try {
      await adminService.deleteMessage(user.token, id);
      setChatMessages(chatMessages.filter(m => m._id !== id));
      toast.success(formatMsg(t('comment_withdrawn')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleUpdateAdminMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminMsg || !editingAdminMsg.content.trim() || !user?.token) return;
    try {
      const data = await adminService.editMessage(user.token, editingAdminMsg.id, editingAdminMsg.content);
      setChatMessages(chatMessages.map(m => m._id === editingAdminMsg.id ? data : m));
      setEditingAdminMsg(null);
      toast.success(formatMsg(t('updated_success')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleToggleBan = async (userId: string) => {
    try {
      if (!user?.token) return;
      const data = await adminService.toggleBan(user.token, userId);
      toast.success(formatMsg(data.isBanned ? t('user_banned') : t('user_unbanned')));
      fetchData(); // Refresh stats/latest users
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      if (!user?.token) return;
      await adminService.updateUserRole(user.token, userId, newRole as any);
      toast.success(formatMsg(t('role_updated')));
      fetchData();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'movie' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user?.token) return;

    const formData = new FormData();
    formData.append(type === 'movie' ? 'movie' : 'banner', file);

    setUploading({ ...uploading, [type]: true });
    try {
      const data = await adminService.uploadFile(user.token, type, formData);
      
      if (type === 'movie') {
        setMovieForm({ ...movieForm, posterPath: data.url });
      } else {
        setBannerForm({ ...bannerForm, image: data.url });
      }
      toast.success(formatMsg(t('upload_file_success')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('upload_file_error')));
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const handleEditComment = async () => {
    try {
      if (!user?.token || !editingComment) return;
      if (editingComment.isReply) {
        await adminService.updateReply(user.token, editingComment.parentId || editingComment.commentId || '', editingComment.id, editingComment.content);
      } else {
        await adminService.updateComment(user.token, editingComment.id, { content: editingComment.content });
      }
      
      setComments(comments.map(c => {
        if (!editingComment.isReply && c._id === editingComment.id) {
          return { ...c, content: editingComment.content };
        }
        if (editingComment.isReply && c._id === (editingComment.parentId || editingComment.commentId)) {
          return {
            ...c,
            replies: c.replies.map((r: any) => r._id === editingComment.id ? { ...r, content: editingComment.content } : r)
          };
        }
        return c;
      }));
      
      setEditingComment(null);
      toast.success(formatMsg(t('updated_success')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm(t('confirm_delete_reply')) || !user?.token) return;
    try {
      await adminService.deleteReply(user.token, commentId, replyId);
      setComments(comments.map(c => {
        if (c._id === commentId) {
          return { ...c, replies: c.replies.filter((r: any) => r._id !== replyId) };
        }
        return c;
      }));
      toast.success(formatMsg(t('reply_deleted')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.token) return;
      const genresArray = movieForm.genres ? (Array.isArray(movieForm.genres) ? movieForm.genres : movieForm.genres.split(',').map((g: string) => g.trim())) : [];
      
      const movieData: any = { ...movieForm, genres: genresArray };
      Object.keys(movieData).forEach(key => {
        if (movieData[key] === '') delete (movieData as any)[key];
      });

      if (isEditingContent?.type === 'movie') {
        const response = await adminService.updateMovie(user.token, isEditingContent.data._id, movieData);
        setMovies(movies.map(m => m._id === isEditingContent.data._id ? response.data : m));
        setIsEditingContent(null);
        toast.success(formatMsg(t('updated_success')));
      } else {
        const response = await adminService.addMovie(user.token, movieData);
        setMovies([response.data, ...movies]);
        toast.success(formatMsg(t('success_update')));
      }
      setMovieForm({ title: '', description: '', posterPath: '', trailerUrl: '', runtime: '', country: '', genres: '', releaseDate: '' });
      fetchData(); // Refresh stats
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.token) return;
      const bannerData: any = { ...bannerForm };
      if (!bannerData.movie) delete bannerData.movie;
      if (!bannerData.link) delete bannerData.link;

      if (isEditingContent?.type === 'banner') {
        const response = await adminService.updateBanner(user.token, isEditingContent.data._id, bannerData);
        setBanners(banners.map(b => b._id === isEditingContent.data._id ? response.data : b));
        setIsEditingContent(null);
        toast.success(formatMsg(t('updated_success')));
      } else {
        const response = await adminService.addBanner(user.token, bannerData);
        setBanners([response.data, ...banners]);
        toast.success(formatMsg(t('success_update')));
      }
      setBannerForm({ title: '', image: '', movie: '', link: '' });
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleEditMovieClick = useCallback((movie: Movie) => {
    setIsEditingContent({ type: 'movie', data: movie });
    setMovieForm({
      title: movie.title || '',
      description: movie.overview || movie.description || '',
      posterPath: movie.posterPath || movie.poster_path || '',
      trailerUrl: movie.trailerUrl || '',
      runtime: movie.runtime?.toString() || '',
      country: movie.production_countries?.[0]?.name || '',
      genres: Array.isArray(movie.genres) ? movie.genres.map(g => typeof g === 'string' ? g : g.name).join(', ') : '',
      releaseDate: movie.release_date || movie.releaseDate || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEditBannerClick = useCallback((banner: Banner) => {
    setIsEditingContent({ type: 'banner', data: banner });
    setBannerForm({
      title: banner.title || '',
      image: banner.image || '',
      movie: banner.movie?._id || '',
      link: banner.link || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteMovie = async (id: string | undefined) => {
    if (!id || !window.confirm(t('confirm_delete_history')) || !user?.token) return;
    try {
      await adminService.deleteMovie(user.token, id);
      setMovies(movies.filter(m => (m._id || m.id) !== id));
      toast.success(formatMsg(t('history_deleted')));
      fetchData();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm(t('confirm_delete_history')) || !user?.token) return;
    try {
      await adminService.deleteBanner(user.token, id);
      setBanners(banners.filter(b => b._id !== id));
      toast.success(formatMsg(t('history_deleted')));
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const handleApprove = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      if (!user?.token) return;
      await adminService.approveRequest(user.token, userId, status);
      setRequests(requests.filter(r => r._id !== userId));
      toast.success(formatMsg(status === 'approved' ? t('approved') : t('rejected')));
      fetchData();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('error_update')));
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm(t('confirm_withdraw_comment')) || !user?.token) return;
    try {
      await adminService.deleteComment(user.token, id);
      setComments(comments.filter(c => c._id !== id));
      toast.success(formatMsg(t('comment_withdrawn')));
      fetchData();
    } catch (error: any) {
      toast.error(formatMsg(error.response?.data?.message || t('delete_error')));
    }
  };

  const filteredComments = useMemo(() => {
    return comments
      .filter(c => {
        if (!c) return false;
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
          c.user?.username?.toLowerCase().includes(search) ||
          c.user?.email?.toLowerCase().includes(search) ||
          c.movieTitle?.toLowerCase().includes(search) ||
          c.movieId?.toString().includes(search) ||
          c.content?.toLowerCase().includes(search)
        );
        const matchesFilter = commentFilter === 'all' || (commentFilter === 'reported' && (c.reportsCount || 0) > 0);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (commentSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (commentSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (commentSort === 'most_reported') return (b.reportsCount || 0) - (a.reportsCount || 0);
        return 0;
      });
  }, [comments, searchTerm, commentFilter, commentSort]);

  const tabs = useMemo(() => [
    { id: 'requests', label: t('requests'), icon: FiShield },
    { id: 'comments', label: t('stats_comm'), icon: FiMessageSquare },
    { id: 'movies', label: t('manage_movies'), icon: FiFilm },
    { id: 'chat', label: t('admin_chat'), icon: FiActivity },
    { id: 'support', label: t('support_user'), icon: FiMessageSquare }
  ], [t]);

  const statItems = useMemo(() => [
    { id: 'users', label: t('total_users'), value: stats.users, icon: FiUsers, color: 'text-blue-500' },
    { id: 'active', label: t('active_7d'), value: stats.activeUsers, icon: FiTrendingUp, color: 'text-green-500' },
    { id: 'comments', label: t('stats_comm'), value: stats.comments, icon: FiMessageSquare, color: 'text-primary' },
    { id: 'movies', label: t('total_movies'), value: stats.movies, icon: FiFilm, color: 'text-yellow-500' }
  ], [t, stats]);

  // Helper to translate weekday names from backend
  const formatChartData = useMemo(() => {
    return stats.healthChart?.map((item: any) => {
      let translatedName = item.name;
      const name = item.name.toLowerCase();
      if (name.includes('thứ 2') || name.includes('t2') || name.includes('mon')) translatedName = t('mon');
      else if (name.includes('thứ 3') || name.includes('t3') || name.includes('tue')) translatedName = t('tue');
      else if (name.includes('thứ 4') || name.includes('t4') || name.includes('wed')) translatedName = t('wed');
      else if (name.includes('thứ 5') || name.includes('t5') || name.includes('thu')) translatedName = t('thu');
      else if (name.includes('thứ 6') || name.includes('t6') || name.includes('fri')) translatedName = t('fri');
      else if (name.includes('thứ 7') || name.includes('t7') || name.includes('sat')) translatedName = t('sat');
      else if (name.includes('chủ nhật') || name.includes('cn') || name.includes('sun')) translatedName = t('sun');
      
      return { ...item, name: translatedName };
    });
  }, [stats.healthChart, t]);

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center space-y-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-primary font-bold animate-pulse tracking-widest uppercase text-xs">{t('loading')}</p>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-dark'} pt-10 pb-20`}>
      <div className="container mx-auto px-4 md:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
              Admin<span className="text-primary">Zone</span>
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              {t('admin_system')}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statItems.map((item: any, i: number) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveQuickView(item.id)}
              className={`p-8 rounded-[2rem] border text-left transition-all relative group overflow-hidden ${
                theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/[0.08]' : 'bg-white border-gray-100 shadow-xl hover:shadow-2xl'
              }`}
            >
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <FiArrowUpRight className="text-neutral-500 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
              <h4 className="text-3xl font-black tracking-tighter mb-1 relative z-10">{item.value}</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 relative z-10">{item.label}</p>
              
              {/* Background Glow */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${
                item.id === 'users' ? 'bg-blue-500' : 
                item.id === 'active' ? 'bg-green-500' : 
                item.id === 'comments' ? 'bg-primary' : 'bg-yellow-500'
              }`} />
            </motion.button>
          ))}
        </div>

        {/* Quick View Modals/Drawers */}
        <AnimatePresence>
          {activeQuickView && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveQuickView(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              
              {activeQuickView === 'users' && (
                <motion.div 
                  layoutId="users"
                  className={`w-full max-w-2xl rounded-[2.5rem] border overflow-hidden relative z-10 flex flex-col max-h-[80vh] ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{t('quick_user_manage')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('ten_latest_members')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-2">
                    {stats.latestUsers?.map(u => (
                      <div key={u._id} className={`p-4 rounded-2xl flex items-center justify-between group ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center space-x-4">
                          <Avatar src={u.avatar} size={40} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-sm">{u.username}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'
                              }`}>{u.role === 'admin' ? t('admin_role') : t('user_role')}</span>
                              {u.isBanned && <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded font-black uppercase">{t('banned_status')}</span>}
                            </div>
                            <p className="text-[10px] text-neutral-500 font-bold">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleToggleBan(u._id)}
                            className={`p-2.5 rounded-xl transition-all ${
                              u.isBanned ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                            }`}
                            title={u.isBanned ? t('unban') : t('ban')}
                          >
                            {u.isBanned ? <FiUserCheck size={14} /> : <FiSlash size={14} />}
                          </button>
                          <select 
                            value={u.role}
                            onChange={(e) => handleChangeRole(u._id, e.target.value)}
                            className={`text-[10px] font-black uppercase p-2 rounded-xl outline-none cursor-pointer transition-all ${
                              theme === 'dark' 
                                ? 'bg-neutral-800 border-white/10 text-white hover:bg-neutral-700' 
                                : 'bg-gray-100 border-gray-200 text-dark hover:bg-gray-200'
                            }`}
                          >
                            <option key="user" value="user" className={theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}>{t('user_role')}</option>
                            <option key="admin" value="admin" className={theme === 'dark' ? 'bg-neutral-900' : 'bg-white'}>{t('admin_role')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-primary/5 text-center">
                    <button onClick={() => { setActiveQuickView(null); setActiveTab('requests'); }} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">{t('pending_requests')}</button>
                  </div>
                </motion.div>
              )}

              {activeQuickView === 'active' && (
                <motion.div 
                  layoutId="active"
                  className={`w-full max-w-4xl rounded-[2.5rem] border overflow-hidden relative z-10 flex flex-col ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter flex items-center">
                        <FiActivity className="mr-3 text-green-500" /> {t('website_health')}
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('traffic_7d')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="p-8 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formatChartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#333' : '#eee'} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#666" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                          }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#ef4444" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorUsers)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-8 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase text-neutral-500 mb-1">{t('peak_day')}</p>
                      <p className="text-lg font-black text-primary">{t('sat')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase text-neutral-500 mb-1">{t('avg_active')}</p>
                      <p className="text-lg font-black text-green-500">{(stats.activeUsers / 7).toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black uppercase text-neutral-500 mb-1">{t('growth')}</p>
                      <p className="text-lg font-black text-blue-500">+12%</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeQuickView === 'comments' && (
                <motion.div 
                  initial={{ x: 500 }}
                  animate={{ x: 0 }}
                  exit={{ x: 500 }}
                  className={`fixed top-0 right-0 h-full w-full max-w-md border-l z-20 flex flex-col ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{t('moderation_room')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('recent_comments')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {stats.latestComments?.map(c => (
                      <div key={c._id} className={`p-6 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar src={c.user?.avatar} size={32} />
                            <span className="font-black text-xs">{c.user?.username}</span>
                          </div>
                          <span className="text-[8px] text-neutral-500 font-bold uppercase">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-neutral-400 italic leading-relaxed">"{c.content}"</p>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => { handleDeleteComment(c._id); fetchData(); }}
                            className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                          >{t('cleanup')}</button>
                          <button 
                            onClick={() => { setActiveQuickView(null); setActiveTab('comments'); }}
                            className="flex-1 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all"
                          >{t('view_details')}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeQuickView === 'movies' && (
                <motion.div 
                  layoutId="movies"
                  className={`w-full max-w-2xl rounded-[2.5rem] border overflow-hidden relative z-10 flex flex-col ${
                    theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
                  }`}
                >
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{t('quick_movie_store')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('genre_distribution')}</p>
                    </div>
                    <button onClick={() => setActiveQuickView(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FiX size={20} /></button>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-4">
                    {stats.movieStorage?.map((item, i) => (
                      <div 
                        key={i} 
                        className={`p-5 rounded-2xl flex items-center justify-between border ${
                          item.count === 0 
                            ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                            : theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest">{item.genre}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-black tracking-tighter">{item.count}</span>
                          {item.count === 0 && <span className="text-[8px] font-black uppercase">{t('need_more')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-8 border-t border-white/5">
                    <button 
                      onClick={() => { setActiveQuickView(null); setActiveTab('movies'); }}
                      className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-primary/30"
                    >
                      <FiPlus size={18} />
                      <span>{t('add_movie_now')}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
         
          <div className="lg:col-span-3 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 space-x-4 lg:space-x-0 lg:space-y-2 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 lg:flex-shrink flex items-center space-x-4 p-4 lg:p-5 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                    : theme === 'dark' ? 'bg-white/5 text-neutral-500 hover:bg-white/10' : 'bg-white text-neutral-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <h3 className="font-black uppercase tracking-widest text-sm">
                      {t('pending_requests')}
                    </h3>
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black">{requests.length}</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                          <th className="p-8">{t('username')}</th>
                          <th className="p-8">{t('email')}</th>
                          <th className="p-8 text-right">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.length === 0 ? (
                          <tr><td colSpan={3} className="p-20 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">{t('no_results')}</td></tr>
                        ) : requests.map(req => (
                          <tr key={req._id} className={`border-b transition-colors ${theme === 'dark' ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50'}`}>
                            <td className="p-8">
                              <div className="flex items-center space-x-4">
                                <Avatar src={req.avatar} size={32} />
                                <span className="font-bold text-sm">{req.username}</span>
                              </div>
                            </td>
                            <td className="p-8 text-neutral-500 text-xs font-medium">{req.email}</td>
                            <td className="p-8 text-right">
                              <div className="flex items-center justify-end space-x-3">
                                <button 
                                  onClick={() => handleApprove(req._id, 'approved')}
                                  className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                                >
                                  <FiCheck size={16} />
                                </button>
                                <button 
                                  onClick={() => handleApprove(req._id, 'rejected')}
                                  className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h3 className="font-black uppercase tracking-widest text-sm">
                      {t('manage_comments')}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Search */}
                      <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input 
                          type="text" 
                          placeholder={t('search_comm_placeholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`border rounded-xl py-2.5 pl-10 pr-4 text-[10px] outline-none focus:border-primary transition-all w-full md:w-64 ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                      </div>

                      {/* Filter */}
                      <select 
                        value={commentFilter}
                        onChange={(e) => setCommentFilter(e.target.value)}
                        className={`border rounded-xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                        }`}
                      >
                        <option key="all" value="all" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('all_comments')}</option>
                        <option key="reported" value="reported" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('reported_only')}</option>
                      </select>

                      {}
                      <select 
                        value={commentSort}
                        onChange={(e) => setCommentSort(e.target.value)}
                        className={`border rounded-xl py-2.5 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer ${
                          theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                        }`}
                      >
                        <option key="newest" value="newest" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('newest_first')}</option>
                        <option key="oldest" value="oldest" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('oldest_first')}</option>
                        <option key="most_reported" value="most_reported" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('most_reported')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-white/5">
                          <th className="p-8">{t('user_info')}</th>
                          <th className="p-8">{t('movie_context')}</th>
                          <th className="p-8">{t('comm_content')}</th>
                          <th className="p-8">{t('engagement')}</th>
                          <th className="p-8 text-right">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComments.map(c => (
                          <React.Fragment key={c._id}>
                            <tr className={`border-b transition-colors ${
                              c.reportsCount > 0 
                                ? 'bg-red-500/[0.03] hover:bg-red-500/[0.05]' 
                                : theme === 'dark' ? 'hover:bg-white/[0.02] border-white/5' : 'hover:bg-gray-50 border-gray-50'
                            }`}>
                              <td className="p-8">
                                <div className="flex items-center space-x-4">
                                  <Avatar src={c.user?.avatar} size={40} className={`border ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`} />
                                  <div className="flex flex-col">
                                    <span className="font-black text-sm">{c.user?.username}</span>
                                    <span className="text-[10px] text-neutral-500 font-bold">{c.user?.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-8">
                                <div className="flex flex-col space-y-1">
                                  <span className="text-[10px] font-black uppercase text-primary tracking-tighter">
                                    {c.movieTitle}
                                  </span>
                                  <span className="text-[8px] text-neutral-600 font-bold">{t('id_label')}: {c.movieId}</span>
                                  <span className="text-[8px] text-neutral-500 uppercase font-black">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="p-8 max-w-xs">
                                {editingComment && editingComment.id === c._id && !editingComment.isReply ? (
                                  <div className="flex flex-col space-y-2">
                                    <textarea 
                                      className={`border rounded-xl p-4 text-xs outline-none focus:border-primary w-full min-h-[80px] ${
                                        theme === 'dark' ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-200 text-dark'
                                      }`}
                                      value={editingComment?.content || ""}
                                      onChange={(e) => editingComment && setEditingComment({ ...editingComment, content: e.target.value })}
                                    />
                                    <div className="flex space-x-2">
                                      <button onClick={handleEditComment} className="flex items-center space-x-2 bg-primary text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase"><FiSave /> <span>{t('save')}</span></button>
                                      <button onClick={() => setEditingComment(null)} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${
                                        theme === 'dark' ? 'bg-white/10 text-neutral-400' : 'bg-gray-100 text-neutral-500'
                                      }`}><FiX /> <span>{t('cancel')}</span></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>{c.content}</p>
                                    {c.reportsCount > 0 && (
                                      <div className="flex flex-col gap-1 mt-3">
                                        <p className="text-[8px] font-black uppercase text-red-500 tracking-widest">{t('recent_reports')}</p>
                                        {c.reports?.slice(0, 2).map((r: any, i: number) => (
                                          <p key={i} className="text-[9px] text-red-400/80 italic font-medium">"{r.reason}"</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-8">
                                <div className="flex flex-col space-y-3">
                                  <div className="flex items-center space-x-4 text-neutral-500">
                                    <div className="flex items-center space-x-1.5">
                                      <FiHeart size={14} className="text-primary" />
                                      <span className="text-xs font-black">{c.likesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      <FiCornerDownRight size={14} className="text-blue-500" />
                                      <span className="text-xs font-black">{c.repliesCount || 0}</span>
                                    </div>
                                  </div>
                                  {c.reportsCount > 0 && (
                                    <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-lg w-fit">
                                      <FiAlertCircle size={12} />
                                      <span className="text-[10px] font-black">{c.reportsCount} {t('reports_count')}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-8 text-right">
                                <div className="flex items-center justify-end space-x-3">
                                  <button 
                                    onClick={() => setEditingComment({ id: c._id, content: c.content, isReply: false })}
                                    className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all group"
                                    title={t('edit_comm')}
                                  >
                                    <FiEdit2 size={16} className="group-hover:scale-110 transition-transform" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(c._id)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                                    title={t('delete_comm')}
                                  >
                                    <FiTrash2 size={16} className="group-hover:scale-110 transition-transform" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Replies */}
                            {c.replies?.map((r: any) => (
                              <tr key={r._id} className={`border-b transition-colors ${
                                theme === 'dark' ? 'bg-white/[0.01] hover:bg-white/[0.03] border-white/5' : 'bg-gray-50/30 hover:bg-gray-50 border-gray-50'
                              }`}>
                                <td className="p-4 pl-16">
                                  <div className="flex items-center space-x-4">
                                    <FiCornerDownRight className="text-neutral-600" />
                                    <Avatar src={r.user?.avatar} size={28} className={`border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`} />
                                    <div className="flex flex-col">
                                      <span className={`font-bold text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>{r.user?.username}</span>
                                      <span className="text-[8px] text-neutral-600 font-bold uppercase">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-[9px] font-black uppercase text-neutral-600 tracking-widest">
                                  {t('reply_to')} {c.user?.username}
                                </td>
                                <td className="p-4">
                                  {editingComment && editingComment.id === r._id && editingComment.isReply ? (
                                    <div className="flex flex-col space-y-2">
                                      <textarea 
                                           className={`border rounded-xl p-3 text-xs outline-none focus:border-primary w-full ${
                                             theme === 'dark' ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-dark'
                                           }`}
                                           value={editingComment?.content || ""}
                                           onChange={(e) => editingComment && setEditingComment({ ...editingComment, content: e.target.value })}
                                         />
                                      <div className="flex space-x-2">
                                        <button onClick={handleEditComment} className="text-primary hover:text-red-700 transition-colors"><FiSave size={14} /></button>
                                        <button onClick={() => setEditingComment(null)} className="text-neutral-500 hover:text-white transition-colors"><FiX size={14} /></button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className={`text-xs italic ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>"{r.content}"</p>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-1.5 text-neutral-500">
                                      <FiHeart size={12} className="text-primary" />
                                      <span className="text-[10px] font-black">{r.likesCount || 0}</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[7px] font-black uppercase tracking-tighter w-fit">{t('sub_comment')}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button 
                                      onClick={() => setEditingComment({ id: r._id, content: r.content, isReply: true, parentId: c._id })}
                                      className="p-2.5 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                    >
                                      <FiEdit2 size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReply(c._id, r._id)}
                                      className="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    >
                                      <FiTrash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'movies' && (
                <motion.div
                  key="movies"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* Forms Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Banner Form */}
                    <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <h3 className="font-black uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                        <span className="flex items-center"><FiImage className="mr-3 text-primary" /> {isEditingContent?.type === 'banner' ? t('edit_banner') : t('add_banner')}</span>
                        {isEditingContent?.type === 'banner' && (
                          <button onClick={() => { setIsEditingContent(null); setBannerForm({ title: '', image: '', movie: '', link: '' }); }} className="text-[10px] bg-white/5 px-3 py-1 rounded-lg hover:bg-white/10">{t('cancel_edit')}</button>
                        )}
                      </h3>
                      <form onSubmit={handleAddBanner} className="space-y-4">
                        <input 
                          type="text" placeholder={t('title')} value={bannerForm.title}
                          onChange={e => setBannerForm({...bannerForm, title: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        
                        <div className="relative group">
                          <input 
                            type="text" placeholder={t('image_url_placeholder')} value={bannerForm.image}
                            onChange={e => setBannerForm({...bannerForm, image: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all pr-12 ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                          <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all">
                            {uploading.banner ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FiUpload />}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                          </label>
                        </div>

                        <select 
                          value={bannerForm.movie}
                          onChange={e => setBannerForm({...bannerForm, movie: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all appearance-none cursor-pointer ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        >
                          <option key="default" value="" className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{t('select_movie')}</option>
                          {movies.map(m => (
                            <option key={m._id} value={m._id} className={theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}>{m.title}</option>
                          ))}
                        </select>
                        <input 
                          type="text" placeholder={t('external_link')} value={bannerForm.link}
                          onChange={e => setBannerForm({...bannerForm, link: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center justify-center space-x-2">
                          <FiPlus /> <span>{isEditingContent?.type === 'banner' ? t('update_banner') : t('save_banner')}</span>
                        </button>
                      </form>
                    </div>

                    {/* Movie Form */}
                    <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <h3 className="font-black uppercase tracking-widest text-sm mb-6 flex items-center justify-between">
                        <span className="flex items-center"><FiFilm className="mr-3 text-primary" /> {isEditingContent?.type === 'movie' ? t('edit_movie') : t('add_movie')}</span>
                        {isEditingContent?.type === 'movie' && (
                          <button onClick={() => { setIsEditingContent(null); setMovieForm({ title: '', description: '', posterPath: '', trailerUrl: '', runtime: '', country: '', genres: '', releaseDate: '' }); }} className="text-[10px] bg-white/5 px-3 py-1 rounded-lg hover:bg-white/10">{t('cancel_edit')}</button>
                        )}
                      </h3>
                      <form onSubmit={handleAddMovie} className="space-y-4">
                        <input 
                          type="text" placeholder={t('title')} value={movieForm.title}
                          onChange={e => setMovieForm({...movieForm, title: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <textarea 
                          placeholder={t('description')} value={movieForm.description}
                          onChange={e => setMovieForm({...movieForm, description: e.target.value})}
                          className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all h-24 ${
                            theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                          }`}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative group">
                            <input 
                              type="text" placeholder={t('poster_url')} value={movieForm.posterPath}
                              onChange={e => setMovieForm({...movieForm, posterPath: e.target.value})}
                              className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all pr-12 ${
                                theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                              }`}
                            />
                            <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all">
                              {uploading.movie ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FiUpload />}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'movie')} />
                            </label>
                          </div>
                          <input 
                            type="text" placeholder={t('trailer_url')} value={movieForm.trailerUrl}
                            onChange={e => setMovieForm({...movieForm, trailerUrl: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder={t('runtime_placeholder')} value={movieForm.runtime}
                            onChange={e => setMovieForm({...movieForm, runtime: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                          <input 
                            type="text" placeholder={t('country_placeholder')} value={movieForm.country}
                            onChange={e => setMovieForm({...movieForm, country: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder={t('genres_placeholder')} value={movieForm.genres}
                            onChange={e => setMovieForm({...movieForm, genres: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                          <input 
                            type="text" placeholder={t('release_year_placeholder')} value={movieForm.releaseDate}
                            onChange={e => setMovieForm({...movieForm, releaseDate: e.target.value})}
                            className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                            }`}
                          />
                        </div>
                        <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all flex items-center justify-center space-x-2">
                          <FiPlus /> <span>{isEditingContent?.type === 'movie' ? t('update_movie') : t('save_movie')}</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {}
                    <div className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <div className="p-8 border-b border-white/5">
                        <h3 className="font-black uppercase tracking-widest text-sm">{t('banners')}</h3>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {banners.map((b, i) => (
                          <div key={b._id || `banner-${i}`} className="p-6 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="flex items-center space-x-4">
                              <img 
                                src={b.image || b.movie?.posterPath || 'https://placehold.co/160x100/1a1a1a/e50914?text=No+Image'} 
                                className="w-16 h-10 object-cover rounded-lg border border-white/5" 
                                alt="" 
                              />
                              <div>
                                <h4 className="font-bold text-xs">{b.title}</h4>
                                <p className="text-[10px] text-neutral-500">{b.movie?.title || 'External Link'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleEditBannerClick(b)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                                <FiEdit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteBanner(b._id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Movie List */}
                    <div className={`rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <div className="p-8 border-b border-white/5">
                        <h3 className="font-black uppercase tracking-widest text-sm">{t('movies_count')}</h3>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {movies.map((m, i) => (
                          <div key={m._id || `movie-${i}`} className="p-6 border-b border-white/5 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="flex items-center space-x-4">
                              <img 
                                src={m.posterPath || m.poster_path || 'https://placehold.co/100x140/1a1a1a/e50914?text=No+Poster'} 
                                className="w-10 h-14 object-cover rounded-lg border border-white/5" 
                                alt="" 
                              />
                              <div>
                                <h4 className="font-bold text-xs">{m.title}</h4>
                                <p className="text-[10px] text-neutral-500">{m.release_date}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleEditMovieClick(m)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                                <FiEdit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteMovie(m._id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-[2.5rem] border overflow-hidden flex h-[700px] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  {/* Sidebar: Admin List & Groups */}
                  <div className={`w-72 border-r flex flex-col ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="p-6 border-b border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-500">{t('admin_chat')}</h4>
                        <button 
                          onClick={() => setShowCreateGroup(true)}
                          className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                          title={t('create_group')}
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>

                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={12} />
                        <input 
                          type="text" 
                          placeholder={t('search_users')}
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          className={`w-full pl-8 pr-4 py-2 rounded-xl text-[10px] font-bold outline-none border transition-all ${
                            theme === 'dark' ? 'bg-black/40 border-white/10 text-white focus:border-primary' : 'bg-white border-gray-200 text-dark focus:border-primary'
                          }`}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            setSelectedReceiver('group');
                            setSelectedGroupId(null);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                            selectedReceiver === 'group' && !selectedGroupId
                              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                              : 'hover:bg-white/5 text-neutral-400'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                            <FiUsers size={18} />
                          </div>
                          <div className="text-left overflow-hidden">
                            <p className="font-black text-[11px] uppercase">{t('all_admins')}</p>
                            <p className="text-[8px] font-bold opacity-60 uppercase truncate">{t('group_chat_desc')}</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {/* Groups List */}
                      {adminGroups.filter(g => g.name.toLowerCase().includes(adminSearchQuery.toLowerCase())).length > 0 && (
                        <div className="space-y-2">
                          <p className="px-2 text-[9px] font-black uppercase text-neutral-600 tracking-widest">{t('groups')}</p>
                          {adminGroups
                            .filter(g => g.name.toLowerCase().includes(adminSearchQuery.toLowerCase()))
                            .map(group => (
                            <div key={group._id} className="relative group/group-item">
                              <button 
                                onClick={() => {
                                  setSelectedGroupId(group._id);
                                  setSelectedReceiver('group');
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                                  selectedGroupId === group._id 
                                    ? 'bg-white/10 border border-white/10 shadow-xl' 
                                    : 'hover:bg-white/5 border border-transparent text-neutral-500'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                  <FiMessageCircle size={18} />
                                </div>
                                <div className="text-left overflow-hidden pr-6">
                                  <p className={`font-black text-[11px] uppercase truncate ${selectedGroupId === group._id ? 'text-white' : ''}`}>
                                    {group.name}
                                  </p>
                                  <p className="text-[8px] font-bold opacity-60 uppercase truncate">{group.members.length} {t('members')}</p>
                                </div>
                              </button>
                              
                              {group.createdBy?._id === user?._id && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAdminGroup(group._id);
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-600 hover:text-red-500 opacity-0 group-hover/group-item:opacity-100 transition-all"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Admins List */}
                      <div className="space-y-2">
                        <p className="px-2 text-[9px] font-black uppercase text-neutral-600 tracking-widest">{t('private_messages')}</p>
                        {adminList
                          .filter(a => user && a._id !== user._id && a.username.toLowerCase().includes(adminSearchQuery.toLowerCase()))
                          .map(admin => (
                          <button 
                            key={admin._id}
                            onClick={() => {
                              setSelectedReceiver(admin);
                              setSelectedGroupId(null);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                              selectedReceiver !== 'group' && selectedReceiver?._id === admin._id 
                                ? 'bg-white/10 border border-white/10 shadow-xl' 
                                : 'hover:bg-white/5 border border-transparent text-neutral-500'
                            }`}
                          >
                            <Avatar src={admin.avatar} size={40} className="rounded-xl flex-shrink-0" />
                            <div className="text-left min-w-0">
                              <p className={`font-black text-[11px] uppercase truncate ${selectedReceiver !== 'group' && selectedReceiver?._id === admin._id ? 'text-white' : ''}`}>
                                {admin.username}
                              </p>
                              <p className="text-[8px] font-bold opacity-60 uppercase truncate">{admin.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="flex-grow flex flex-col min-w-0">
                    {/* Chat Header */}
                    <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                      <div>
                        <h3 className="font-black uppercase tracking-widest text-sm flex items-center">
                          <FiActivity className="mr-3 text-primary" /> 
                          {selectedGroupId 
                            ? adminGroups.find(g => g._id === selectedGroupId)?.name 
                            : selectedReceiver === 'group' 
                              ? t('admin_chat_room') 
                              : `${t('chat_with')} ${selectedReceiver.username}`
                          }
                        </h3>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1">
                          {selectedGroupId 
                            ? `${adminGroups.find(g => g._id === selectedGroupId)?.members.length} ${t('members')}` 
                            : selectedReceiver === 'group' 
                              ? t('admin_chat_desc') 
                              : t('private_chat_desc')
                          }
                        </p>
                      </div>
                      {(selectedReceiver === 'group' || selectedGroupId) && (
                        <div className="flex -space-x-2">
                          {(selectedGroupId 
                            ? (adminGroups.find(g => g._id === selectedGroupId)?.members || []) 
                            : adminList
                          ).slice(0, 5).map((a: any, i: number) => (
                            <Avatar key={i} src={a.avatar} size={24} className="border-2 border-dark" />
                          ))}
                        </div>
                      )}
                    </div>

                    {}
                    <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col-reverse">
                      <div className="flex flex-col space-y-6">
                        {chatLoading ? (
                          <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <div className="text-center py-20">
                            <FiMessageSquare size={40} className="mx-auto mb-4 text-neutral-700 opacity-20" />
                            <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">
                              {selectedReceiver === 'group' ? t('no_chat_group') : t('no_chat_private')}
                            </p>
                          </div>
                        ) : chatMessages.map((msg, i) => (
                          <div key={msg._id} className={`flex items-start gap-4 group ${user && msg.user?._id === user._id ? 'flex-row-reverse' : ''}`}>
                            <Avatar src={msg.user?.avatar} size={36} className="flex-shrink-0 mt-1" />
                            <div className={`flex flex-col max-w-[70%] ${user && msg.user?._id === user._id ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[9px] font-black uppercase text-neutral-500">{msg.user?.username}</span>
                                <span className="text-[7px] font-bold text-neutral-600">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {user && msg.user?._id === user._id && (
                                  <div className={`flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity mb-1 ${msg.user?._id === user._id ? 'justify-end' : ''}`}>
                                    <button 
                                      onClick={() => setEditingAdminMsg({ id: msg._id, content: msg.content })}
                                      className="text-neutral-500 hover:text-blue-500 transition-colors"
                                    >
                                      <FiEdit2 size={10} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAdminMsg(msg._id)}
                                      className="text-neutral-500 hover:text-red-500 transition-colors"
                                    >
                                      <FiTrash2 size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed group relative ${
                                msg.user?._id === user?._id 
                                  ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                                  : theme === 'dark' ? 'bg-white/10 text-white rounded-tl-none border border-white/5' : 'bg-gray-100 text-dark rounded-tl-none'
                              }`}>
                                {editingAdminMsg?.id === msg._id ? (
                                  <form onSubmit={handleUpdateAdminMsg} className="flex flex-col gap-2 min-w-[200px]">
                                    <textarea 
                                      autoFocus
                                      className={`w-full bg-transparent border-b border-white/20 outline-none text-xs py-1 resize-none ${msg.user?._id === user?._id ? 'text-white' : 'text-dark'}`}
                                      value={editingAdminMsg.content}
                                      onChange={(e) => setEditingAdminMsg({ ...editingAdminMsg, content: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') setEditingAdminMsg(null);
                                        if (e.key === 'Enter' && !e.shiftKey) handleUpdateAdminMsg(e);
                                      }}
                                    />
                                    <div className="flex justify-end space-x-2">
                                      <button type="button" onClick={() => setEditingAdminMsg(null)} className="text-[8px] uppercase font-black opacity-60 hover:opacity-100">{t('cancel')}</button>
                                      <button type="submit" className="text-[8px] uppercase font-black hover:underline">{t('save')}</button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    {msg.content}
                                    {msg.isEdited && (
                                      <span className={`text-[7px] font-black uppercase opacity-40 block mt-1 ${msg.user?._id === user?._id ? 'text-right' : ''}`}>
                                        ({t('edited')})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className={`p-6 border-t ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                      <form onSubmit={handleSendChatMessage} className="relative flex items-center gap-3">
                        <div className="relative flex-grow">
                          <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={selectedReceiver === 'group' ? t('chat_placeholder_group') : t('chat_placeholder_private', { name: selectedReceiver.username })}
                            className={`w-full border rounded-2xl py-4 pl-6 pr-14 text-xs outline-none focus:border-primary transition-all ${
                              theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-dark shadow-inner'
                            }`}
                          />
                          <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                              newMessage.trim() 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' 
                                : 'bg-neutral-800 text-neutral-600'
                            }`}
                          >
                            <FiSend size={16} />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'support' && (
                <motion.div
                  key="support"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-[2.5rem] border overflow-hidden flex h-[700px] ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}
                >
                  {/* Left Sidebar: Conversations */}
                  <div className={`w-80 border-r flex flex-col ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="p-6 border-b border-white/5 space-y-4">
                      <div>
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-500 mb-2">{t('customer_support')}</h4>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{t('messages_from_users')}</p>
                      </div>

                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={12} />
                        <input 
                          type="text" 
                          placeholder={t('search_users')}
                          value={supportSearchQuery}
                          onChange={(e) => setSupportSearchQuery(e.target.value)}
                          className={`w-full pl-8 pr-4 py-2 rounded-xl text-[10px] font-bold outline-none border transition-all ${
                            theme === 'dark' ? 'bg-black/40 border-white/10 text-white focus:border-primary' : 'bg-white border-gray-200 text-dark focus:border-primary'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {supportConversations.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                          <FiMessageSquare size={30} className="mx-auto mb-2" />
                          <p className="text-[8px] font-black uppercase">{t('no_support_requests')}</p>
                        </div>
                      ) : (
                        supportConversations
                          .filter(conv => conv.user.username.toLowerCase().includes(supportSearchQuery.toLowerCase()))
                          .map((conv) => (
                            <div key={conv.user._id} className="relative group">
                              <button 
                                onClick={() => setSelectedSupportUser(conv.user)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all relative ${
                                  selectedSupportUser?._id === conv.user._id 
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                                    : theme === 'dark' ? 'hover:bg-white/5 text-neutral-400' : 'hover:bg-gray-100 text-neutral-600'
                                }`}
                              >
                                <div className="relative flex-shrink-0">
                                  <Avatar src={conv.user.avatar} size={44} className="rounded-xl" />
                                  {conv.unreadCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 ${
                                      selectedSupportUser?._id === conv.user._id ? 'border-primary' : (theme === 'dark' ? 'border-[#1a1a1a]' : 'border-white')
                                    }`}>
                                      {conv.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <div className="text-left min-w-0 flex-grow pr-6">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className={`font-black text-[11px] uppercase truncate ${selectedSupportUser?._id === conv.user._id ? 'text-white' : (theme === 'dark' ? 'text-white' : 'text-dark')}`}>
                                      {conv.user.username}
                                    </p>
                                    <span className={`text-[8px] font-bold opacity-60 flex-shrink-0`}>
                                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] font-medium truncate opacity-70 ${selectedSupportUser?._id === conv.user._id ? 'text-white/80' : ''}`}>
                                    {conv.lastMessage}
                                  </p>
                                </div>
                              </button>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSupportConversation(conv.user._id);
                                }}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                  selectedSupportUser?._id === conv.user._id ? 'text-white/40 hover:text-white' : 'text-red-500/40 hover:text-red-500'
                                }`}
                                title={t('delete_conversation')}
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Right: Chat Window */}
                  <div className="flex-grow flex flex-col min-w-0">
                    {selectedSupportUser ? (
                      <>
                        <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-center gap-4">
                            <Avatar src={selectedSupportUser.avatar} size={48} />
                            <div>
                              <h3 className="font-black uppercase tracking-widest text-sm">{selectedSupportUser.username}</h3>
                              <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1">{selectedSupportUser.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">{t('support_label')}</span>
                          </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar flex flex-col">
                          {supportLoading && supportMessages.length === 0 ? (
                            <div className="flex justify-center py-20">
                              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            </div>
                          ) : supportMessages.map((msg, i) => (
                            <div key={msg._id || i} className={`flex items-start gap-4 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                              <Avatar src={msg.sender?.avatar} size={36} className="flex-shrink-0 mt-1" />
                              <div className={`flex flex-col max-w-[70%] ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                  <span className="text-[9px] font-black uppercase text-neutral-500">{msg.sender?.username}</span>
                                  <span className="text-[7px] font-bold text-neutral-600">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed group relative shadow-sm ${
                                  msg.isAdmin 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : theme === 'dark' ? 'bg-white/10 text-white rounded-tl-none border border-white/5' : 'bg-gray-100 text-dark rounded-tl-none'
                                }`}>
                                  {editingSupportMsg?.id === msg._id ? (
                                    <form onSubmit={handleUpdateSupportMsg} className="flex flex-col gap-1.5 min-w-[200px]">
                                      <textarea
                                        autoFocus
                                        className={`w-full bg-transparent border-b border-white/20 outline-none text-xs py-1 resize-none ${msg.isAdmin ? 'text-white' : 'text-dark'}`}
                                        value={editingSupportMsg?.content || ""}
                                      onChange={(e) => editingSupportMsg && setEditingSupportMsg({ ...editingSupportMsg, content: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') setEditingSupportMsg(null);
                                          if (e.key === 'Enter' && !e.shiftKey) handleUpdateSupportMsg(e);
                                        }}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setEditingSupportMsg(null)} className="text-[8px] uppercase font-black opacity-60 hover:opacity-100">{t('cancel')}</button>
                                        <button type="submit" className="text-[8px] uppercase font-black hover:underline">{t('save')}</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      {msg.content}
                                      {msg.isEdited && (
                                        <span className={`text-[7px] font-black uppercase opacity-40 block mt-1 ${msg.isAdmin ? 'text-right' : 'text-left'}`}>
                                          {t('edited_label')}
                                        </span>
                                      )}
                                      
                                      {/* Hover Actions */}
                                      {msg.sender?._id === user?._id && (
                                        <div className={`absolute top-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1 ${msg.isAdmin ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                          <button 
                                            onClick={() => setEditingSupportMsg({ id: msg._id, content: msg.content })}
                                            className="text-neutral-500 hover:text-blue-500 transition-colors"
                                          >
                                            <FiEdit2 size={10} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteSupportMsg(msg._id)}
                                            className="text-neutral-500 hover:text-red-500 transition-colors"
                                          >
                                            <FiTrash2 size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={`p-6 border-t ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                          <form onSubmit={handleSendSupportReply} className="relative flex items-center gap-3">
                            <input 
                              type="text" 
                              value={supportReply}
                              onChange={(e) => setSupportReply(e.target.value)}
                              onKeyDown={handleSupportKeyDown}
                              placeholder={t('type_response')}
                              className={`w-full border rounded-2xl py-4 pl-6 pr-14 text-xs outline-none focus:border-primary transition-all ${
                                theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-gray-200 text-dark shadow-inner'
                              }`}
                            />
                            <button 
                              type="submit"
                              disabled={!supportReply.trim()}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                                supportReply.trim() 
                                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' 
                                  : 'bg-neutral-800 text-neutral-600'
                              }`}
                            >
                              <FiSend size={16} />
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center opacity-20 select-none">
                        <FiMessageSquare size={80} className="mb-6" />
                        <h3 className="font-black uppercase tracking-widest text-xl">{t('select_conversation')}</h3>
                        <p className="text-xs font-bold uppercase mt-2">{t('respond_to_user')}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateGroup(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl ${
                theme === 'dark' ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'
              }`}
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-black uppercase tracking-widest text-sm">{t('create_new_group')}</h3>
                <button onClick={() => setShowCreateGroup(false)} className="text-neutral-500 hover:text-white transition-all"><FiX size={20} /></button>
              </div>
              
              <form onSubmit={handleCreateGroup} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest px-1">{t('group_name')}</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder={t('enter_group_name')}
                    className={`w-full border rounded-xl p-4 text-xs outline-none focus:border-primary transition-all ${
                      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-100 border-gray-200 text-dark'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-widest px-1">{t('select_members')}</label>
                  <div className={`max-h-[200px] overflow-y-auto border rounded-xl p-2 space-y-1 custom-scrollbar ${
                    theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'
                  }`}>
                    {adminList.filter(a => user && a._id !== user._id).map(admin => (
                      <label key={admin._id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedGroupMembers.includes(admin._id) 
                          ? 'bg-primary/20 text-primary' 
                          : 'hover:bg-white/5 text-neutral-500'
                      }`}>
                        <input 
                          type="checkbox"
                          checked={selectedGroupMembers.includes(admin._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupMembers([...selectedGroupMembers, admin._id]);
                            } else {
                              setSelectedGroupMembers(selectedGroupMembers.filter(id => id !== admin._id));
                            }
                          }}
                          className="hidden"
                        />
                        <Avatar src={admin.avatar} size={30} />
                        <span className="text-[11px] font-bold uppercase truncate">{admin.username}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                    newGroupName.trim() && selectedGroupMembers.length > 0
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-neutral-800 text-neutral-600'
                  }`}
                >
                  {t('create_group')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
