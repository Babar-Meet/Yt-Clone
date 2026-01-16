import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { 
  Video, Image, Clock, FileText, 
  Save, FolderOpen, Info, AlertCircle,
  Upload, Trash2, Eye, Download, FileUp, CheckCircle,
  Database, BarChart3, Copy, ExternalLink
} from 'lucide-react';
import videoService from '../../services/videoService';
import './ManualVideoAdd.css';

const ManualVideoAdd = () => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const importFileRef = useRef(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [isJsonVisible, setIsJsonVisible] = useState(false);
  const [savedVideos, setSavedVideos] = useState([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState({ loading: false, message: '' });
  const [videoStats, setVideoStats] = useState(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      title: '',
      fileName: '',
      thumbnailName: '',
      description: '',
      category: 'gaming',
      tags: '',
      published: true
    }
  });

  // Load saved videos and stats
  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    const videos = await videoService.getAllVideos();
    setSavedVideos(videos);
    setVideoStats(videoService.getVideoStats());
  };

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, []);

  const handleVideoFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedVideoFile(file);
    setValue('fileName', file.name);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);

    // Extract title from filename
    const titleWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const formattedTitle = titleWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim();
    
    setValue('title', formattedTitle);
    
    // Extract metadata
    extractVideoMetadata(file);
  };

  const handleThumbnailFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedThumbnailFile(file);
    setValue('thumbnailName', file.name);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setThumbnailPreviewUrl(url);
  };

  const extractVideoMetadata = async (file) => {
    if (!file) return;

    setIsExtracting(true);
    setExtractionError('');
    setVideoInfo(null);

    try {
      // Create a video element to extract metadata
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);
      
      video.src = objectUrl;
      video.preload = 'metadata';

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          const info = {
            duration: video.duration,
            durationFormatted: formatDuration(video.duration),
            width: video.videoWidth,
            height: video.videoHeight,
            fileSize: formatFileSize(file.size),
            mimeType: file.type,
            extractedAt: new Date().toISOString(),
            originalFileName: file.name,
            lastModified: file.lastModified
          };
          
          setVideoInfo(info);
          setIsExtracting(false);
          URL.revokeObjectURL(objectUrl);
          resolve(info);
        };

        video.onerror = (e) => {
          console.error('Video loading error:', e);
          setExtractionError('Unable to load video file. Please try another file.');
          setIsExtracting(false);
          URL.revokeObjectURL(objectUrl);
          reject(e);
        };

        // Set timeout in case video never loads
        setTimeout(() => {
          if (!videoInfo && isExtracting) {
            URL.revokeObjectURL(objectUrl);
            setExtractionError('Timeout loading video. Using default metadata.');
            setVideoInfo({
              duration: 300,
              durationFormatted: '5:00',
              width: 1920,
              height: 1080,
              fileSize: formatFileSize(file.size),
              mimeType: file.type,
              extractedAt: new Date().toISOString(),
              originalFileName: file.name,
              lastModified: file.lastModified
            });
            setIsExtracting(false);
          }
        }, 8000);
      });
    } catch (error) {
      console.error('Error extracting metadata:', error);
      setExtractionError('Error extracting video metadata.');
      setIsExtracting(false);
    }
  };

  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateVideoJson = (formData, metadata, videoFile, thumbnailFile) => {
    const videoId = videoService.generateVideoId();
    const uploadDate = new Date().toISOString();
    
    // Generate paths based on file names
    const videoPath = videoFile ? `/videos/${videoFile.name}` : '';
    const thumbnailPath = thumbnailFile ? `/thumbnails/${thumbnailFile.name}` : '/thumbnails/default.jpg';
    
    const videoObject = {
      id: videoId,
      title: formData.title || 'Untitled Video',
      description: formData.description || 'No description provided',
      videoPath: videoPath,
      videoFileName: videoFile?.name || '',
      thumbnailPath: thumbnailPath,
      thumbnailFileName: thumbnailFile?.name || '',
      category: formData.category,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      duration: metadata.duration || 0,
      durationFormatted: metadata.durationFormatted || '0:00',
      resolution: `${metadata.width || 0}x${metadata.height || 0}`,
      fileSize: metadata.fileSize || '0 Bytes',
      mimeType: metadata.mimeType || 'unknown',
      originalFileName: metadata.originalFileName || '',
      published: formData.published,
      uploadDate: uploadDate,
      lastModifiedDate: metadata.lastModified ? new Date(metadata.lastModified).toISOString() : uploadDate,
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: [],
      fileReference: {
        name: videoFile?.name || '',
        type: videoFile?.type || '',
        size: videoFile?.size || 0,
        lastModified: videoFile?.lastModified || 0
      }
    };
    
    return videoObject;
  };

  const handleManualExtract = () => {
    if (selectedVideoFile) {
      extractVideoMetadata(selectedVideoFile);
    }
  };

  const onSubmit = async (formData) => {
    if (!selectedVideoFile) {
      alert('Please select a video file first.');
      return;
    }

    if (!videoInfo) {
      alert('Please wait for video metadata extraction to complete.');
      return;
    }

    setSaveStatus({ loading: true, message: 'Saving video metadata...' });

    try {
      const videoObject = generateVideoJson(formData, videoInfo, selectedVideoFile, selectedThumbnailFile);
      
      const result = await videoService.saveVideoMetadata(videoObject);
      
      setSaveStatus({ loading: false, message: result.message });
      
      if (result.success) {
        // Update JSON preview
        setJsonContent(JSON.stringify(videoObject, null, 2));
        setIsJsonVisible(true);
        
        // Reload saved videos
        await loadSavedVideos();
        
        // Show success message
        alert(`✅ ${result.message}\n\nVideo ID: ${result.videoId}\nTitle: ${videoObject.title}\nDuration: ${videoObject.durationFormatted}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving video:', error);
      setSaveStatus({ loading: false, message: 'Failed to save video metadata.' });
      alert('❌ Failed to save video metadata.');
    }
  };

  const saveJsonToFile = () => {
    if (!jsonContent) return;

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const videoId = JSON.parse(jsonContent).id;
    const title = JSON.parse(jsonContent).title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${title}_${videoId}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video from your library?')) {
      const result = await videoService.deleteVideo(videoId);
      if (result.success) {
        await loadSavedVideos();
        alert('✅ Video deleted successfully!');
      } else {
        alert('❌ Failed to delete video.');
      }
    }
  };

  const loadVideoToPlayer = (video) => {
    alert(`🎬 Video details:\n\nTitle: ${video.title}\nID: ${video.id}\nDuration: ${video.durationFormatted}\n\nTo play this video, make sure the file exists at: public${video.videoPath}`);
  };

  const resetForm = () => {
    reset();
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setVideoInfo(null);
    setJsonContent('');
    setIsJsonVisible(false);
    setExtractionError('');
    setVideoPreviewUrl('');
    setThumbnailPreviewUrl('');
    setSaveStatus({ loading: false, message: '' });
    
    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerThumbnailInput = () => {
    thumbnailInputRef.current?.click();
  };

  const showFileCopyInstructions = () => {
    if (!selectedVideoFile) {
      alert('Please select a video file first.');
      return;
    }

    const instructions = `
📁 FILE COPY INSTRUCTIONS:

1. Copy your video file to:
   B:\\_Git\\DEV\\Babar-Meet\\Yt-Clone\\public\\videos\\

2. File should be named:
   ${selectedVideoFile.name}

3. For thumbnail (optional):
   Copy to: public/thumbnails/
   Name: ${selectedThumbnailFile ? selectedThumbnailFile.name : 'thumbnail.jpg'}

4. After copying, refresh the app and your video will appear in "My Library".

📝 Note: The metadata is already saved in the app's database.
    `;
    
    alert(instructions);
  };

  const exportAllVideos = async () => {
    const result = await videoService.exportAllVideos();
    if (result.success) {
      alert(`✅ ${result.message}`);
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const clearAllVideos = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL videos? This action cannot be undone!')) {
      const result = await videoService.clearAllVideos();
      if (result.success) {
        await loadSavedVideos();
        alert('✅ All videos cleared successfully!');
      } else {
        alert('❌ Failed to clear videos.');
      }
    }
  };

  const importVideos = () => {
    importFileRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const result = await videoService.importVideosFromFile(file);
    if (result.success) {
      await loadSavedVideos();
      alert(`✅ ${result.message}\n\nTotal videos: ${result.totalCount}`);
    } else {
      alert(`❌ ${result.message}`);
    }
    
    // Clear the input
    event.target.value = '';
  };

  const copyVideoInfo = (video) => {
    const info = `Title: ${video.title}\nID: ${video.id}\nDuration: ${video.durationFormatted}\nFile: ${video.videoFileName}`;
    navigator.clipboard.writeText(info);
    alert('✅ Video info copied to clipboard!');
  };

  return (
    <div className="manual-video-page">
      <div className="page-header">
        <h1><Video size={32} /> Video Library Manager</h1>
        <p>Add, manage, and play your local video collection</p>
      </div>

      {/* Stats Panel */}
      {videoStats && (
        <div className="stats-panel">
          <div className="stat-card">
            <Database size={24} />
            <div className="stat-content">
              <div className="stat-value">{videoStats.totalVideos}</div>
              <div className="stat-label">Total Videos</div>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={24} />
            <div className="stat-content">
              <div className="stat-value">{videoStats.formattedDuration}</div>
              <div className="stat-label">Total Duration</div>
            </div>
          </div>
          <div className="stat-card">
            <BarChart3 size={24} />
            <div className="stat-content">
              <div className="stat-value">{videoStats.formattedSize}</div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>
          <div className="stat-actions">
            <button onClick={exportAllVideos} className="export-btn">
              <Download size={16} /> Export All
            </button>
            <button onClick={importVideos} className="import-btn">
              <Upload size={16} /> Import
            </button>
            <input
              type="file"
              ref={importFileRef}
              accept=".json"
              onChange={handleImportFile}
              className="file-input-hidden"
            />
            <button onClick={clearAllVideos} className="clear-btn">
              <Trash2 size={16} /> Clear All
            </button>
          </div>
        </div>
      )}

      <div className="content-container">
        <div className="form-section">
          <form onSubmit={handleSubmit(onSubmit)} className="video-form">
            {/* Video File Selection */}
            <div className="form-group">
              <label>
                <Video size={16} /> Select Video File *
              </label>
              <div className="file-select-area" onClick={triggerFileInput}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/*"
                  onChange={handleVideoFileSelect}
                  className="file-input-hidden"
                />
                {selectedVideoFile ? (
                  <div className="file-selected">
                    <div className="file-info">
                      <CheckCircle size={20} className="success-icon" />
                      <div>
                        <div className="file-name">{selectedVideoFile.name}</div>
                        <div className="file-details">
                          {formatFileSize(selectedVideoFile.size)} • 
                          {selectedVideoFile.type}
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                      className="change-file-btn"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <FileUp size={48} className="upload-icon" />
                    <div className="upload-text">
                      <div className="upload-title">Click to select video file</div>
                      <div className="upload-subtitle">MP4, AVI, MKV, MOV, etc.</div>
                    </div>
                  </div>
                )}
              </div>
              
              {videoPreviewUrl && (
                <div className="video-preview">
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    controls
                    className="preview-video"
                  />
                  <div className="preview-label">Video Preview</div>
                </div>
              )}
            </div>

            {/* Thumbnail File Selection */}
            <div className="form-group">
              <label>
                <Image size={16} /> Select Thumbnail (Optional)
              </label>
              <div className="file-select-area thumbnail-area" onClick={triggerThumbnailInput}>
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  accept="image/*"
                  onChange={handleThumbnailFileSelect}
                  className="file-input-hidden"
                />
                {selectedThumbnailFile ? (
                  <div className="file-selected">
                    <div className="file-info">
                      <Image size={20} className="image-icon" />
                      <div>
                        <div className="file-name">{selectedThumbnailFile.name}</div>
                        <div className="file-details">
                          {formatFileSize(selectedThumbnailFile.size)} • 
                          {selectedThumbnailFile.type}
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedThumbnailFile(null);
                        setThumbnailPreviewUrl('');
                        setValue('thumbnailName', '');
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                      }}
                      className="change-file-btn"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <Image size={48} className="upload-icon" />
                    <div className="upload-text">
                      <div className="upload-title">Click to select thumbnail</div>
                      <div className="upload-subtitle">JPG, PNG, GIF, etc.</div>
                    </div>
                  </div>
                )}
              </div>
              
              {thumbnailPreviewUrl && (
                <div className="thumbnail-preview">
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Thumbnail preview"
                    className="preview-thumbnail"
                  />
                  <div className="preview-label">Thumbnail Preview</div>
                </div>
              )}
            </div>

            {/* Auto-extracted title and fields */}
            <div className="form-group">
              <label htmlFor="title">
                <FileText size={16} /> Video Title *
              </label>
              <input
                id="title"
                {...register('title', { required: true })}
                placeholder="Video title will be auto-filled from filename"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                <FileText size={16} /> Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Enter video description"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  <FolderOpen size={16} /> Category
                </label>
                <select id="category" {...register('category')}>
                  <option value="Clash_Of_Clans">🎮 Clash_Of_Clans</option>
                  <option value="Gaming">📚 Gaming</option>
                  <option value="Enterterenment">🎭 Enterterenment</option>
                  <option value="Music">🎵 Music</option>
                  <option value="Tech">💻 Tech</option>
                  <option value="Brain_Rot">Brain_Rot</option>
                  <option value="Edigaction">Edigaction</option>
                  <option value="Watch_later">Watch_later</option>
                  <option value="other">Other 🤫</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tags">
                  <FileText size={16} /> Tags (comma separated)
                </label>
                <input
                  id="tags"
                  {...register('tags')}
                  placeholder="gaming, subnautica, survival"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" {...register('published')} defaultChecked />
                <span>Publish video immediately</span>
              </label>
            </div>

            {extractionError && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{extractionError}</span>
              </div>
            )}

            {isExtracting && (
              <div className="extracting-message">
                <div className="spinner"></div>
                <span>Extracting video metadata...</span>
              </div>
            )}

            {saveStatus.loading && (
              <div className="saving-message">
                <div className="spinner"></div>
                <span>{saveStatus.message}</span>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={!selectedVideoFile || isExtracting || saveStatus.loading}
              >
                <Save size={18} /> Save Video Metadata
              </button>
              <button 
                type="button" 
                onClick={showFileCopyInstructions}
                className="copy-instructions-btn"
                disabled={!selectedVideoFile}
              >
                📁 Copy Instructions
              </button>
              <button type="button" onClick={resetForm} className="reset-btn">
                <Trash2 size={18} /> Clear Form
              </button>
            </div>
          </form>

          {/* Video Metadata Preview */}
          {videoInfo && (
            <div className="metadata-preview">
              <h3><Info size={20} /> Video Metadata</h3>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="label">Duration:</span>
                  <span className="value">{videoInfo.durationFormatted}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">Resolution:</span>
                  <span className="value">{videoInfo.width} × {videoInfo.height}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">File Size:</span>
                  <span className="value">{videoInfo.fileSize}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">Format:</span>
                  <span className="value">{videoInfo.mimeType}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">File Name:</span>
                  <span className="value">{videoInfo.originalFileName}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">Extracted:</span>
                  <span className="value">
                    {format(new Date(videoInfo.extractedAt), 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* JSON Output Section */}
        {isJsonVisible && jsonContent && (
          <div className="json-section">
            <div className="json-header">
              <h3><FileText size={20} /> Generated JSON Data</h3>
              <div className="json-actions">
                <button onClick={saveJsonToFile} className="download-btn">
                  <Download size={16} /> Save .json
                </button>
                <button 
                  onClick={() => setIsJsonVisible(false)} 
                  className="close-btn"
                >
                  Hide
                </button>
              </div>
            </div>
            <pre className="json-output">
              {jsonContent}
            </pre>
            <div className="json-info">
              <Info size={16} />
              <span>
                ✅ Video metadata saved to database. JSON file can be used for backup.
              </span>
            </div>
          </div>
        )}

        {/* Saved Videos List */}
        {savedVideos.length > 0 && (
          <div className="saved-videos-section">
            <div className="section-header">
              <h3><Video size={20} /> Your Video Library ({savedVideos.length})</h3>
              <div className="section-actions">
                <button 
                  onClick={exportAllVideos}
                  className="export-btn"
                >
                  <Download size={16} /> Export All
                </button>
                <button 
                  onClick={clearAllVideos}
                  className="clear-btn"
                >
                  <Trash2 size={16} /> Clear All
                </button>
              </div>
            </div>
            <div className="videos-list">
              {savedVideos.map((video) => (
                <div key={video.id} className="saved-video-card">
                  <div className="video-thumbnail">
                    <img 
                      src={video.thumbnailPath || '/thumbnails/default.jpg'} 
                      alt={video.title}
                      onError={(e) => {
                        e.target.src = '/thumbnails/default.jpg';
                      }}
                    />
                    <span className="duration">{video.durationFormatted}</span>
                  </div>
                  <div className="video-details">
                    <h4>{video.title}</h4>
                    <p className="video-desc">{video.description || 'No description'}</p>
                    <div className="video-meta">
                      <span className="category">{video.category}</span>
                      <span className="size">{video.fileSize}</span>
                      <span className="date">{format(new Date(video.uploadDate), 'MMM dd')}</span>
                      <span className="status">
                        {video.published ? '✅ Published' : '⏸️ Draft'}
                      </span>
                    </div>
                    <div className="video-file-info">
                      <span className="file-name">
                        <FileText size={12} /> {video.videoFileName}
                      </span>
                    </div>
                    <div className="video-actions">
                      <button 
                        onClick={() => loadVideoToPlayer(video)}
                        className="play-btn"
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button 
                        onClick={() => copyVideoInfo(video)}
                        className="copy-btn"
                      >
                        <Copy size={14} /> Copy Info
                      </button>
                      <button 
                        onClick={() => deleteVideo(video.id)}
                        className="delete-btn"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="storage-info">
              <Database size={14} />
              <span>
                Videos stored in app database. To play videos, ensure video files are in: <code>public/videos/</code>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="instructions">
        <h3><Info size={20} /> How It Works</h3>
        <ol>
          <li><strong>Select Video File</strong> from your computer</li>
          <li>Metadata (duration, resolution, etc.) is automatically extracted</li>
          <li>Title is auto-filled from filename (editable)</li>
          <li>Optionally select a thumbnail image</li>
          <li>Fill in description, category, and tags</li>
          <li>Click <strong>"Save Video Metadata"</strong> to save to database</li>
          <li>Click <strong>"Copy Instructions"</strong> to see where to place video files</li>
          <li>Copy your video file to <code>public/videos/</code> folder</li>
          <li>Videos appear in "My Library" page automatically</li>
        </ol>
        <div className="file-structure">
          <h4>📁 Required File Structure:</h4>
          <pre>
{`Yt-Clone/
├── public/
│   ├── videos/           # Place video files here
│   │   ├── video1.mp4
│   │   └── video2.mp4
│   ├── thumbnails/      # Optional: thumbnail images
│   │   ├── thumb1.jpg
│   │   └── default.jpg
│   └── index.html
├── src/
└── package.json`}
          </pre>
        </div>
        <div className="note">
          <strong>💡 Tip:</strong> All metadata is saved in the browser's localStorage. Use "Export All" to backup your video library.
        </div>
      </div>
    </div>
  );
};

export default ManualVideoAdd;