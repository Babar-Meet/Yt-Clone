import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, SkipBack, SkipForward,
  Settings, Captions, Airplay, Zap, ThumbsUp, ThumbsDown,
  Share2, Download, PlusCircle, MoreHorizontal
} from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = ({ video = null }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState(null);
  const [tempSpeedActive, setTempSpeedActive] = useState(false);
  const [originalPlaybackRate, setOriginalPlaybackRate] = useState(1);
  
  // Use refs for real-time state tracking
  const isPlayingRef = useRef(false);
  const playbackRateRef = useRef(1);
  const spacebarHoldTimerRef = useRef(null);
  const spacebarPressedRef = useRef(false);

  // Use video prop for dynamic video source
  const videoPath = video ? video.videoPath : "/videos/subnautica.mp4";
  const videoTitle = video ? video.title : "Subnautica: The Red Plague - Act 2";
  const videoViews = video ? video.views || "2.4M" : "2.4M";
  const videoUploadDate = video ? video.uploadDate : "Streamed 2 weeks ago";

  // Format time (MM:SS)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      isPlayingRef.current = true;
    } else {
      videoRef.current.pause();
      isPlayingRef.current = false;
    }
  }, []);

  // Volume control
  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      setIsMuted(value === 0);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Seek
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Skip forward/backward
  const skip = useCallback((seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  }, []);

  // Playback speed
  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    playbackRateRef.current = rate;
    if (videoRef.current && !tempSpeedActive) {
      videoRef.current.playbackRate = rate;
    }
  }, [tempSpeedActive]);

  // Temporary speed boost (2x) while spacebar held
  const activateTempSpeed = useCallback(() => {
    if (!videoRef.current) return;
    
    // Store original playback rate if not already stored
    if (!tempSpeedActive) {
      setOriginalPlaybackRate(playbackRateRef.current);
    }
    
    // Play video if paused
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
    
    // Set to 2x speed
    videoRef.current.playbackRate = 2;
    setTempSpeedActive(true);
    playbackRateRef.current = 2;
    
  }, [tempSpeedActive]);

  // Reset to normal speed
  const deactivateTempSpeed = useCallback(() => {
    if (!videoRef.current) return;
    
    // Reset to original playback rate
    videoRef.current.playbackRate = originalPlaybackRate;
    setTempSpeedActive(false);
    playbackRateRef.current = originalPlaybackRate;
    
  }, [originalPlaybackRate]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      videoElement.playbackRate = playbackRateRef.current;
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    // Reset when video source changes
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [videoPath]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
      
      setHideControlsTimeout(timeout);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, [isPlaying]);

  // Keyboard shortcuts with spacebar hold functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current) return;

      const key = e.key.toLowerCase();
      
      switch(key) {
        case ' ':
          e.preventDefault();
          
          // If spacebar is already being processed, ignore
          if (spacebarPressedRef.current) return;
          
          spacebarPressedRef.current = true;
          
          // Start hold timer for 2x speed (300ms delay)
          spacebarHoldTimerRef.current = setTimeout(() => {
            if (spacebarPressedRef.current) {
              activateTempSpeed();
            }
          }, 300);
          break;
          
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
          
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
          
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
          
        case 'arrowleft':
          e.preventDefault();
          skip(-5);
          break;
          
        case 'arrowright':
          e.preventDefault();
          skip(5);
          break;
          
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
          
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
          
        case '>':
        case '.':
          e.preventDefault();
          changePlaybackRate(Math.min(2, playbackRate + 0.25));
          break;
          
        case '<':
        case ',':
          e.preventDefault();
          changePlaybackRate(Math.max(0.25, playbackRate - 0.25));
          break;
          
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
          
        case 'l':
          e.preventDefault();
          skip(10);
          break;
          
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          if (videoRef.current) {
            const percent = parseInt(e.key) / 10;
            videoRef.current.currentTime = videoRef.current.duration * percent;
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        e.preventDefault();
        
        // Clear the hold timer
        if (spacebarHoldTimerRef.current) {
          clearTimeout(spacebarHoldTimerRef.current);
          spacebarHoldTimerRef.current = null;
        }
        
        // If we were in temp speed mode, deactivate it
        if (tempSpeedActive) {
          deactivateTempSpeed();
        } else if (spacebarPressedRef.current) {
          // If it was just a tap (not hold), toggle play/pause
          // Only toggle if the key wasn't held for speed boost
          togglePlay();
        }
        
        spacebarPressedRef.current = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      // Clean up timers
      if (spacebarHoldTimerRef.current) {
        clearTimeout(spacebarHoldTimerRef.current);
        spacebarHoldTimerRef.current = null;
      }
      
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, [
    togglePlay, skip, toggleMute, changePlaybackRate, 
    playbackRate, tempSpeedActive, activateTempSpeed, deactivateTempSpeed
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spacebarHoldTimerRef.current) {
        clearTimeout(spacebarHoldTimerRef.current);
      }
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, []);

  return (
    <div 
      ref={playerRef}
      className={`video-player-container ${isFullscreen ? 'fullscreen' : ''}`}
      onDoubleClick={toggleFullscreen}
    >
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-element"
          src={videoPath}
          onClick={togglePlay}
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>

        {/* Overlay Controls */}
        <div className={`video-overlay ${showControls ? 'show' : 'hide'}`}>
          <div className="top-controls">
            <div className="video-title">
              <h3>{videoTitle}</h3>
              {tempSpeedActive && (
                <div className="speed-indicator">
                  <Zap size={16} />
                  <span>2x Speed (Hold Space)</span>
                </div>
              )}
            </div>
          </div>

          <div className="center-controls">
            <button className="big-play-button" onClick={togglePlay}>
              {isPlaying ? <Pause size={48} /> : <Play size={48} />}
            </button>
          </div>

          <div className="bottom-controls">
            {/* Progress Bar */}
            <div className="progress-container">
              <input
                type="range"
                className="progress-bar"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  background: `linear-gradient(to right, #ff0000 ${(currentTime / duration) * 100}%, #606060 ${(currentTime / duration) * 100}%)`
                }}
              />
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span> / </span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="control-buttons">
              <div className="left-controls">
                <button className="control-button" onClick={togglePlay}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <button className="control-button" onClick={() => skip(-10)}>
                  <SkipBack size={20} />
                </button>
                
                <button className="control-button" onClick={() => skip(10)}>
                  <SkipForward size={20} />
                </button>

                <div className="volume-control">
                  <button className="control-button" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>

                <div className="time-display-mobile">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="right-controls">
                <div className="playback-speed">
                  <select
                    value={playbackRate}
                    onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                    className="speed-select"
                    disabled={tempSpeedActive}
                  >
                    <option value="0.25">0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">Normal</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>

                <button className="control-button">
                  <Captions size={20} />
                </button>

                <button className="control-button">
                  <Settings size={20} />
                </button>

                <button className="control-button">
                  <Airplay size={20} />
                </button>

                <button className="control-button" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playback speed indicator */}
        {(playbackRate !== 1 || tempSpeedActive) && (
          <div className="playback-rate-indicator">
            {tempSpeedActive ? '2.0x' : `${playbackRate}x`}
            {tempSpeedActive && <Zap size={12} />}
          </div>
        )}
        
        {/* Spacebar hint */}
        {!isPlaying && !tempSpeedActive && (
          <div className="spacebar-hint">
            <kbd>Space</kbd> or <kbd>K</kbd> to play • Hold <kbd>Space</kbd> for 2x speed
          </div>
        )}
        
        {/* Spacebar hold indicator */}
        {spacebarPressedRef.current && !tempSpeedActive && (
          <div className="spacebar-hold-indicator">
            Hold for 2x speed...
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="video-info">
        <h1>{videoTitle}</h1>
        <div className="video-metadata">
          <span className="views">{videoViews} views</span>
          <span className="separator">•</span>
          <span className="date">{videoUploadDate}</span>
        </div>
        
        <div className="video-actions">
          <button className="action-button like">
            <ThumbsUp size={18} /> 234K
          </button>
          <button className="action-button dislike">
            <ThumbsDown size={18} /> Dislike
          </button>
          <button className="action-button share">
            <Share2 size={18} /> Share
          </button>
          <button className="action-button save">
            <PlusCircle size={18} /> Save
          </button>
          <button className="action-button more">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;