"use client";

import { useEffect, useRef, useState } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Settings,
    Maximize,
    Download,
    PictureInPicture,
} from "lucide-react";

export default function XStyleVideoPlayer({ src, onClick, className = "" }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPiP, setIsPiP] = useState(false);
    const [actionIcon, setActionIcon] = useState(null);
    const actionIconTimeoutRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    // Format time helper
    const formatTime = (time) => {
        if (!time || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Handle video metadata
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // Handle time update
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Play / Pause
    const handlePlayPause = (e) => {
        e.stopPropagation();

        const video = videoRef.current;
        if (!video) return;

        // Clear previous icon timer
        if (actionIconTimeoutRef.current) {
            clearTimeout(actionIconTimeoutRef.current);
        }

        const wasPaused = video.paused;

        if (wasPaused) {
            video.play();
            setIsPlaying(true);
            setActionIcon("play");
        } else {
            video.pause();
            setIsPlaying(false);
            setActionIcon("pause");
        }

        // Very short, modern feedback
        actionIconTimeoutRef.current = setTimeout(() => {
            setActionIcon(null);
        }, 400);

        showControlsTemporarily();
    };

    // Mute toggle
    const handleMuteToggle = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
        showControlsTemporarily();
    };

    // Progress bar update
    const handleProgressClick = (e) => {
        e.stopPropagation();

        if (!videoRef.current || !containerRef.current) return;

        const bar = containerRef.current.querySelector(".video-progress-bar");
        if (!bar) return;

        const rect = bar.getBoundingClientRect();
        const percentage = Math.max(
            0,
            Math.min(1, (e.clientX - rect.left) / rect.width)
        );

        videoRef.current.currentTime = percentage * duration;
        setCurrentTime(percentage * duration);
    };

    // Playback speed change
    const handleSpeedChange = (speed) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
        showControlsTemporarily();
    };

    // Fullscreen toggle
    const handleFullscreen = (e) => {
        e.stopPropagation();
        if (containerRef.current) {
            if (!isFullscreen) {
                if (containerRef.current.requestFullscreen) {
                    containerRef.current.requestFullscreen();
                }
            } else {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }
            setIsFullscreen(!isFullscreen);
        }
        showControlsTemporarily();
    };

    // Picture-in-Picture
    const handlePictureInPicture = async (e) => {
        e.stopPropagation();

        const video = videoRef.current;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
            }

            showControlsTemporarily();
        } catch (error) {
            console.error("Picture-in-Picture failed:", error);
        }
    };

    // Download video
    const handleDownload = (e) => {
        e.stopPropagation();
        const link = document.createElement("a");
        link.href = src;
        link.download = `video-${Date.now()}.mp4`;
        link.click();
        showControlsTemporarily();
    };

    // Show controls temporarily
    const showControlsTemporarily = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // Handle mouse enter
    const handleMouseEnter = () => {
        showControlsTemporarily();
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            setTimeout(() => setShowControls(false), 500);
        }
    };

    // Handle click on video (play/pause on mobile)
    const handleVideoClick = (e) => {
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        } else {
            handlePlayPause(e);
        }
    };

    useEffect(() => {
        const video = videoRef.current;

        const handleEnterPiP = () => setIsPiP(true);
        const handleLeavePiP = () => setIsPiP(false);

        video?.addEventListener("enterpictureinpicture", handleEnterPiP);
        video?.addEventListener("leavepictureinpicture", handleLeavePiP);

        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }

            if (actionIconTimeoutRef.current) {
                clearTimeout(actionIconTimeoutRef.current);
            }

            video?.removeEventListener(
                "enterpictureinpicture",
                handleEnterPiP
            );
            video?.removeEventListener(
                "leavepictureinpicture",
                handleLeavePiP
            );
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black overflow-hidden rounded-2xl group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                src={src}
                className={`w-full h-full object-cover ${className}`}
                onClick={handleVideoClick}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
                preload="metadata"
                disableRemotePlayback
                controlsList="nodownload noplaybackrate nofullscreen"
            />

            {/* Duration Badge - Always visible when not playing */}
            {!isPlaying && currentTime === 0 && duration > 0 && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                    {formatTime(duration)}
                </div>
            )}

            {/* Play / Pause Action Indicator */}
            {/* Modern Play / Pause Feedback */}
<div
    className={`
        pointer-events-none absolute inset-0
        flex items-center justify-center
        transition-[opacity,transform]
        duration-150
        ease-out
        ${actionIcon
            ? "opacity-100 scale-100"
            : "opacity-0 scale-[0.92]"
        }
    `}
>
    <div
        className="
            flex items-center justify-center
            transition-transform
            duration-150
            ease-out
        "
    >
        {actionIcon === "play" && (
            <Play
                className="
                    size-8
                    translate-x-[1px]
                    fill-white
                    text-white
                    drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]
                "
                strokeWidth={2.2}
            />
        )}

        {actionIcon === "pause" && (
            <Pause
                className="
                    size-8
                    fill-white
                    text-white
                    drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]
                "
                strokeWidth={2.2}
            />
        )}
    </div>
</div>

            {/* Bottom Controls - Show on hover or when playing */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity duration-200 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"
                    }`}
            >
                {/* X-style Progress Bar */}
                <div
                    className="video-progress-bar group/progress relative mx-3 h-5 cursor-pointer"
                    onClick={handleProgressClick}
                >
                    {/* Invisible larger hit area */}
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/30 transition-all duration-150 group-hover/progress:h-1.5">
                        {/* Progress */}
                        <div
                            className="relative h-full rounded-full bg-white"
                            style={{
                                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                            }}
                        >
                            {/* X-style thumb */}
                            <div
                                className="
          absolute right-0 top-1/2
          size-3
          -translate-y-1/2 translate-x-1/2
          rounded-full bg-white
          opacity-0
          scale-75
          shadow-sm
          transition-all duration-150
          group-hover/progress:opacity-100
          group-hover/progress:scale-100
        "
                            />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-3 pb-2 pt-0.5 text-white">
                    {/* Left side - Play/Pause */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePlayPause}
                            className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 fill-white" />
                            ) : (
                                <Play className="w-4 h-4 fill-white" />
                            )}
                        </button>

                        {/* Time Display */}
                        <span className="font-mono text-xs whitespace-nowrap">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>

                        {/* Volume */}
                        <button
                            onClick={handleMuteToggle}
                            className="hover:bg-white/20 p-2 rounded transition-colors"
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Right side - Settings, Theater, Fullscreen */}
                    <div className="flex items-center gap-1 relative">
                        {/* Settings */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettings(!showSettings);
                                    showControlsTemporarily();
                                }}
                                className="hover:bg-white/20 p-2 rounded transition-colors"
                                aria-label="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>

                            {/* Settings Menu */}
                            {showSettings && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg overflow-hidden border border-gray-700 z-50 min-w-48">
                                    {/* Playback Speed */}
                                    <div className="border-b border-gray-700">
                                        <div className="px-4 py-2 text-xs font-medium text-gray-400">
                                            PLAYBACK SPEED
                                        </div>
                                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                            <button
                                                key={speed}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSpeedChange(speed);
                                                    setShowSettings(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${playbackSpeed === speed
                                                    ? "bg-blue-600 text-white font-medium"
                                                    : "text-white hover:bg-white/10"
                                                    }`}
                                            >
                                                {speed}x
                                            </button>
                                        ))}
                                    </div>

                                    {/* Download */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(e);
                                            setShowSettings(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Picture in Picture */}
                        <button
                            onClick={handlePictureInPicture}
                            className={`flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/15 ${isPiP ? "bg-white/15" : ""
                                }`}
                            aria-label={isPiP ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
                            title={isPiP ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
                        >
                            <PictureInPicture className="size-4" />
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={handleFullscreen}
                            className="hover:bg-white/20 p-2 rounded transition-colors"
                            aria-label="Fullscreen"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
