'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, Settings, Maximize, Volume2, VolumeX, Users, Radio } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import LiveChat from './LiveChat'
import InPlayerAd from './InPlayerAd'
import { useVideoAds } from '@/lib/useVideoAds'

const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p', '360p']
const VIDEO_DURATION = 5400 // 90 min simulated

export default function VideoPlayer() {
  const { selectedStream, setCurrentView, setSelectedStream } = useAppStore()
  const [isMuted, setIsMuted] = useState(false)
  const [quality, setQuality] = useState('Auto')
  const [showQuality, setShowQuality] = useState(false)
  const [viewerCount, setViewerCount] = useState(selectedStream?.viewerCount || 0)

  // ── Simulated playback ──
  const [isPaused, setIsPaused] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)

  // ── Ad system ──
  const {
    phase: adPhase,
    currentAd,
    isAdPlaying,
    midRollSlots,
    shownBreaks,
    skipAd,
    tick: adTick,
    checkEnd: adCheckEnd,
  } = useVideoAds({
    videoDurationSec: VIDEO_DURATION,
    category: selectedStream?.category,
    playbackPosition,
    onPauseForAd: useCallback(() => setIsPaused(true), []),
    onResumeFromAd: useCallback(() => setIsPaused(false), []),
    videoEnded,
  })

  // Playback tick — calls ad tick + checkEnd inside interval handler
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && !videoEnded) {
        setPlaybackPosition(prev => {
          const next = prev + 1
          if (next >= VIDEO_DURATION) {
            setVideoEnded(true)
            return VIDEO_DURATION
          }
          return next
        })
      }
      // Run ad system checks from the interval handler (event handler, not render)
      adTick()
      adCheckEnd()
    }, 1000)
    return () => clearInterval(interval)
  }, [isPaused, videoEnded, adTick, adCheckEnd])

  const handleAdComplete = useCallback(() => {
    skipAd()
  }, [skipAd])

  // Viewer count simulation
  useEffect(() => {
    if (!selectedStream) return
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const delta = Math.floor(Math.random() * 100) - 50
        return Math.max(100, prev + delta)
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedStream])

  if (!selectedStream) return null

  const formatViewers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="sportix-bg min-h-screen">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-white/5 bg-[#141414]/80 px-4 backdrop-blur-xl">
        <button
          onClick={() => {
            setCurrentView('home')
            setSelectedStream(null)
          }}
          className="flex items-center gap-2 rounded-lg p-2 text-white/50 transition-all hover:bg-white/5 hover:text-white touch-active"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden text-sm sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff3b3b] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3b3b]" />
          </span>
          <h1 className="truncate text-sm font-semibold text-white">{selectedStream.title}</h1>
        </div>
        {isAdPlaying && (
          <span className="flex items-center gap-1.5 rounded-lg bg-[#E50914]/10 px-2.5 py-1 text-[10px] font-bold text-[#E50914]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E50914] animate-pulse" />
            {adPhase === 'pre-roll' ? 'Ad' : adPhase === 'mid-roll' ? 'Ad Break' : 'Sponsored'}
          </span>
        )}
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Users className="h-3.5 w-3.5" />
          {formatViewers(viewerCount)}
        </div>
      </header>

      {/* Player + Chat layout */}
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row">
          {/* Player Area */}
          <div className="flex-1 p-4 md:p-6">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-black">
              {/* Video Player Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#111827] to-[#1a2235]">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 flex items-center justify-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E50914]/10 ring-2 ring-[#E50914]/20 animate-pulse">
                        <Radio className="h-8 w-8 text-[#E50914]" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-white">{selectedStream.homeTeam} vs {selectedStream.awayTeam}</p>
                    <p className="mt-2 text-sm text-[#E50914] font-medium">
                      {selectedStream.homeScore} — {selectedStream.awayScore}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {selectedStream.matchTime || 'LIVE'} • {formatViewers(viewerCount)} watching
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
                }} />
              </div>

              {/* ── In-Player Ad Overlay ── */}
              <AnimatePresence>
                {isAdPlaying && currentAd && (
                  <InPlayerAd
                    ad={currentAd}
                    phase={adPhase as 'pre-roll' | 'mid-roll' | 'post-roll'}
                    onComplete={handleAdComplete}
                    onSkip={skipAd}
                  />
                )}
              </AnimatePresence>

              {/* ── Mid-roll ad markers ── */}
              {midRollSlots.length > 0 && !isAdPlaying && (
                <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                  {midRollSlots.map(slot => {
                    const pct = (slot.timestamp / VIDEO_DURATION) * 100
                    const shown = shownBreaks.has(slot.timestamp)
                    return (
                      <div
                        key={slot.timestamp}
                        className="absolute bottom-0 h-2 w-[3px] rounded-t-sm"
                        style={{
                          left: `${pct}%`,
                          background: shown ? 'rgba(255,255,255,0.2)' : '#E50914',
                        }}
                        title={shown ? `Ad break at ${slot.label} (played)` : `Ad break at ${slot.label}`}
                      />
                    )
                  })}
                </div>
              )}

              {/* Player Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="rounded-lg p-2 text-white/70 transition-colors hover:text-white hover:bg-white/10"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowQuality(!showQuality)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
                      >
                        {quality}
                      </button>
                      {showQuality && (
                        <div className="absolute bottom-full right-0 mb-2 rounded-xl border border-white/10 bg-[#141414] p-1 shadow-2xl backdrop-blur-xl">
                          {QUALITY_OPTIONS.map((q) => (
                            <button
                              key={q}
                              onClick={() => { setQuality(q); setShowQuality(false) }}
                              className={`flex w-full items-center rounded-lg px-3 py-1.5 text-xs transition-colors ${
                                quality === q ? 'bg-[#E50914]/10 text-[#E50914]' : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="rounded-lg p-2 text-white/70 transition-colors hover:text-white hover:bg-white/10">
                      <Settings className="h-5 w-5" />
                    </button>
                    <button className="rounded-lg p-2 text-white/70 transition-colors hover:text-white hover:bg-white/10">
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-[#ff3b3b]/10 px-2.5 py-1 text-xs font-bold text-[#ff3b3b] ring-1 ring-[#ff3b3b]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b3b] live-pulse" />
                  LIVE
                </span>
                <span className="text-sm text-white/40">{formatViewers(viewerCount)} watching</span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedStream.title}</h2>
              {selectedStream.description && (
                <p className="text-sm text-white/50 leading-relaxed">{selectedStream.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="rounded-full bg-white/5 px-3 py-1 capitalize">{selectedStream.category}</span>
                <span>{selectedStream.homeTeam} {selectedStream.homeScore} — {selectedStream.awayScore} {selectedStream.awayTeam}</span>
                <span>{selectedStream.matchTime}</span>
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-full border-l border-white/5 lg:w-[380px]">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
              <div className="h-full p-4 md:p-6">
                <div className="h-full">
                  <LiveChat streamId={selectedStream.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
