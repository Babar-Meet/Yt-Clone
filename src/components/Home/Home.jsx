import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import videoService from '../../services/videoService';
import { 
  Video, Play, Clock, Eye, RefreshCw, 
  TrendingUp, Clock as ClockIcon, ThumbsUp
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const allVideos = await videoService.getAllVideos();
      setVideos(allVideos);
      
      // Select first video by default, or use a default if no videos
      if (allVideos.length > 0) {
        setSelectedVideo(allVideos[0]);
      } else {
        // Fallback to default video
        setSelectedVideo({
          id: 'default',
          title: 'Subnautica: The Red Plague - Act 2',
          videoPath: '/videos/subnautica.mp4',
          views: '2.4M',
          uploadDate: 'Streamed 2 weeks ago',
          durationFormatted: '45:30',
          description: 'I spent 100 days in Subnautica The Red Plague. Here is what happened in Act 2.'
        });
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Main Video Player */}
      {/* <div className="main-video-section"> */}
        {/* {selectedVideo && <VideoPlayer video={selectedVideo} />} */}
      {/* </div> */}

      {/* Video Library */}
      <div className="video-library-section">
        <div className="section-header">
          <h2><Video size={24} /> Video Library</h2>
          <button onClick={loadVideos} className="refresh-btn">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-videos">
            <RefreshCw className="spinner" />
            <p>Loading videos...</p>
          </div>
        ) : videos.length > 0 ? (
          <div className="videos-grid">
            {videos.map(video => (
              <div 
                key={video.id} 
                className="video-card"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="video-thumbnail">
                  <img 
                    src={video.thumbnailPath || '/thumbnails/default.jpg'} 
                    alt={video.title}
                    onError={(e) => {
                      e.target.src = '/thumbnails/default.jpg';
                    }}
                  />
                  <span className="duration">{video.durationFormatted}</span>
                  <div className="play-overlay">
                    <Play size={24} />
                  </div>
                </div>
                <div className="video-info">
                  <h3>{video.title}</h3>
                  <div className="video-stats">
                    <span className="views">
                      <Eye size={12} /> {video.views || 0} views
                    </span>
                    <span className="date">
                      <ClockIcon size={12} /> {new Date(video.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="video-actions">
                    <Link 
                      to={`/watch/${video.id}`}
                      className="watch-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play size={14} /> Watch Full
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-videos">
            <Video size={48} />
            <h3>No videos in library</h3>
            <p>Add your first video to get started!</p>
            <Link to="/add-video" className="add-first-btn">
              <Video size={16} /> Add Video
            </Link>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="keyboard-shortcuts">
        <h3><TrendingUp size={20} /> Keyboard Shortcuts</h3>
        <div className="shortcuts-grid">
          <div className="shortcut-item">
            <span className="shortcut-desc">Play/Pause</span>
            <span className="shortcut-keys">
              <kbd>Space</kbd> or <kbd>K</kbd>
            </span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-desc">Hold for 2x Speed</span>
            <span className="shortcut-keys">
              Hold <kbd>Space</kbd>
            </span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-desc">Skip 10s Backward</span>
            <span className="shortcut-keys">
              <kbd>J</kbd>
            </span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-desc">Skip 10s Forward</span>
            <span className="shortcut-keys">
              <kbd>L</kbd>
            </span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-desc">Fullscreen</span>
            <span className="shortcut-keys">
              <kbd>F</kbd>
            </span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-desc">Mute</span>
            <span className="shortcut-keys">
              <kbd>M</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;