import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, SkipBack, SkipForward,
  Settings, Captions, Airplay, Zap, ThumbsUp, ThumbsDown,
  Share2, Download, PlusCircle, MoreHorizontal, Heart
} from 'lucide-react';
import './VideoPlayer.css';

const VideoPlayer = ({ video = null }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [tempSpeedActive, setTempSpeedActive] = useState(false);
  const [originalPlaybackRate, setOriginalPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  // Use refs for real-time state tracking
  const isPlayingRef = useRef(false);
  const playbackRateRef = useRef(1);
  const spacebarHoldTimerRef = useRef(null);
  const spacebarPressedRef = useRef(false);
  const hideControlsTimerRef = useRef(null);
  const isMouseOverControlsRef = useRef(false);

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
      videoRef.current.play().then(() => {
        isPlayingRef.current = true;
      }).catch(console.error);
    } else {
      videoRef.current.pause();
      isPlayingRef.current = false;
    }
    showControlsTemporarily();
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
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      const newVolume = volume === 0 ? 0.8 : volume;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
    showControlsTemporarily();
  }, [isMuted, volume]);

  // Seek
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    showControlsTemporarily();
  };

  // Skip forward/backward
  const skip = useCallback((seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
    showControlsTemporarily();
  }, []);

  // Playback speed
  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    playbackRateRef.current = rate;
    if (videoRef.current && !tempSpeedActive) {
      videoRef.current.playbackRate = rate;
    }
    showControlsTemporarily();
  }, [tempSpeedActive]);

  // Temporary speed boost (2x) while spacebar held
  const activateTempSpeed = useCallback(() => {
    if (!videoRef.current) return;
    
    if (!tempSpeedActive) {
      setOriginalPlaybackRate(playbackRateRef.current);
    }
    
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
    
    videoRef.current.playbackRate = 2;
    setTempSpeedActive(true);
    playbackRateRef.current = 2;
    
  }, [tempSpeedActive]);

  const deactivateTempSpeed = useCallback(() => {
    if (!videoRef.current || !tempSpeedActive) return;
    
    videoRef.current.playbackRate = originalPlaybackRate;
    setTempSpeedActive(false);
    playbackRateRef.current = originalPlaybackRate;
    
  }, [originalPlaybackRate, tempSpeedActive]);

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
    showControlsTemporarily();
  };

  // Show controls temporarily
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    
    if (isPlayingRef.current) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, []);

  // Handle video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
      setIsLoading(false);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setShowControls(true); // Always show controls when paused
    };
    
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      videoElement.playbackRate = playbackRateRef.current;
      setIsLoading(false);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setShowControls(true);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);

    // Initialize video
    if (videoElement.readyState >= 2) {
      setDuration(videoElement.duration);
      setIsLoading(false);
    }

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoPath]);

  // Mouse and hover handlers
// Mouse and hover handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => {
      setIsHovering(true);
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      isMouseOverControlsRef.current = false;
      
      if (isPlayingRef.current) {
        hideControlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 500);
      }
    };

    const handleMouseMove = () => {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      
      if (isPlayingRef.current) {
        hideControlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  // Auto-hide controls when playing and not hovering
// Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying && !showControls) {
      return;
    }
    
    if (isPlaying && showControls) {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying, showControls]); // Re-run when currentTime changes (user interaction)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      
      switch(key) {
        case ' ':
          e.preventDefault();
          
          if (spacebarPressedRef.current) return;
          
          spacebarPressedRef.current = true;
          
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
          setVolume(prev => {
            const newVol = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            if (newVol > 0) setIsMuted(false);
            return newVol;
          });
          break;
          
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => {
            const newVol = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = newVol;
            setIsMuted(newVol === 0);
            return newVol;
          });
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
          if (videoRef.current && duration) {
            const percent = parseInt(e.key) / 10;
            videoRef.current.currentTime = duration * percent;
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        e.preventDefault();
        
        if (spacebarHoldTimerRef.current) {
          clearTimeout(spacebarHoldTimerRef.current);
          spacebarHoldTimerRef.current = null;
        }
        
        if (tempSpeedActive) {
          deactivateTempSpeed();
        } else if (spacebarPressedRef.current) {
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
      
      if (spacebarHoldTimerRef.current) {
        clearTimeout(spacebarHoldTimerRef.current);
      }
    };
  }, [togglePlay, skip, toggleMute, changePlaybackRate, playbackRate, tempSpeedActive, activateTempSpeed, deactivateTempSpeed, duration]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spacebarHoldTimerRef.current) {
        clearTimeout(spacebarHoldTimerRef.current);
      }
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  // Loading indicator component
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`video-player-container ${isFullscreen ? 'fullscreen' : ''}`}
      onDoubleClick={toggleFullscreen}
    >
      <div 
        ref={playerRef}
        className="video-wrapper"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <video
          ref={videoRef}
          className="video-element"
          src={videoPath}
          onClick={togglePlay}
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>

        {isLoading && <LoadingSpinner />}

        {/* Overlay Controls */}
        <div 
          className={`video-overlay ${showControls ? 'show' : 'hide'} ${tempSpeedActive ? 'temp-speed-active' : ''}`}
          onMouseEnter={() => isMouseOverControlsRef.current = true}
          onMouseLeave={() => isMouseOverControlsRef.current = false}
        >

           <div className="top-controls">
            <div className="video-title">
              <h3>{videoTitle}</h3>
              {tempSpeedActive
              }
            </div>
          </div>


          {/* <div className="top-controls">
            <div className="video-title">
              <h3>{videoTitle}</h3>
              {tempSpeedActive &&
               (
                <div className="speed-indicator">
                  <Zap size={14} />
                  <span>2x </span>
                </div>
              )
              }
            </div>
          </div> */}

          <div className="center-controls">
            <button 
              className={`big-play-button ${isPlaying ? 'playing' : ''}`} 
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
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
                  background: `linear-gradient(to right, #ff0000 ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.3) ${(currentTime / (duration || 1)) * 100}%)`
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
                  {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                </button>
                
                <button className="control-button skip-button" onClick={() => skip(-10)}>
                  <SkipBack size={15} />
                  <span className="skip-time">10s</span>
                </button>
                
                <button className="control-button skip-button" onClick={() => skip(10)}>
                  <SkipForward size={15} />
                  <span className="skip-time">10s</span>
                </button>

                <div 
                  className="volume-control" 
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button className="control-button" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <div className={`volume-slider-container ${showVolumeSlider || isHovering ? 'show' : ''}`}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                    />
                    <div className="volume-percent">{Math.round(volume * 100)}%</div>
                  </div>
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

                <button className="control-button" title="Subtitles">
                  <Captions size={15} />
                </button>

                <button className="control-button" title="Settings">
                  <Settings size={15} />
                </button>

                <button className="control-button" title="AirPlay">
                  <Airplay size={15} />
                </button>

                <button className="control-button" onClick={toggleFullscreen} title="Fullscreen">
                  {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playback speed indicator */}
        {(playbackRate !== 1 || tempSpeedActive) && (
          <div className="playback-rate-indicator">
            {tempSpeedActive ? '2.0x' : `${playbackRate.toFixed(2)}x`}
            {tempSpeedActive && <Zap size={12} />}
          </div>
        )}
        
        {/* Spacebar hint - only show when video is paused and controls are visible */}
        {!isPlaying && showControls && !tempSpeedActive && (
          <div className="spacebar-hint">
            <kbd>Space</kbd> for 2x speed
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
        <div className="video-info-header">
          <h1>{videoTitle}</h1>
          <div className="video-metadata">
            <span className="views">{videoViews} views</span>
            <span className="separator">•</span>
            <span className="date">{videoUploadDate}</span>
          </div>
        </div>
        
        <div className="video-actions">
          <button className="action-button like">
            <ThumbsUp size={18} /> <span className="count">234K</span>
          </button>
          <button className="action-button dislike">
            <ThumbsDown size={18} /> Dislike
          </button>
          <button className="action-button share">
            <Share2 size={18} /> Share
          </button>
          <button className="action-button save">
            <Heart size={18} /> Save
          </button>
          <button className="action-button download">
            <Download size={18} /> Download
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