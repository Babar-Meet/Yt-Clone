import axios from 'axios';

// For local file system operations
// In a real electron app, we'd use fs module, but for now we'll use a mock service
// that writes to localStorage and simulates file system operations

class VideoService {
  constructor() {
    this.baseUrl = 'http://localhost:5173'; // Vite dev server
    this.videosDir = 'videos-metadata'; // Directory for metadata files
    this.basePath = window.location.origin.includes('localhost') 
      ? '' 
      : window.location.origin;
  }

  // Generate unique ID for videos
  generateVideoId() {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save video metadata to localStorage and try to save to file
  async saveVideoMetadata(videoData) {
    try {
      // Generate ID if not present
      if (!videoData.id) {
        videoData.id = this.generateVideoId();
      }

      // Add timestamp
      if (!videoData.uploadDate) {
        videoData.uploadDate = new Date().toISOString();
      }

      // Save to localStorage
      this.saveToLocalStorage(videoData);

      // Try to save to JSON file via our mock API
      await this.saveToJsonFile(videoData);

      return {
        success: true,
        videoId: videoData.id,
        data: videoData,
        message: 'Video metadata saved successfully!'
      };
    } catch (error) {
      console.error('Error saving video metadata:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to save video metadata.'
      };
    }
  }

  // Save to localStorage
  saveToLocalStorage(videoData) {
    try {
      const savedVideos = this.getLocalStorageVideos();
      const existingIndex = savedVideos.findIndex(v => v.id === videoData.id);
      
      if (existingIndex >= 0) {
        savedVideos[existingIndex] = videoData;
      } else {
        savedVideos.push(videoData);
      }
      
      localStorage.setItem('ytCloneVideos', JSON.stringify(savedVideos));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  // Get videos from localStorage
  getLocalStorageVideos() {
    try {
      const saved = localStorage.getItem('ytCloneVideos');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  // Save to JSON file - This is a mock implementation
  // In a real Electron app, we would use the fs module
  async saveToJsonFile(videoData) {
    try {
      // Create a blob and simulate file download
      const blob = new Blob([JSON.stringify(videoData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoData.id}.json`;
      
      // Append to body, click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Revoke the object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      // In a real Electron app, we would:
      // const fs = window.require('fs');
      // const path = window.require('path');
      // const filePath = path.join(__dirname, '..', 'public', this.videosDir, `${videoData.id}.json`);
      // fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
      
      return true;
    } catch (error) {
      console.error('Error saving to JSON file:', error);
      // Even if file save fails, we still have it in localStorage
      return false;
    }
  }

  // Get all videos (from localStorage)
  async getAllVideos() {
    try {
      const videos = this.getLocalStorageVideos();
      
      // Sort by upload date (newest first)
      return videos.sort((a, b) => 
        new Date(b.uploadDate) - new Date(a.uploadDate)
      );
    } catch (error) {
      console.error('Error getting videos:', error);
      return [];
    }
  }

  // Get video by ID
  async getVideoById(id) {
    try {
      const videos = this.getLocalStorageVideos();
      return videos.find(video => video.id === id) || null;
    } catch (error) {
      console.error('Error getting video by ID:', error);
      return null;
    }
  }

  // Delete video by ID
  async deleteVideo(id) {
    try {
      let videos = this.getLocalStorageVideos();
      videos = videos.filter(video => video.id !== id);
      localStorage.setItem('ytCloneVideos', JSON.stringify(videos));
      
      // In a real Electron app, we would also delete the JSON file
      // const fs = window.require('fs');
      // const path = window.require('path');
      // const filePath = path.join(__dirname, '..', 'public', this.videosDir, `${id}.json`);
      // if (fs.existsSync(filePath)) {
      //   fs.unlinkSync(filePath);
      // }
      
      return {
        success: true,
        message: 'Video deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting video:', error);
      return {
        success: false,
        message: 'Failed to delete video'
      };
    }
  }

  // Clear all videos
  async clearAllVideos() {
    try {
      localStorage.removeItem('ytCloneVideos');
      
      // In a real Electron app, we would also delete all JSON files
      // const fs = window.require('fs');
      // const path = window.require('path');
      // const dirPath = path.join(__dirname, '..', 'public', this.videosDir);
      // if (fs.existsSync(dirPath)) {
      //   const files = fs.readdirSync(dirPath);
      //   files.forEach(file => {
      //     if (file.endsWith('.json')) {
      //       fs.unlinkSync(path.join(dirPath, file));
      //     }
      //   });
      // }
      
      return {
        success: true,
        message: 'All videos cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing videos:', error);
      return {
        success: false,
        message: 'Failed to clear videos'
      };
    }
  }

  // Export videos to a single JSON file
  async exportAllVideos() {
    try {
      const videos = this.getLocalStorageVideos();
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalVideos: videos.length,
        videos: videos
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-clone-videos-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return {
        success: true,
        message: `Exported ${videos.length} videos successfully`
      };
    } catch (error) {
      console.error('Error exporting videos:', error);
      return {
        success: false,
        message: 'Failed to export videos'
      };
    }
  }

  // Import videos from JSON file
  async importVideosFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const videosToImport = data.videos || [];
          
          if (!Array.isArray(videosToImport)) {
            throw new Error('Invalid file format: videos should be an array');
          }
          
          const currentVideos = this.getLocalStorageVideos();
          const existingIds = new Set(currentVideos.map(v => v.id));
          
          // Only add videos that don't already exist
          const newVideos = videosToImport.filter(video => !existingIds.has(video.id));
          
          if (newVideos.length === 0) {
            resolve({
              success: false,
              message: 'No new videos to import (all videos already exist)'
            });
            return;
          }
          
          const updatedVideos = [...currentVideos, ...newVideos];
          localStorage.setItem('ytCloneVideos', JSON.stringify(updatedVideos));
          
          resolve({
            success: true,
            importedCount: newVideos.length,
            totalCount: updatedVideos.length,
            message: `Imported ${newVideos.length} new video(s) successfully`
          });
        } catch (error) {
          reject({
            success: false,
            message: 'Invalid JSON file format',
            error: error.message
          });
        }
      };
      
      reader.onerror = () => {
        reject({
          success: false,
          message: 'Failed to read file'
        });
      };
      
      reader.readAsText(file);
    });
  }

  // Get video statistics
  getVideoStats() {
    const videos = this.getLocalStorageVideos();
    
    const stats = {
      totalVideos: videos.length,
      totalDuration: 0,
      totalSize: 0,
      categories: {},
      byMonth: {}
    };
    
    videos.forEach(video => {
      // Sum duration (in seconds)
      stats.totalDuration += video.duration || 0;
      
      // Parse file size
      if (video.fileSize) {
        const sizeMatch = video.fileSize.match(/(\d+(\.\d+)?)\s*(MB|GB)/i);
        if (sizeMatch) {
          const value = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[3].toUpperCase();
          stats.totalSize += unit === 'GB' ? value * 1024 : value; // Convert to MB
        }
      }
      
      // Count by category
      const category = video.category || 'other';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Count by month
      if (video.uploadDate) {
        const date = new Date(video.uploadDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        stats.byMonth[monthYear] = (stats.byMonth[monthYear] || 0) + 1;
      }
    });
    
    // Format total duration
    const hours = Math.floor(stats.totalDuration / 3600);
    const minutes = Math.floor((stats.totalDuration % 3600) / 60);
    stats.formattedDuration = hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
    
    // Format total size
    stats.formattedSize = stats.totalSize >= 1024 
      ? `${(stats.totalSize / 1024).toFixed(1)} GB` 
      : `${stats.totalSize.toFixed(1)} MB`;
    
    return stats;
  }
}

// Add this method to the VideoService class
updateVideo: async (updatedVideo) => {
  try {
    const videos = videoService.getLocalStorageVideos();
    const index = videos.findIndex(v => v.id === updatedVideo.id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Video not found'
      };
    }

    // Preserve original upload date if not provided
    if (!updatedVideo.uploadDate) {
      updatedVideo.uploadDate = videos[index].uploadDate;
    }

    // Update the video
    videos[index] = {
      ...videos[index],
      ...updatedVideo,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem('ytCloneVideos', JSON.stringify(videos));
    
    return {
      success: true,
      message: 'Video updated successfully'
    };
  } catch (error) {
    console.error('Error updating video:', error);
    return {
      success: false,
      message: 'Failed to update video'
    };
  }
}

// Add this to the export at the bottom
export { VideoService, videoService };

// Create singleton instance
const videoService = new VideoService();

export default videoService;