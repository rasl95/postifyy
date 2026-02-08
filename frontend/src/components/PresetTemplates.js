import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Loader2, Sparkles, ArrowRight, Clock, Eye, Check, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Local storage key for recently used templates
const RECENT_TEMPLATES_KEY = 'postify_recent_templates';

export const PresetTemplates = ({ 
  contentType = 'social_post', 
  onSelect, 
  selectedId = null,
  compact = false,
  showRecent = true,
  showRecommended = true
}) => {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [recentTemplateIds, setRecentTemplateIds] = useState([]);

  useEffect(() => {
    fetchTemplates();
    loadRecentTemplates();
  }, []);

  const loadRecentTemplates = () => {
    try {
      const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
      if (stored) {
        const recent = JSON.parse(stored);
        setRecentTemplateIds(recent[contentType] || []);
      }
    } catch (error) {
      console.error('Failed to load recent templates:', error);
    }
  };

  const saveRecentTemplate = (templateId) => {
    try {
      const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
      const recent = stored ? JSON.parse(stored) : {};
      
      // Add to front, remove duplicates, limit to 3
      const typeRecent = recent[contentType] || [];
      const updated = [templateId, ...typeRecent.filter(id => id !== templateId)].slice(0, 3);
      recent[contentType] = updated;
      
      localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(recent));
      setRecentTemplateIds(updated);
    } catch (error) {
      console.error('Failed to save recent template:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.templates || {});
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const contentTemplates = templates[contentType] || [];

  // Get recently used templates
  const recentTemplates = useMemo(() => {
    if (!showRecent || recentTemplateIds.length === 0) return [];
    return recentTemplateIds
      .map(id => contentTemplates.find(t => t.id === id))
      .filter(Boolean);
  }, [contentTemplates, recentTemplateIds, showRecent]);

  // Get recommended templates (based on user's plan - Pro gets more options)
  const recommendedTemplates = useMemo(() => {
    if (!showRecommended) return [];
    const isPro = user?.subscription_plan === 'pro' || user?.subscription_plan === 'business';
    
    // Filter out recent templates from recommendations
    const available = contentTemplates.filter(t => !recentTemplateIds.includes(t.id));
    
    // Pro users get targeted recommendations
    if (isPro && available.length > 0) {
      return available.slice(0, 2);
    }
    
    return [];
  }, [contentTemplates, recentTemplateIds, user, showRecommended]);

  const handleSelect = (template) => {
    saveRecentTemplate(template.id);
    onSelect?.(template);
  };

  const handlePreview = (e, template) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (contentTemplates.length === 0) return null;

  // Compact pill variant
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {contentTemplates.map((template) => (
          <Button
            key={template.id}
            variant={selectedId === template.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect(template)}
            className={`transition-all ${
              selectedId === template.id
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-white hover:border-purple-500/50'
            }`}
            data-testid={`template-${template.id}`}
          >
            <span className="mr-1.5">{template.icon}</span>
            {template.name[language] || template.name.en}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Recently Used Section */}
        {recentTemplates.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {language === 'ru' ? 'Недавние' : 'Recent'}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {recentTemplates.map((template) => (
                <button
                  key={`recent-${template.id}`}
                  onClick={() => handleSelect(template)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedId === template.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/30 hover:bg-white/10'
                  }`}
                >
                  <span>{template.icon}</span>
                  <span className="text-sm">{template.name[language] || template.name.en}</span>
                  {selectedId === template.id && <Check className="w-3 h-3 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Section */}
        {recommendedTemplates.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-500/80 uppercase tracking-wider">
                {language === 'ru' ? 'Рекомендуем' : 'Recommended'}
              </span>
            </div>
            <div className="flex gap-3">
              {recommendedTemplates.map((template) => (
                <Card
                  key={`rec-${template.id}`}
                  onClick={() => handleSelect(template)}
                  className="flex-1 p-3 cursor-pointer bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.icon}</span>
                    <span className="text-sm font-medium text-white">
                      {template.name[language] || template.name.en}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Templates Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">
              {language === 'ru' ? 'Быстрые шаблоны' : 'Quick Templates'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {contentTemplates.map((template) => (
              <Card
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
                  selectedId === template.id
                    ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10'
                }`}
                data-testid={`template-card-${template.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{template.icon}</span>
                    <h4 className="font-medium text-white text-sm">
                      {template.name[language] || template.name.en}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedId === template.id && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <button
                      onClick={(e) => handlePreview(e, template)}
                      className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                      title={language === 'ru' ? 'Предпросмотр' : 'Preview'}
                    >
                      <Eye className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {template.hints && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {template.hints[language] || template.hints.en}
                  </p>
                )}
                
                {template.structure && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <ArrowRight className="w-3 h-3" />
                    <span>{template.structure}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="bg-[#111113] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{previewTemplate?.icon}</span>
              {previewTemplate?.name[language] || previewTemplate?.name?.en}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {previewTemplate?.hints?.[language] || previewTemplate?.hints?.en}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Template Settings Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">
                {language === 'ru' ? 'Настройки шаблона' : 'Template Settings'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {previewTemplate?.tone && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'ru' ? 'Тон' : 'Tone'}
                    </p>
                    <p className="text-sm text-white capitalize">{previewTemplate.tone}</p>
                  </div>
                )}
                {previewTemplate?.goal && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">
                      {language === 'ru' ? 'Цель' : 'Goal'}
                    </p>
                    <p className="text-sm text-white capitalize">{previewTemplate.goal}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Structure Preview */}
            {previewTemplate?.structure && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500 mb-2">
                  {language === 'ru' ? 'Структура поста' : 'Post Structure'}
                </p>
                <p className="text-sm text-gray-300">{previewTemplate.structure}</p>
              </div>
            )}

            {/* Example output if available */}
            {previewTemplate?.example && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-400 mb-2">
                  {language === 'ru' ? 'Пример результата' : 'Example Output'}
                </p>
                <p className="text-sm text-gray-300">{previewTemplate.example}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
              className="flex-1 border-white/20"
            >
              {language === 'ru' ? 'Закрыть' : 'Close'}
            </Button>
            <Button
              onClick={() => {
                handleSelect(previewTemplate);
                setPreviewTemplate(null);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {language === 'ru' ? 'Использовать' : 'Use Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Horizontal scrollable variant
export const PresetTemplatesScroll = ({ contentType, onSelect, selectedId }) => {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/templates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTemplates(response.data.templates?.[contentType] || []);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [token, contentType]);

  if (loading || templates.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div className="flex gap-3 min-w-max">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect?.(template)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
              selectedId === template.id
                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/30'
            }`}
          >
            <span>{template.icon}</span>
            <span className="text-sm font-medium">
              {template.name[language] || template.name.en}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
