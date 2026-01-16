import React, { useState } from 'react';
import './Downloader.css';

const Downloader = () => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('best');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = (e) => {
    e.preventDefault();
    if (!url) {
      alert('Please enter a YouTube URL');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="downloader-page">
      <div className="downloader-header">
        <h1>⬇️ Video Downloader</h1>
        <p>Download YouTube videos using yt-dlp (simulation)</p>
      </div>

      <div className="download-form">
        <form onSubmit={handleDownload}>
          <div className="form-group">
            <label htmlFor="youtube-url">YouTube URL</label>
            <input
              type="url"
              id="youtube-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quality">Quality</label>
            <select
              id="quality"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option value="best">Best Quality</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
              <option value="audio">Audio Only</option>
            </select>
          </div>

          <button
            type="submit"
            className="download-btn"
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Start Download'}
          </button>
        </form>

        {isDownloading && (
          <div className="download-progress">
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">
              Downloading... {downloadProgress}%
            </span>
          </div>
        )}

        <div className="yt-dlp-info">
          <h3>📋 About yt-dlp</h3>
          <p>
            yt-dlp is a command-line program to download videos from YouTube and other sites.
            In a real implementation, this would call a backend service that runs yt-dlp.
          </p>
          <div className="features">
            <span>✅ Multiple formats</span>
            <span>✅ Subtitles</span>
            <span>✅ Playlist support</span>
            <span>✅ Thumbnail extraction</span>
          </div>
        </div>
      </div>

      <div className="example-urls">
        <h3>Example URLs</h3>
        <ul>
          <li>https://www.youtube.com/watch?v=dQw4w9WgXcQ</li>
          <li>https://youtu.be/dQw4w9WgXcQ</li>
          <li>https://www.youtube.com/playlist?list=...</li>
        </ul>
      </div>
    </div>
  );
};

export default Downloader;