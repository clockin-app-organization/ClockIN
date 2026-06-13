// components/attendance/ManualAttendanceUpload.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2, Trash2, Download, X } from 'lucide-react';

const supabase = createClient();

interface ManualAttendanceRecord {
  id: string;
  event_id: string;
  session_id: string | null;
  image_path: string;
  caption: string | null;
  created_at: string;
}

export default function ManualAttendanceUpload({
  eventId,
  sessionId,
}: {
  eventId: string;
  sessionId?: string;
}) {
  const [images, setImages] = useState<ManualAttendanceRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ManualAttendanceRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      let query = supabase
        .from('manual_attendance')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        query = query.is('session_id', null);
      }

      const { data } = await query;
      if (!cancelled) setImages(data || []);
    };

    loadImages();
    return () => { cancelled = true; };
  }, [eventId, sessionId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `manual/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('attendance')
      .upload(filePath, file);

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: newRow, error: insertError } = await supabase
      .from('manual_attendance')
      .insert({
        event_id: eventId,
        session_id: sessionId || null,
        image_path: filePath,
      })
      .select('*')
      .single();

    if (insertError || !newRow) {
      alert('Failed to save record');
      setUploading(false);
      return;
    }

    setImages(prev => [newRow as ManualAttendanceRecord, ...prev]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, imagePath: string) => {
    await supabase.storage.from('attendance').remove([imagePath]);
    await supabase.from('manual_attendance').delete().eq('id', id);
    setImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  const getPublicUrl = (path: string) =>
    supabase.storage.from('attendance').getPublicUrl(path).data.publicUrl;

  const handleDownload = async (e: React.MouseEvent, imagePath: string) => {
    e.stopPropagation();
    const url = getPublicUrl(imagePath);
    try {
      // Fetch the image as a blob to force download
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = imagePath.split('/').pop() || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Manual Attendance</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
            id={`manual-upload-${eventId}${sessionId || ''}`}
          />
          <label
            htmlFor={`manual-upload-${eventId}${sessionId || ''}`}
            className="btn-secondary inline-flex items-center gap-1 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {uploading ? 'Uploading…' : 'Add Photo'}
          </label>
        </div>
      </div>

      {images.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No manual attendance photos yet.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group border rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <Image
              src={getPublicUrl(img.image_path)}
              alt="Manual attendance"
              width={320}
              height={200}
              className="w-full h-32 object-cover"
              unoptimized
            />

            {/* Download button (top‑left) */}
            <button
              onClick={(e) => handleDownload(e, img.image_path)}
              className="absolute top-1 left-1 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            {/* Delete button (top‑right) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(img.id, img.image_path);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="p-2 text-xs text-gray-500">
              {new Date(img.created_at).toLocaleString([], {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 bg-white/80 rounded-full p-1 hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Download button in modal */}
            <button
              onClick={(e) => handleDownload(e, selectedImage.image_path)}
              className="absolute top-3 left-3 z-10 bg-white/80 rounded-full p-1 hover:bg-white"
            >
              <Download className="h-5 w-5" />
            </button>

            <Image
              src={getPublicUrl(selectedImage.image_path)}
              alt="Full view"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[80vh] object-contain"
              unoptimized
            />

            <div className="p-3 text-sm text-gray-600 text-center">
              {new Date(selectedImage.created_at).toLocaleString([], {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}