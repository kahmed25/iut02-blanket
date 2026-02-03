'use client';

import React, { useState, useRef, useCallback } from 'react';
import { mediaApi, Media } from '@/services/fundApi';

interface MediaUploaderProps {
  projectId: string;
  onUploadComplete?: (media: Media) => void;
  acceptedTypes?: ('image' | 'video' | 'audio')[];
}

// File type configurations
const FILE_CONFIG = {
  image: {
    accept: '.jpg,.jpeg,.png,.gif,.webp',
    maxSize: 10 * 1024 * 1024, // 10 MB
    label: 'Photos',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  video: {
    accept: '.mp4,.webm,.mov',
    maxSize: 100 * 1024 * 1024, // 100 MB
    label: 'Videos',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  audio: {
    accept: '.mp3,.wav,.ogg',
    maxSize: 20 * 1024 * 1024, // 20 MB
    label: 'Audio',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
};

export default function MediaUploader({
  projectId,
  onUploadComplete,
  acceptedTypes = ['image', 'video', 'audio'],
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptString = acceptedTypes.map(t => FILE_CONFIG[t].accept).join(',');
  const maxSizeBytes = Math.max(...acceptedTypes.map(t => FILE_CONFIG[t].maxSize));

  const getFileType = (file: File): 'image' | 'video' | 'audio' | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext) return null;

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    return null;
  };

  const validateFile = (file: File): string | null => {
    const fileType = getFileType(file);
    if (!fileType) {
      return 'Unsupported file type';
    }
    if (!acceptedTypes.includes(fileType)) {
      return `${fileType} files are not allowed here`;
    }
    if (file.size > FILE_CONFIG[fileType].maxSize) {
      const maxMB = FILE_CONFIG[fileType].maxSize / (1024 * 1024);
      return `File too large. Max size: ${maxMB} MB`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    const fileType = getFileType(file);
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setProgress(10);
      setError(null);

      // Simulate progress (since we can't track actual upload progress with fetch)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const media = await mediaApi.upload(projectId, selectedFile, caption || undefined);

      clearInterval(progressInterval);
      setProgress(100);

      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setPreview(null);
        setCaption('');
        setProgress(0);
        setUploading(false);
        onUploadComplete?.(media);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Media</h3>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* File selected state */}
      {selectedFile ? (
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : getFileType(selectedFile) === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                getFileType(selectedFile) === 'image' ? 'bg-green-100 text-green-700' :
                getFileType(selectedFile) === 'video' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {getFileType(selectedFile)}
              </span>
            </div>
          </div>

          {/* Caption input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={uploading}
            />
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptString}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex justify-center gap-4 mb-4 text-gray-400">
            {acceptedTypes.map(type => (
              <div key={type} className="flex flex-col items-center">
                {FILE_CONFIG[type].icon}
                <span className="text-xs mt-1">{FILE_CONFIG[type].label}</span>
              </div>
            ))}
          </div>

          <p className="text-gray-600 font-medium">
            {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Max: {acceptedTypes.map(t => `${t} ${FILE_CONFIG[t].maxSize / (1024 * 1024)}MB`).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
