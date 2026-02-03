'use client';

import React from 'react';
import Link from 'next/link';

export default function MediaHelpPage() {
  return (
    <div className="prose prose-emerald max-w-none">
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Media Gallery</h1>
            <p className="text-gray-600">Managing images, videos, and audio files</p>
          </div>
        </div>
      </div>

      <h2>About Media Gallery</h2>
      <p>
        Each project can have a media gallery containing images, videos, and audio files. 
        Media helps tell the story of your charity work and shows donors the impact of their contributions.
      </p>

      <h2>Viewing Media</h2>
      <p>
        Access the Media tab on any project&apos;s detail page to see:
      </p>
      <ul>
        <li><strong>Media Grid</strong> - Thumbnails of all uploaded media</li>
        <li><strong>Filter Tabs</strong> - Filter by All, Images, Videos, or Audio</li>
        <li><strong>Lightbox View</strong> - Click any item to view it larger</li>
        <li><strong>Media Counts</strong> - Total number of items by type</li>
      </ul>

      <h2>Uploading Media (Fund Admin+)</h2>
      <div className="not-prose bg-green-50 border border-green-200 rounded-xl p-6 my-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-800 mb-2">Permission Required</h3>
            <p className="text-green-700 text-sm">
              Only Fund Admins (for assigned projects), Admins, and Super Admins can upload and manage media.
            </p>
          </div>
        </div>
      </div>

      <p>To upload media:</p>
      <ol>
        <li>Go to the project&apos;s <strong>Media</strong> tab</li>
        <li>Click <strong>&quot;Upload Media&quot;</strong> button</li>
        <li>Either drag &amp; drop files or click to browse</li>
        <li>Optionally add a caption for each file</li>
        <li>Click <strong>&quot;Upload&quot;</strong> to save</li>
      </ol>

      <h3>Supported File Types &amp; Limits</h3>
      <div className="not-prose bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Images</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-13">
              <li>• JPG / JPEG</li>
              <li>• PNG</li>
              <li>• GIF</li>
              <li>• WebP</li>
            </ul>
            <p className="text-sm font-medium text-gray-700 mt-2">Max: 10 MB</p>
          </div>
          <div>
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Videos</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-13">
              <li>• MP4</li>
              <li>• WebM</li>
              <li>• MOV</li>
            </ul>
            <p className="text-sm font-medium text-gray-700 mt-2">Max: 100 MB</p>
          </div>
          <div>
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Audio</h4>
            </div>
            <ul className="text-sm text-gray-600 space-y-1 ml-13">
              <li>• MP3</li>
              <li>• WAV</li>
              <li>• OGG</li>
            </ul>
            <p className="text-sm font-medium text-gray-700 mt-2">Max: 20 MB</p>
          </div>
        </div>
      </div>

      <h2>Managing Media</h2>
      <h3>Editing Captions</h3>
      <p>
        Click on a media item in the gallery, then click the edit button to update its caption. 
        Captions help describe what the image/video/audio shows.
      </p>

      <h3>Deleting Media</h3>
      <p>
        To delete media, hover over the item in the gallery and click the delete button. 
        Confirm the deletion when prompted. Deleted media cannot be recovered.
      </p>

      <h3>Reordering Media</h3>
      <p>
        Media items can be reordered by dragging them within the gallery (when available). 
        The display order determines how media appears to visitors.
      </p>

      <h2>Best Practices</h2>
      <div className="not-prose bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
        <h3 className="font-semibold text-amber-800 mb-3">Tips for Great Media</h3>
        <ul className="space-y-2 text-amber-700 text-sm">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Upload high-quality images that clearly show your charity work</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Add descriptive captions to help viewers understand the context</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Get consent before uploading photos that include identifiable people</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Compress large videos before uploading for faster load times</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Regularly update the gallery with new photos from charity events</span>
          </li>
        </ul>
      </div>

      {/* Related Topics */}
      <h2 className="mt-10">Related Topics</h2>
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/help/projects" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Projects</h3>
          <p className="text-sm text-gray-500 mt-1">Managing charity projects</p>
        </Link>
        <Link href="/help/distributions" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">Distributions</h3>
          <p className="text-sm text-gray-500 mt-1">Upload proof documents</p>
        </Link>
      </div>
    </div>
  );
}
