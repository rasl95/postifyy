import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Loader2, Star, Copy, Check, Trash2, Lock, Sparkles, FolderPlus,
  Folder, FolderOpen, Search, MoreVertical, Edit2, Move, GripVertical,
  ChevronRight, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FOLDER_COLORS = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6'
];

export const Favorites = () => {
  const { token, user } = useAuth();
  const { t, language } = useLanguage();
  const { trackFavorite, trackInteraction } = useAnalytics();
  
  const [favorites, setFavorites] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  
  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [renameFolderName, setRenameFolderName] = useState('');

  const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';

  const fetchFolders = useCallback(async () => {
    if (!isPro) return;
    try {
      const response = await axios.get(`${API_URL}/api/favorites/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data.folders || []);
      setUncategorizedCount(response.data.uncategorized_count || 0);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  }, [isPro, token]);

  const fetchFavorites = useCallback(async () => {
    if (!isPro) {
      setLoading(false);
      return;
    }
    try {
      let url = `${API_URL}/api/favorites`;
      const params = new URLSearchParams();
      
      if (selectedFolder) {
        params.append('folder_id', selectedFolder);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [isPro, token, selectedFolder]);

  const searchFavorites = useCallback(async (query) => {
    if (!query.trim()) {
      fetchFavorites();
      return;
    }
    try {
      const response = await axios.get(
        `${API_URL}/api/favorites/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavorites(response.data.items || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [token, fetchFavorites]);

  useEffect(() => {
    fetchFolders();
    fetchFavorites();
  }, [fetchFolders, fetchFavorites]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchFavorites(searchQuery);
      } else {
        fetchFavorites();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchFavorites, fetchFavorites]);

  const copyToClipboard = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    trackInteraction('copy', id, 'favorite');
    toast.success(t('generator.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const removeFavorite = async (favoriteId) => {
    setDeletingId(favoriteId);
    try {
      await axios.delete(`${API_URL}/api/favorites/${favoriteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      trackFavorite('remove', favoriteId);
      toast.success(t('favorites.removed'));
      fetchFolders(); // Update counts
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'Failed to remove');
    } finally {
      setDeletingId(null);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/favorites/folders`,
        { name: newFolderName, color: newFolderColor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolders([...folders, response.data.folder]);
      setShowCreateFolder(false);
      setNewFolderName('');
      toast.success(language === 'ru' ? 'Папка создана' : 'Folder created');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка создания' : 'Failed to create folder');
    }
  };

  const renameFolder = async () => {
    if (!renameFolderName.trim() || !showRenameFolder) return;
    try {
      await axios.put(
        `${API_URL}/api/favorites/folders/${showRenameFolder}`,
        { name: renameFolderName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFolders(folders.map(f => 
        f.id === showRenameFolder ? { ...f, name: renameFolderName } : f
      ));
      setShowRenameFolder(null);
      setRenameFolderName('');
      toast.success(language === 'ru' ? 'Папка переименована' : 'Folder renamed');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка' : 'Failed');
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      await axios.delete(`${API_URL}/api/favorites/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(folders.filter(f => f.id !== folderId));
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      fetchFavorites();
      toast.success(language === 'ru' ? 'Папка удалена' : 'Folder deleted');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка' : 'Failed');
    }
  };

  const moveFavorite = async (favoriteId, folderId) => {
    try {
      await axios.put(
        `${API_URL}/api/favorites/${favoriteId}/move`,
        { folder_id: folderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowMoveDialog(null);
      fetchFavorites();
      fetchFolders();
      toast.success(language === 'ru' ? 'Перемещено' : 'Moved');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка' : 'Failed');
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatContentType = (type) => {
    if (language === 'ru') {
      const types = {
        'social_post': 'Пост для соцсетей',
        'video_idea': 'Идеи для видео',
        'product_description': 'Описание продукта'
      };
      return types[type] || type;
    }
    return type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Show upgrade prompt for Free users
  if (!isPro) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            <Star className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('favorites.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{t('favorites.subtitle')}</p>
          </div>
        </div>

        <Card className="bg-[#111113] border-white/10">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#FF3B30]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{language === 'ru' ? 'Функция Pro' : 'Pro Feature'}</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">{t('favorites.proOnly')}</p>
            <Button 
              onClick={() => window.location.href = '/settings'}
              className="bg-[#FF3B30] hover:bg-[#FF4D42] shadow-lg shadow-[#FF3B30]/30"
            >
              {language === 'ru' ? 'Перейти на Pro' : 'Upgrade to Pro'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center">
            <Star className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {t('favorites.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {favorites.length} {language === 'ru' ? 'элементов' : 'items'}
            </p>
          </div>
        </div>
        
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder={language === 'ru' ? 'Поиск...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#111113] border-white/10 text-white w-64"
              data-testid="favorites-search"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-white" />
              </button>
            )}
          </div>
          <Button
            onClick={() => setShowCreateFolder(true)}
            variant="outline"
            className="border-white/20 text-gray-300 hover:bg-white/10"
            data-testid="create-folder-btn"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Папка' : 'Folder'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders */}
        <div className="lg:col-span-1 space-y-2">
          <Card className="bg-[#111113] border-white/10 p-3">
            {/* All Favorites */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                selectedFolder === null ? 'bg-[#FF3B30]/20 text-white' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="flex-1 text-left text-sm font-medium">
                {language === 'ru' ? 'Все избранные' : 'All Favorites'}
              </span>
            </button>
            
            {/* Uncategorized */}
            <button
              onClick={() => setSelectedFolder('uncategorized')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                selectedFolder === 'uncategorized' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span className="flex-1 text-left text-sm">
                {language === 'ru' ? 'Без папки' : 'Uncategorized'}
              </span>
              <span className="text-xs text-gray-500">{uncategorizedCount}</span>
            </button>
            
            {/* Custom Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="group relative">
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    selectedFolder === folder.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
                  <span className="flex-1 text-left text-sm truncate">{folder.name}</span>
                  <span className="text-xs text-gray-500">{folder.count || 0}</span>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1A1A1C] border-white/10">
                    <DropdownMenuItem 
                      onClick={() => {
                        setShowRenameFolder(folder.id);
                        setRenameFolderName(folder.name);
                      }}
                      className="text-gray-300 focus:bg-white/10"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Переименовать' : 'Rename'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteFolder(folder.id)}
                      className="text-red-400 focus:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Удалить' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {favorites.length === 0 ? (
            <Card className="bg-[#111113] border-white/10">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-[#FF3B30]" />
                </div>
                <p className="text-gray-400">
                  {searchQuery 
                    ? (language === 'ru' ? 'Ничего не найдено' : 'Nothing found')
                    : t('favorites.empty')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {favorites.map((item) => (
                <Card key={item.id} className="bg-[#111113] border-white/10 group" data-testid="favorite-item">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="hidden md:flex cursor-grab text-gray-500 hover:text-gray-400 mt-1">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base text-white flex items-center gap-2 truncate">
                            <Sparkles className="w-4 h-4 text-[#FF3B30] flex-shrink-0" />
                            <span className="truncate">{formatContentType(item.content_type)}</span>
                          </CardTitle>
                          <CardDescription className="text-gray-500 text-sm mt-1 truncate">
                            {item.topic} • {formatDate(item.favorited_at)}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.generated_content, item.id)}
                          className="text-[#FF3B30] hover:text-[#FF3B30]/80 hover:bg-[#FF3B30]/10"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-white/10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1A1C] border-white/10">
                            <DropdownMenuItem 
                              onClick={() => setShowMoveDialog(item.id)}
                              className="text-gray-300 focus:bg-white/10"
                            >
                              <Move className="w-4 h-4 mr-2" />
                              {language === 'ru' ? 'Переместить' : 'Move to folder'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => removeFavorite(item.id)}
                              className="text-red-400 focus:bg-red-500/10"
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              {language === 'ru' ? 'Удалить' : 'Remove'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-[#0A0A0B] p-4 rounded-xl border border-white/5 text-sm whitespace-pre-wrap text-gray-300 max-h-40 overflow-y-auto">
                      {item.generated_content}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>{language === 'ru' ? 'Тон' : 'Tone'}: {item.tone}</span>
                      <span>{item.tokens_used} {t('history.tokens')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="bg-[#111113] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{language === 'ru' ? 'Создать папку' : 'Create Folder'}</DialogTitle>
            <DialogDescription className="text-gray-500">
              {language === 'ru' ? 'Организуйте избранное по папкам' : 'Organize your favorites into folders'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder={language === 'ru' ? 'Название папки' : 'Folder name'}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-[#0A0A0B] border-white/10 text-white"
              data-testid="folder-name-input"
            />
            <div className="flex gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewFolderColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    newFolderColor === color ? 'scale-110 ring-2 ring-white/50' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)} className="border-white/20">
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={createFolder} className="bg-[#FF3B30] hover:bg-[#FF4D42]">
              {language === 'ru' ? 'Создать' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!showRenameFolder} onOpenChange={() => setShowRenameFolder(null)}>
        <DialogContent className="bg-[#111113] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{language === 'ru' ? 'Переименовать папку' : 'Rename Folder'}</DialogTitle>
            <DialogDescription className="sr-only">{language === 'ru' ? 'Введите новое название папки' : 'Enter new folder name'}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={language === 'ru' ? 'Новое название' : 'New name'}
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              className="bg-[#0A0A0B] border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameFolder(null)} className="border-white/20">
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={renameFolder} className="bg-[#FF3B30] hover:bg-[#FF4D42]">
              {language === 'ru' ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={!!showMoveDialog} onOpenChange={() => setShowMoveDialog(null)}>
        <DialogContent className="bg-[#111113] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{language === 'ru' ? 'Переместить в папку' : 'Move to Folder'}</DialogTitle>
            <DialogDescription className="sr-only">{language === 'ru' ? 'Выберите папку' : 'Select a folder'}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <button
              onClick={() => moveFavorite(showMoveDialog, null)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
            >
              <Folder className="w-5 h-5" />
              <span>{language === 'ru' ? 'Без папки' : 'Uncategorized'}</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => moveFavorite(showMoveDialog, folder.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
              >
                <FolderOpen className="w-5 h-5" style={{ color: folder.color }} />
                <span>{folder.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
