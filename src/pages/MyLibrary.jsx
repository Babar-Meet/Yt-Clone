import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import {
  Video, Clock, FolderOpen, Eye,
  Trash2, Download, FileText, AlertCircle,
  Database, RefreshCw, ExternalLink,
  Edit2, Save, X, Play, Upload,
  Image as ImageIcon, Tag, Hash, Calendar,
  CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import clsx from 'clsx';
import videoService from '../services/videoService';
import './MyLibrary.css';

const MyLibrary = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoStats, setVideoStats] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const thumbnailInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEditForm } = useForm();

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, filterCategory, searchQuery]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allVideos = await videoService.getAllVideos();
      setVideos(allVideos);
      
      const stats = videoService.getVideoStats();
      setVideoStats(stats);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load videos. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(video => video.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query) ||
        video.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredVideos(filtered);
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setEditFormData({ ...video });
    setSelectedThumbnailFile(null);
    setSelectedVideoFile(null);
    setThumbnailPreview(video.thumbnailPath || '/thumbnails/default.jpg');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVideo(null);
    setEditFormData(null);
    setSelectedThumbnailFile(null);
    setSelectedVideoFile(null);
    setThumbnailPreview('');
    resetEditForm();
  };

  const handleThumbnailSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setEditFormData(prev => ({ ...prev, thumbnailFileName: file.name }));
  };

  const handleVideoFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedVideoFile(file);
    setEditFormData(prev => ({
      ...prev,
      videoFileName: file.name,
      videoPath: `/videos/${file.name}`,
      originalFileName: file.name
    }));
  };

  const handleEditFieldChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onEditSubmit = async (data) => {
    if (!editFormData) return;

    setIsUploading(true);
    try {
      const updatedVideo = {
        ...editFormData,
        lastModified: new Date().toISOString()
      };

      const result = await videoService.updateVideo(updatedVideo);
      
      if (result.success) {
        await loadVideos();
        closeEditModal();
        alert('✅ Video updated successfully!');
      } else {
        alert('❌ Failed to update video.');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      alert('❌ Error updating video.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video from your library?')) {
      const result = await videoService.deleteVideo(videoId);
      if (result.success) {
        await loadVideos();
        alert('✅ Video deleted successfully!');
      } else {
        alert('❌ Failed to delete video.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelection.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${bulkSelection.length} videos?`)) {
      setIsUploading(true);
      try {
        const promises = bulkSelection.map(id => videoService.deleteVideo(id));
        await Promise.all(promises);
        await loadVideos();
        setBulkSelection([]);
        alert(`✅ ${bulkSelection.length} videos deleted successfully!`);
      } catch (error) {
        alert('❌ Error deleting videos.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleBulkExport = async () => {
    if (bulkSelection.length === 0) return;
    
    const selectedVideos = videos.filter(video => bulkSelection.includes(video.id));
    const exportData = {
      exportedAt: new Date().toISOString(),
      videos: selectedVideos
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-videos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleBulkSelection = (videoId) => {
    setBulkSelection(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllVideos = () => {
    if (bulkSelection.length === filteredVideos.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredVideos.map(v => v.id));
    }
  };

  const exportAllVideos = async () => {
    const result = await videoService.exportAllVideos();
    if (result.success) {
      alert(`✅ ${result.message}`);
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const getUniqueCategories = () => {
    const categories = videos.map(video => video.category);
    return ['all', ...new Set(categories)];
  };

  const formatFileSize = (sizeStr) => {
    if (!sizeStr) return 'Unknown';
    return sizeStr;
  };

  if (loading) {
    return (
      <div className="library-page">
        <div className="loading-overlay">
          <div className="loading-content">
            <RefreshCw className="spinner" />
            <p className="loading-text">Loading your video library...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">
      {/* Header */}
      <div className="library-header">
        <div className="header-content">
          <div className="header-title">
            <Video className="header-icon" />
            <div>
              <h1>My Video Library</h1>
              <p className="header-subtitle">Your personal video collection</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <Database className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{videoStats?.totalVideos || 0}</span>
                <span className="stat-label">Videos</span>
              </div>
            </div>
            <div className="stat-card">
              <Clock className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{videoStats?.formattedDuration || '0m'}</span>
                <span className="stat-label">Duration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="search-icon">🔍</div>
          </div>
        </div>

        <div className="control-group">
          <div className="filter-dropdown">
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {getUniqueCategories()
                .filter(cat => cat !== 'all')
                .map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={clsx('view-btn', viewMode === 'grid' && 'active')}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ◼◼
            </button>
            <button
              className={clsx('view-btn', viewMode === 'list' && 'active')}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn primary" onClick={loadVideos} disabled={isUploading}>
            <RefreshCw className="btn-icon" />
            Refresh
          </button>
          <Link to="/add-video" className="action-btn secondary">
            <Video className="btn-icon" />
            Add Video
          </Link>
          <button className="action-btn danger" onClick={exportAllVideos}>
            <Download className="btn-icon" />
            Export All
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkSelection.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <CheckCircle className="bulk-icon" />
            <span>{bulkSelection.length} videos selected</span>
          </div>
          <div className="bulk-buttons">
            <button className="bulk-btn" onClick={handleBulkExport}>
              <Download className="btn-icon" />
              Export Selected
            </button>
            <button className="bulk-btn danger" onClick={handleBulkDelete}>
              <Trash2 className="btn-icon" />
              Delete Selected
            </button>
            <button className="bulk-btn" onClick={() => setBulkSelection([])}>
              <X className="btn-icon" />
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <AlertCircle className="error-icon" />
          <span>{error}</span>
          <button className="retry-btn" onClick={loadVideos}>
            Retry
          </button>
        </div>
      )}

      {/* Videos Content */}
      <div className="videos-content">
        {filteredVideos.length > 0 ? (
          <div className={clsx('videos-container', viewMode)}>
            {filteredVideos.map(video => (
              <div
                key={video.id}
                className={clsx('video-item', viewMode, bulkSelection.includes(video.id) && 'selected')}
              >
                {/* Selection Checkbox */}
                <div className="selection-checkbox">
                  <input
                    type="checkbox"
                    checked={bulkSelection.includes(video.id)}
                    onChange={() => toggleBulkSelection(video.id)}
                  />
                </div>

                {/* Thumbnail */}
                <div className="video-thumbnail-wrapper">
                  <img
                    src={video.thumbnailPath || '/thumbnails/default.jpg'}
                    alt={video.title}
                    className="video-thumbnail"
                    onError={(e) => {
                      e.target.src = '/thumbnails/default.jpg';
                    }}
                  />
                  <div className="thumbnail-overlay">
                    <span className="duration-badge">
                      <Clock className="duration-icon" />
                      {video.durationFormatted || '0:00'}
                    </span>
                    <button
                      className="play-overlay-btn"
                      onClick={() => navigate(`/watch/${video.id}`)}
                    >
                      <Play className="play-icon" />
                    </button>
                  </div>
                </div>

                {/* Video Info */}
                <div className="video-info">
                  <div className="video-header">
                    <h3 className="video-title">{video.title}</h3>
                    <div className="video-meta">
                      <span className="meta-item">
                        <Calendar className="meta-icon" />
                        {format(new Date(video.uploadDate), 'MMM dd, yyyy')}
                      </span>
                      <span className="meta-item">
                        <FileText className="meta-icon" />
                        {formatFileSize(video.fileSize)}
                      </span>
                      <span className="meta-item">
                        <FolderOpen className="meta-icon" />
                        {video.category || 'Uncategorized'}
                      </span>
                    </div>
                  </div>

                  {video.description && (
                    <p className="video-description">
                      {video.description.length > 120
                        ? `${video.description.substring(0, 120)}...`
                        : video.description}
                    </p>
                  )}

                  {video.tags && video.tags.length > 0 && (
                    <div className="video-tags">
                      {video.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">
                          <Hash className="tag-icon" />
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="tag-more">+{video.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="video-actions">
                    <button
                      className="action-btn small"
                      onClick={() => navigate(`/watch/${video.id}`)}
                    >
                      <Eye className="action-icon" />
                      Play
                    </button>
                    <button
                      className="action-btn small secondary"
                      onClick={() => openEditModal(video)}
                    >
                      <Edit2 className="action-icon" />
                      Edit
                    </button>
                    <button
                      className="action-btn small danger"
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      <Trash2 className="action-icon" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-content">
              <Video className="empty-icon" />
              <h2>No videos found</h2>
              <p>
                {videos.length === 0
                  ? "Your library is empty. Add your first video to get started!"
                  : "No videos match your search criteria. Try a different search."}
              </p>
              <div className="empty-actions">
                <Link to="/add-video" className="action-btn primary">
                  <Video className="btn-icon" />
                  Add Your First Video
                </Link>
                <button
                  className="action-btn secondary"
                  onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Info */}
        {filteredVideos.length > 0 && (
          <div className="results-info">
            <div className="results-stats">
              <span>
                Showing {filteredVideos.length} of {videos.length} videos
                {filterCategory !== 'all' && ` in "${filterCategory}"`}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            </div>
            <div className="results-actions">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={bulkSelection.length === filteredVideos.length && filteredVideos.length > 0}
                  onChange={selectAllVideos}
                />
                Select All
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingVideo && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Edit2 className="modal-icon" />
                Edit Video
              </h2>
              <button className="modal-close" onClick={closeEditModal}>
                <X />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onEditSubmit)} className="edit-form">
              {/* Thumbnail Upload */}
              <div className="form-section">
                <label className="form-label">
                  <ImageIcon className="label-icon" />
                  Thumbnail
                </label>
                <div className="thumbnail-upload-area" onClick={() => thumbnailInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="file-input"
                  />
                  <div className="thumbnail-preview-container">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="thumbnail-preview"
                    />
                    <div className="upload-overlay">
                      <Upload className="upload-icon" />
                      <span>Click to change thumbnail</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video File Upload */}
              <div className="form-section">
                <label className="form-label">
                  <Video className="label-icon" />
                  Video File
                </label>
                <div className="file-upload-area" onClick={() => videoInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoFileSelect}
                    className="file-input"
                  />
                  <div className="upload-placeholder">
                    {selectedVideoFile ? (
                      <div className="file-selected">
                        <FileText className="file-icon" />
                        <span>{selectedVideoFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="upload-icon" />
                        <span>Click to change video file</span>
                        <small>Current: {editingVideo.videoFileName}</small>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="form-section">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData?.title || ''}
                  onChange={(e) => handleEditFieldChange('title', e.target.value)}
                  placeholder="Video title"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-section">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={editFormData?.description || ''}
                  onChange={(e) => handleEditFieldChange('description', e.target.value)}
                  placeholder="Video description"
                  rows={4}
                />
              </div>

              {/* Category and Tags */}
              <div className="form-row">
                <div className="form-section">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={editFormData?.category || 'gaming'}
                    onChange={(e) => handleEditFieldChange('category', e.target.value)}
                  >
                    <option value="gaming">🎮 Gaming</option>
                    <option value="education">📚 Education</option>
                    <option value="entertainment">🎭 Entertainment</option>
                    <option value="music">🎵 Music</option>
                    <option value="technology">💻 Technology</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div className="form-section">
                  <label className="form-label">
                    <Tag className="label-icon" />
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData?.tags?.join(', ') || ''}
                    onChange={(e) => handleEditFieldChange('tags', e.target.value.split(',').map(t => t.trim()))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="form-btn secondary"
                  onClick={closeEditModal}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn primary"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="spinner-icon" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="btn-icon" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="info-panel">
        <div className="info-header">
          <Info className="info-icon" />
          <h3>Library Information</h3>
        </div>
        <div className="info-content">
          <div className="info-item">
            <span className="info-label">Total Videos:</span>
            <span className="info-value">{videoStats?.totalVideos || 0}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Duration:</span>
            <span className="info-value">{videoStats?.formattedDuration || '0m'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Size:</span>
            <span className="info-value">{videoStats?.formattedSize || '0 MB'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Categories:</span>
            <span className="info-value">{Object.keys(videoStats?.categories || {}).length || 0}</span>
          </div>
        </div>
        <div className="info-note">
          <AlertTriangle className="note-icon" />
          <small>Remember to place video files in: public/videos/</small>
        </div>
      </div>
    </div>
  );
};

export default MyLibrary;