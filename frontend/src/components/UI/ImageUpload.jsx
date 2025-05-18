// frontend/src/components/UI/ImageUpload.jsx
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const ImageUpload = ({ 
  initialImage, 
  onImageChange, 
  className = '', 
  aspectRatio = 'aspect-square',
  label = 'Upload Image',
  placeholderText = 'Click or drag an image here',
  maxSizeMB = 5,
  maxWidth = 1920,
  maxHeight = 1080
}) => {
  const [previewUrl, setPreviewUrl] = useState(initialImage || '');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }
    
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be smaller than ${maxSizeMB}MB`);
      return;
    }
    
    // Reset error
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
      
      // Load image to check dimensions
      const img = new Image();
      img.onload = () => {
        // Resize if needed
        if (img.width > maxWidth || img.height > maxHeight) {
          resizeImage(img, file.type, maxWidth, maxHeight);
        } else {
          // Use original image if it's within size limits
          onImageChange(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  const resizeImage = (img, fileType, maxWidth, maxHeight) => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    
    // Calculate new dimensions
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round(height * maxWidth / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round(width * maxHeight / height);
        height = maxHeight;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get resized data URL
    const resizedImageDataUrl = canvas.toDataURL(fileType);
    onImageChange(resizedImageDataUrl);
  };
  
  const clearImage = () => {
    setPreviewUrl('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      
      {previewUrl ? (
        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative ${aspectRatio} rounded-md overflow-hidden`}
          >
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
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
            cursor-pointer
            border-2 border-dashed rounded-md
            flex flex-col items-center justify-center p-4
            transition-colors
            ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'}
          `}
        >
          <ImageIcon size={48} className="text-gray-500 mb-3" />
          <p className="text-sm text-gray-400 text-center">
            {placeholderText}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;