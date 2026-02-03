'use client';

import React, { useState, useEffect } from 'react';
import { Media, MediaCounts, mediaApi } from '@/services/fundApi';

interface MediaGalleryProps {
  projectId: string;
  canManage?: boolean;
  onMediaDeleted?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MediaGallery({ projectId, canManage = false, onMediaDeleted }: MediaGalleryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [counts, setCounts] = useState<MediaCounts>({ image: 0, video: 0, audio: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, [projectId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaApi.getByProject(projectId);
      setMedia(data.media);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mediaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      setDeleting(mediaId);
      await mediaApi.delete(mediaId);
      setMedia(prev => prev.filter(m => m.media_id !== mediaId));
      setCounts(prev => ({
        ...prev,
        [media.find(m => m.media_id === mediaId)?.media_type || 'image']: Math.max(0, prev[media.find(m => m.media_id === mediaId)?.media_type as keyof MediaCounts || 'image'] as number - 1),
        total: prev.total - 1
      }));
      if (selectedMedia?.media_id === mediaId) {
        setSelectedMedia(null);
      }
      onMediaDeleted?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete media');
    } finally {
      setDeleting(null);
    }
  };

  const filteredMedia = activeFilter === 'all' 
    ? media 
    : media.filter(m => m.media_type === activeFilter);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading media...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
        <button onClick={loadMedia} className="ml-4 text-red-700 underline">Retry</button>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Media Yet</h3>
        <p className="text-gray-500 text-sm">Upload photos, videos, or audio to showcase this project.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'all', label: 'All', count: counts.total },
          { key: 'image', label: 'Photos', count: counts.image },
          { key: 'video', label: 'Videos', count: counts.video },
          { key: 'audio', label: 'Audio', count: counts.audio },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as typeof activeFilter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFilter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((item) => (
          <div
            key={item.media_id}
            onClick={() => setSelectedMedia(item)}
            className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
          >
            {item.media_type === 'image' && (
              <img
                src={`${API_URL}/uploads/${item.file_key}`}
                alt={item.caption || item.file_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            {item.media_type === 'video' && (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <video
                  src={`${API_URL}/uploads/${item.file_key}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            {item.media_type === 'audio' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4">
                <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="text-sm text-center truncate w-full">{item.file_name}</span>
              </div>
            )}

            {/* Overlay with info */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-sm truncate">{item.caption || item.file_name}</p>
              <p className="text-white/70 text-xs">{formatFileSize(item.file_size)}</p>
            </div>

            {/* Delete button */}
            {canManage && (
              <button
                onClick={(e) => handleDelete(item.media_id, e)}
                disabled={deleting === item.media_id}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deleting === item.media_id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.media_type === 'image' && (
              <img
                src={`${API_URL}/uploads/${selectedMedia.file_key}`}
                alt={selectedMedia.caption || selectedMedia.file_name}
                className="max-w-full max-h-[80vh] mx-auto rounded-lg"
              />
            )}
            {selectedMedia.media_type === 'video' && (
              <video
                src={`${API_URL}/uploads/${selectedMedia.file_key}`}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] mx-auto rounded-lg"
              />
            )}
            {selectedMedia.media_type === 'audio' && (
              <div className="bg-white rounded-xl p-8 max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-center mb-4">{selectedMedia.file_name}</h3>
                <audio
                  src={`${API_URL}/uploads/${selectedMedia.file_key}`}
                  controls
                  autoPlay
                  className="w-full"
                />
              </div>
            )}

            {/* Caption */}
            {selectedMedia.caption && (
              <div className="mt-4 text-center">
                <p className="text-white text-lg">{selectedMedia.caption}</p>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredMedia.findIndex(m => m.media_id === selectedMedia.media_id);
              const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredMedia.length - 1;
              setSelectedMedia(filteredMedia[prevIndex]);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredMedia.findIndex(m => m.media_id === selectedMedia.media_id);
              const nextIndex = currentIndex < filteredMedia.length - 1 ? currentIndex + 1 : 0;
              setSelectedMedia(filteredMedia[nextIndex]);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
