'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PhotoIcon, VideoCameraIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface MediaFile {
  id: string;
  media_type: 'image' | 'video' | 'carousel_image';
  file_path: string;
  file_name: string;
  carousel_order?: number;
  width?: number;
  height?: number;
  duration?: number;
}

interface MediaUploadPanelProps {
  postId: string;
  organizationId: string;
  format: string;
  media: MediaFile[];
  onMediaChange: () => void;
}

export function MediaUploadPanel({
  postId,
  organizationId,
  format,
  media,
  onMediaChange,
}: MediaUploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const supabase = createClient();

  const isCarousel = format === 'carousel';
  const isVideo = ['reel', 'video', 'long_video'].includes(format);
  const acceptedTypes = isVideo ? 'video/*' : 'image/*';
  const maxFiles = isCarousel ? 10 : 1;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('[MEDIA-UPLOAD] Selected files:', files.length, files.map(f => f.name));

    // Validate file count
    if (isCarousel && media.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed for carousel`);
      return;
    }

    if (!isCarousel && files.length > 1) {
      alert('Only one file allowed for this format');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${postId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${organizationId}/${fileName}`;

        console.log('[MEDIA-UPLOAD] Uploading file:', { fileName, filePath, size: file.size, type: file.type });

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('content-media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('[MEDIA-UPLOAD] Upload error:', uploadError);
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        console.log('[MEDIA-UPLOAD] File uploaded successfully:', filePath);

        // Get file metadata
        const isVideoFile = file.type.startsWith('video/');
        let width, height, duration;

        if (isVideoFile) {
          // Get video dimensions and duration
          const videoMeta = await getVideoMetadata(file);
          width = videoMeta.width;
          height = videoMeta.height;
          duration = videoMeta.duration;
        } else {
          // Get image dimensions
          const imageMeta = await getImageMetadata(file);
          width = imageMeta.width;
          height = imageMeta.height;
        }

        // Save to database
        console.log('[MEDIA-UPLOAD] Saving to database:', {
          post_id: postId,
          organization_id: organizationId,
          media_type: isCarousel ? 'carousel_image' : isVideoFile ? 'video' : 'image',
          file_path: filePath,
        });

        const { error: dbError } = await supabase.from('post_media').insert({
          post_id: postId,
          organization_id: organizationId,
          media_type: isCarousel ? 'carousel_image' : isVideoFile ? 'video' : 'image',
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          width,
          height,
          duration,
          carousel_order: isCarousel ? media.length + i : null,
        });

        if (dbError) {
          console.error('[MEDIA-UPLOAD] Database insert error:', dbError);
          alert(`Failed to save ${file.name} to database: ${dbError.message}`);
          continue;
        }

        console.log('[MEDIA-UPLOAD] File saved to database successfully');
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      console.log('[MEDIA-UPLOAD] All uploads complete, refreshing media list');
      onMediaChange();
    } catch (err) {
      console.error('[MEDIA-UPLOAD] Unexpected error:', err);
      alert(`Failed to upload media: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  }

  async function handleDelete(mediaId: string, filePath: string) {
    if (!confirm('Delete this media file?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('content-media').remove([filePath]);

      // Delete from database
      await supabase.from('post_media').delete().eq('id', mediaId);

      onMediaChange();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete media');
    }
  }

  async function handleReorder(mediaId: string, newOrder: number) {
    await supabase
      .from('post_media')
      .update({ carousel_order: newOrder })
      .eq('id', mediaId);

    onMediaChange();
  }

  const sortedMedia = isCarousel
    ? [...media].sort((a, b) => (a.carousel_order || 0) - (b.carousel_order || 0))
    : media;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-stone uppercase tracking-wider">
          {isCarousel ? 'Carousel Images' : isVideo ? 'Video' : 'Image'}
        </label>
        <div>
          <input
            type="file"
            accept={acceptedTypes}
            multiple={isCarousel}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || (!isCarousel && media.length >= 1)}
            id={`file-upload-${postId}`}
          />
          <label htmlFor={`file-upload-${postId}`}>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                uploading || (!isCarousel && media.length >= 1)
                  ? 'bg-stone/5 border-stone/10 text-stone/40 cursor-not-allowed'
                  : 'bg-cream-warm border-stone/20 text-charcoal hover:bg-stone/5 hover:border-stone/30'
              }`}
            >
              <ArrowUpTrayIcon className="w-3.5 h-3.5" />
              {uploading ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Upload'}
            </span>
          </label>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="border-2 border-dashed border-stone/20 rounded-lg p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-stone/10 flex items-center justify-center">
            {isVideo ? (
              <VideoCameraIcon className="w-6 h-6 text-stone/40" />
            ) : (
              <PhotoIcon className="w-6 h-6 text-stone/40" />
            )}
          </div>
          <p className="text-sm text-stone/60">No media uploaded</p>
          <p className="text-xs text-stone/40 mt-1">
            {isCarousel ? `Upload up to ${maxFiles} images` : `Upload ${isVideo ? 'a video' : 'an image'}`}
          </p>
        </div>
      ) : (
        <div className={`grid ${isCarousel ? 'grid-cols-3' : 'grid-cols-1'} gap-3`}>
          {sortedMedia.map((item, idx) => {
            const publicUrl = supabase.storage.from('content-media').getPublicUrl(item.file_path).data.publicUrl;

            return (
              <div key={item.id} className="relative group rounded-lg overflow-hidden border border-stone/10">
                {item.media_type === 'video' ? (
                  <video
                    src={publicUrl}
                    className="w-full h-40 object-cover bg-stone/5"
                    controls
                  />
                ) : (
                  <img
                    src={publicUrl}
                    alt={item.file_name}
                    className="w-full h-40 object-cover bg-stone/5"
                  />
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id, item.file_path)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Carousel order */}
                {isCarousel && (
                  <div className="absolute top-2 left-2 bg-dark/80 text-white text-xs font-bold px-2 py-1 rounded">
                    {idx + 1}
                  </div>
                )}

                {/* File info */}
                <div className="p-2 bg-cream-warm text-xs text-stone truncate">
                  {item.file_name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper functions
async function getImageMetadata(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = URL.createObjectURL(file);
  });
}

async function getVideoMetadata(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Math.round(video.duration),
      });
    };
    video.src = URL.createObjectURL(file);
  });
}
