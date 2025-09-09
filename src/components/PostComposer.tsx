import { useState, useMemo } from 'react';
import { Image, Send, Eye, EyeOff, Facebook, Instagram, Twitter, Linkedin, Music } from 'lucide-react';
import type { Post } from '../types';
import { socialPlatforms } from '../data/mockData';

interface PostComposerProps {
  onPostCreate: (post: Omit<Post, 'id' | 'createdAt' | 'platforms'>, headlessMode: boolean) => void;
  isPosting: boolean;
  selectedPlatforms: string[];
}

export default function PostComposer({ onPostCreate, isPosting, selectedPlatforms }: PostComposerProps) {
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headlessMode, setHeadlessMode] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (caption.trim()) {
      let finalMedia = media;
      
      // Handle file upload if a file is selected
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            finalMedia = result.fileName;
          } else {
            console.error('File upload failed');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
      
      onPostCreate({
        caption: caption.trim(),
        media: finalMedia || undefined,
        status: 'draft',
      }, headlessMode);
      
      // Reset form
      setCaption('');
      setMedia('');
      setSelectedFile(null);
    }
  };

  // Compute character limit based on selected platforms
  const characterLimit = useMemo(() => {
    if (selectedPlatforms.length === 0) return Infinity;
    const limits = selectedPlatforms.map(platformId => {
      const platform = socialPlatforms.find(p => p.id === platformId);
      return platform ? platform.maxChars : Infinity;
    });
    return Math.min(...limits);
  }, [selectedPlatforms]);

  const isOverLimit = caption.length > characterLimit;

  // Get platform names for display
  const platformNames = useMemo(() => {
    return selectedPlatforms.map(platformId => {
      const platform = socialPlatforms.find(p => p.id === platformId);
      return platform ? platform.name : platformId;
    }).join(', ');
  }, [selectedPlatforms]);

  // Get icon for the primary platform or use default
  const getPrimaryIcon = () => {
    if (selectedPlatforms.length === 0) return Facebook;
    const platform = socialPlatforms.find(p => p.id === selectedPlatforms[0]);
    switch (platform?.icon) {
      case 'Instagram': return Instagram;
      case 'Facebook': return Facebook;
      case 'Twitter': return Twitter;
      case 'Linkedin': return Linkedin;
      case 'Music': return Music;
      default: return Facebook;
    }
  };

  const PrimaryIcon = getPrimaryIcon();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg mr-3">
          <PrimaryIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Create Post for {platformNames || 'Platforms'}
          </h2>
          <p className="text-xs text-gray-600">
            {selectedPlatforms.length} platform(s) selected
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Content */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
            What's on your mind?
          </label>
          <textarea
            id="caption"
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              isOverLimit ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Share your thoughts..."
            required
            disabled={isPosting || selectedPlatforms.length === 0}
          />
          <p className={`text-sm mt-2 ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
            {caption.length.toLocaleString()} / {characterLimit.toLocaleString()} characters
            {selectedPlatforms.length > 1 && ' (most restrictive limit)'}
          </p>
        </div>

        {/* Media Upload */}
        <div>
          <label htmlFor="media" className="block text-sm font-medium text-gray-700 mb-2">
            <Image className="w-4 h-4 inline mr-2" />
            Upload Image (optional)
          </label>
          <input
            id="media"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                // Create a preview URL for the image
                const previewUrl = URL.createObjectURL(file);
                setMedia(previewUrl);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isPosting}
          />
          {selectedFile && (
            <p className="text-sm text-gray-600 mt-2">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        {/* Browser Mode Selection */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Browser Automation Mode</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="browserMode"
                checked={headlessMode}
                onChange={() => setHeadlessMode(true)}
                className="mr-3 text-blue-600"
                disabled={isPosting}
              />
              <EyeOff className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700">Headless (Background)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="browserMode"
                checked={!headlessMode}
                onChange={() => setHeadlessMode(false)}
                className="mr-3 text-blue-600"
                disabled={isPosting}
              />
              <Eye className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700">Visible Browser (Watch the automation)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {headlessMode 
              ? 'Browser will run in the background for faster execution'
              : 'You can watch the browser automation in real-time'
            }
          </p>
        </div>

        {/* Preview */}
        {(caption || media) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
            <div className="bg-white rounded-lg p-4 border">
              {media && (
                <div className="mb-3">
                  <img 
                    src={media} 
                    alt="Post media" 
                    className="max-w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <p className="text-gray-900 whitespace-pre-wrap">{caption}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!caption.trim() || isOverLimit || isPosting || selectedPlatforms.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {isPosting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Posting to {platformNames}...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post to {selectedPlatforms.length > 1 ? 'Selected Platforms' : platformNames}
            </>
          )}
        </button>
      </form>
    </div>
  );
}