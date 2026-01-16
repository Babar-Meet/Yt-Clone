import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import videoService from '../services/videoService';
import { 
  ArrowLeft, Home, Clock, Eye, ThumbsUp, ThumbsDown,
  Share2, Download, PlusCircle, MoreHorizontal,
  AlertCircle, RefreshCw, ExternalLink
} from 'lucide-react';
import './Watch.css';

const Watch = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const videoData = await videoService.getVideoById(videoId);
      
      if (!videoData) {
        setError('Video not found');
        setLoading(false);
        return;
      }
      
      setVideo(videoData);
      
      // Load related videos (videos from same category)
      const allVideos = await videoService.getAllVideos();
      const related = allVideos
        .filter(v => v.id !== videoId && v.category === videoData.category)
        .slice(0, 5);
      setRelatedVideos(related);
      
    } catch (err) {
      console.error('Error loading video:', err);
      setError('Failed to load video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="watch-page loading">
        <div className="loading-content">
          <RefreshCw className="spinner" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="watch-page error">
        <div className="error-content">
          <AlertCircle size={48} />
          <h2>Video Not Found</h2>
          <p>{error || 'The video you are looking for does not exist.'}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/')} className="back-btn">
              <ArrowLeft size={16} /> Go Home
            </button>
            <button onClick={loadVideo} className="retry-btn">
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="watch-page">
      <div className="watch-container">
        <div className="main-content">
          {/* Back Button */}
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={20} /> Back
          </button>

          {/* Video Player */}
          <VideoPlayer video={video} />

          {/* Video Details */}
          <div className="video-details">
            <h1 className="video-title">{video.title}</h1>
            
            <div className="video-stats">
              <div className="stat">
                <Eye size={16} />
                <span>{video.views || 0} views</span>
              </div>
              <div className="stat">
                <ThumbsUp size={16} />
                <span>{video.likes || 0} likes</span>
              </div>
              <div className="stat">
                <Clock size={16} />
                <span>{video.durationFormatted}</span>
              </div>
              <div className="stat">
                <span>Uploaded: {formatDate(video.uploadDate)}</span>
              </div>
            </div>

            <div className="video-actions-bar">
              <button className="action-btn like">
                <ThumbsUp size={18} /> Like
              </button>
              <button className="action-btn dislike">
                <ThumbsDown size={18} /> Dislike
              </button>
              <button className="action-btn share">
                <Share2 size={18} /> Share
              </button>
              <button className="action-btn download">
                <Download size={18} /> Download
              </button>
              <button className="action-btn save">
                <PlusCircle size={18} /> Save
              </button>
              <button className="action-btn more">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="video-description">
              <h3>Description</h3>
              <p>{video.description || 'No description available.'}</p>
              
              <div className="video-meta-info">
                <div className="meta-item">
                  <strong>Category:</strong>
                  <span className="category-tag">{video.category}</span>
                </div>
                <div className="meta-item">
                  <strong>File Size:</strong>
                  <span>{video.fileSize}</span>
                </div>
                <div className="meta-item">
                  <strong>Resolution:</strong>
                  <span>{video.resolution}</span>
                </div>
                <div className="meta-item">
                  <strong>File Name:</strong>
                  <span className="file-name">{video.videoFileName}</span>
                </div>
              </div>

              {video.tags && video.tags.length > 0 && (
                <div className="video-tags">
                  <strong>Tags:</strong>
                  <div className="tags-list">
                    {video.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="sidebar">
          <h3>Related Videos</h3>
          {relatedVideos.length > 0 ? (
            <div className="related-videos">
              {relatedVideos.map(relatedVideo => (
                <div 
                  key={relatedVideo.id} 
                  className="related-video-card"
                  onClick={() => navigate(`/watch/${relatedVideo.id}`)}
                >
                  <div className="related-thumbnail">
                    <img 
                      src={relatedVideo.thumbnailPath || '/thumbnails/default.jpg'} 
                      alt={relatedVideo.title}
                    />
                    <span className="duration">{relatedVideo.durationFormatted}</span>
                  </div>
                  <div className="related-info">
                    <h4>{relatedVideo.title}</h4>
                    <p className="related-views">{relatedVideo.views || 0} views</p>
                    <p className="related-uploaded">
                      {formatDate(relatedVideo.uploadDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-related">
              <p>No related videos found.</p>
              <Link to="/my-library" className="browse-btn">
                Browse Library
              </Link>
            </div>
          )}

          {/* Video File Info */}
          <div className="video-file-info">
            <h4>File Information</h4>
            <div className="file-details">
              <div className="detail-item">
                <span className="label">Path:</span>
                <span className="value">{video.videoPath}</span>
              </div>
              <div className="detail-item">
                <span className="label">Size:</span>
                <span className="value">{video.fileSize}</span>
              </div>
              <div className="detail-item">
                <span className="label">Duration:</span>
                <span className="value">{video.durationFormatted}</span>
              </div>
              <div className="detail-item">
                <span className="label">Added:</span>
                <span className="value">{formatDate(video.uploadDate)}</span>
              </div>
            </div>
            <button 
              onClick={() => window.open(video.videoPath, '_blank')}
              className="open-file-btn"
            >
              <ExternalLink size={16} /> Open Video File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;