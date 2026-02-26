// frontend/src/components/UI/ImageUpload.jsx
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

/**
 * Reusable image upload component with drag-and-drop + preview.
 *
 * `onImageChange(file | null)` — called with the browser File object
 * when a new image is selected, or `null` when the image is cleared.
 * `initialImage` — URL string used only for the initial preview
 * (e.g. a presigned download URL for an existing image).
 */
const ImageUpload = ({
  initialImage,
  onImageChange,
  className = '',
  aspectRatio = 'aspect-square',
  label = 'Upload Image',
  placeholderText = 'Click or drag an image here',
  maxSizeMB = 5,
}) => {
  const { theme } = useTheme();
  const [previewUrl, setPreviewUrl] = useState(initialImage || '');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setError('');

    // Generate a local preview URL for display
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Pass the File object to the parent
    onImageChange(file);
  };

  const clearImage = () => {
    // Revoke any blob URL we created
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag events
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleImageChange(e); };

  const labelColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  return (
    <div className={className}>
      <label className={`block text-sm font-medium ${labelColor} mb-2`}>{label}</label>

      {previewUrl ? (
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative ${aspectRatio} rounded-md overflow-hidden`}
          >
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Remove Image"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            ${aspectRatio}
            cursor-pointer border-2 border-dashed rounded-md
            flex flex-col items-center justify-center p-4 transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'}
          `}
        >
          <ImageIcon size={48} className="text-gray-500 mb-3" />
          <p className="text-sm text-gray-400 text-center">{placeholderText}</p>
          <p className="text-xs text-gray-500 mt-2">Max size: {maxSizeMB}MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUpload;