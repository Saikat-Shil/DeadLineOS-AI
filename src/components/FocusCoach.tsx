import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Keyboard, ShieldAlert, Sparkles, HelpCircle, Music, Search, Upload, Link, Check, Plus, Trash2, ExternalLink, X, Settings, Lock, LogOut, Disc, RefreshCw } from 'lucide-react';

interface FocusCoachProps {
  onSessionComplete: (minutes: number) => void;
  onDistractionDetected: () => void;
  distractionCount: number;
}

const DEMO_FOCUS_TRACKS = [
  {
    id: 'dt1',
    name: 'Ambient Raindrop Rain',
    artists: [{ name: 'Nature Beats Studio' }],
    album: { images: [{ url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=100&h=100&fit=crop' }] },
    duration_ms: 180000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    external_urls: { spotify: 'https://open.spotify.com' }
  },
  {
    id: 'dt2',
    name: 'Cozy Cabin Lofi Beat',
    artists: [{ name: 'Deep Work Chill' }],
    album: { images: [{ url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=100&h=100&fit=crop' }] },
    duration_ms: 210000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    external_urls: { spotify: 'https://open.spotify.com' }
  },
  {
    id: 'dt3',
    name: 'Midnight Coding Symphony',
    artists: [{ name: 'Keyboard Dreamer' }],
    album: { images: [{ url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop' }] },
    duration_ms: 195000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    external_urls: { spotify: 'https://open.spotify.com' }
  },
  {
    id: 'dt4',
    name: 'Chill Gaana Sunset Beats',
    artists: [{ name: 'Ragas & Melodies' }],
    album: { images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' }] },
    duration_ms: 240000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    external_urls: { spotify: 'https://open.spotify.com' }
  },
  {
    id: 'dt5',
    name: 'Wynk Zen Forest Waves',
    artists: [{ name: 'Ethereal Harmony' }],
    album: { images: [{ url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop' }] },
    duration_ms: 220000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    external_urls: { spotify: 'https://open.spotify.com' }
  }
];

const parseMusicUrl = (urlStr: string): string | null => {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  
  // If it's already an iframe embed code
  if (trimmed.startsWith('<iframe')) {
    const srcMatch = trimmed.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    // Spotify
    if (host.includes('spotify.com')) {
      const path = url.pathname;
      return `https://open.spotify.com/embed${path}`;
    }

    // YouTube
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = "";
      if (host.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v') || "";
        if (!videoId && url.pathname.startsWith('/embed/')) {
          videoId = url.pathname.split('/')[2];
        }
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
      }
    }

    // Soundcloud
    if (host.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&auto_play=true`;
    }

    return trimmed;
  } catch (e) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return null;
  }
};

const CURATED_PRESETS = [
  { id: 'rain', name: 'Gentle Rain', category: 'Nature', description: 'Calming synthesized rain shower soundscape', type: 'synth' },
  { id: 'lofi', name: 'Cozy Lofi Cabin', category: 'Lofi', description: 'Warm analog chords with slow gentle vibrato', type: 'synth' },
  { id: 'white_noise', name: 'White Noise', category: 'Focus', description: 'Steady full-spectrum sound masking distractions', type: 'synth' },
  { id: 'coffee_shop', name: 'Lo-Fi Jazz Cafe', category: 'Lofi', description: 'Cozy retro study room vibes', type: 'external', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX9RBHndv0G6Y' },
  { id: 'synthwave', name: 'Synthwave Focus', category: 'Retrowave', description: 'Upbeat retro rhythms for coding & deep flow', type: 'external', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLTE7gZJofY' },
  { id: 'classical', name: 'Chopin Concentration', category: 'Classical', description: 'Peaceful solo piano masterpieces', type: 'external', url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWEJl6OY9r32' },
  { id: 'deep_space', name: 'Deep Space Drone', category: 'Focus', description: 'Atmospheric cosmic waves for deep focus', type: 'external', url: 'https://www.youtube.com/embed/6_MInUuL2aA' },
  { id: 'binaural', name: 'Alpha Binaural Beats', category: 'Binaural', description: 'Cognitive enhancement brainwave frequencies', type: 'external', url: 'https://www.youtube.com/embed/WPni755-Krg' }
];

export default function FocusCoach({ onSessionComplete, onDistractionDetected, distractionCount }: FocusCoachProps) {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'break'>('pomodoro');
  
  // Custom user focus timer settings
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  
  // Sound & music states
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'lofi' | 'white_noise' | 'local' | 'external'>('none');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  
  // Music imports & platform state
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [localAudioName, setLocalAudioName] = useState<string | null>(null);
  const [externalStreamUrl, setExternalStreamUrl] = useState('');
  const [parsedEmbedUrl, setParsedEmbedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'local' | 'external'>('presets');
  const [searchQuery, setSearchQuery] = useState('');

  // Typing state
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [testText, setTestText] = useState("");
  const keypressCountRef = useRef(0);
  const [activityLevel, setActivityLevel] = useState<'idle' | 'active' | 'high'>('idle');

  // Webcam eye-tracking simulation
  const [eyeTrackingActive, setEyeTrackingActive] = useState(false);
  const [simulatedDistractionNudge, setSimulatedDistractionNudge] = useState<string | null>(null);

  // Sound ref/mock audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Spotify States & Playlist / Track Selections
  const [spotifyToken, setSpotifyToken] = useState<string | null>(() => localStorage.getItem('spotify_access_token'));
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(() => localStorage.getItem('spotify_refresh_token'));
  const [spotifyUser, setSpotifyUser] = useState<any | null>(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [spotifySearchQuery, setSpotifySearchQuery] = useState('');
  const [spotifySearchResults, setSpotifySearchResults] = useState<any[]>([]);
  const [isSpotifyLoading, setIsSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(() => localStorage.getItem('spotify_is_demo') === 'true');
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [activeTrack, setActiveTrack] = useState<any | null>(() => {
    const saved = localStorage.getItem('spotify_active_track');
    return saved ? JSON.parse(saved) : null;
  });
  const [isPlayingTrack, setIsPlayingTrack] = useState(false);

  const spotifyAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to always have the latest values without re-triggering the timer effect
  const onSessionCompleteRef = useRef(onSessionComplete);
  const modeRef = useRef(mode);
  const focusMinutesRef = useRef(focusMinutes);
  const breakMinutesRef = useRef(breakMinutes);

  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    focusMinutesRef.current = focusMinutes;
    breakMinutesRef.current = breakMinutes;
  }, [focusMinutes, breakMinutes]);

  // Sync timeLeft when minutes change (only if timer is not active)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(mode === 'pomodoro' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, mode, isActive]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            const finishedMinutes = modeRef.current === 'pomodoro' ? focusMinutesRef.current : breakMinutesRef.current;
            
            // Call onSessionComplete safely after current render tick
            setTimeout(() => {
              onSessionCompleteRef.current(finishedMinutes);
            }, 0);

            // Switch mode
            if (modeRef.current === 'pomodoro') {
              setMode('break');
              setSimulatedDistractionNudge("🎉 Focus session complete! Time for a restorative break.");
              return breakMinutesRef.current * 60;
            } else {
              setMode('pomodoro');
              setSimulatedDistractionNudge("💪 Break complete. Let's block out distractions for another cycle.");
              return focusMinutesRef.current * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // Typing speed calculator
  useEffect(() => {
    const interval = setInterval(() => {
      if (keypressCountRef.current > 0) {
        const words = keypressCountRef.current / 5;
        const wpm = Math.round(words * 12); // scaled from 5s to 60s
        setTypingSpeed(wpm);
        setActivityLevel(wpm > 60 ? 'high' : 'active');
        keypressCountRef.current = 0;
      } else {
        setTypingSpeed(0);
        setActivityLevel('idle');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Audio simulation
  const playAmbientOscillator = (soundType: string) => {
    if (isAudioMuted || soundType === 'none') {
      stopAmbient();
      return;
    }
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      const startSynth = () => {
        stopAmbient();
        
        if (soundType === 'rain') {
          // Brownian noise filter approximation
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // Amplify
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const lowpass = ctx.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 400;

          const gainNode = ctx.createGain();
          gainNode.gain.value = 0.15;

          whiteNoise.connect(lowpass);
          lowpass.connect(gainNode);
          gainNode.connect(ctx.destination);

          whiteNoise.start();
          noiseNodeRef.current = whiteNoise;
        } else if (soundType === 'white_noise') {
          const bufferSize = ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          const gainNode = ctx.createGain();
          gainNode.gain.value = 0.04;

          noise.connect(gainNode);
          gainNode.connect(ctx.destination);

          noise.start();
          noiseNodeRef.current = noise;
        } else if (soundType === 'lofi') {
          // Create an oscillator playing steady soothing low chords
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.value = 110; // A2 chord
          osc2.type = 'triangle';
          osc2.frequency.value = 165; // E3

          gainNode.gain.value = 0.08;

          // Vibrato
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 1.5;
          lfoGain.gain.value = 3;

          lfo.connect(lfoGain);
          lfoGain.connect(osc1.frequency);
          lfoGain.connect(osc2.frequency);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);

          lfo.start();
          osc1.start();
          osc2.start();

          // Save reference as object with a custom stop method
          noiseNodeRef.current = {
            disconnect() {
              try { osc1.stop(); } catch (err) {}
              try { osc2.stop(); } catch (err) {}
              try { lfo.stop(); } catch (err) {}
              try { osc1.disconnect(); } catch (err) {}
              try { osc2.disconnect(); } catch (err) {}
              try { lfo.disconnect(); } catch (err) {}
              try { gainNode.disconnect(); } catch (err) {}
            }
          } as any;
        }
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(startSynth).catch(err => {
          console.warn("Could not resume AudioContext:", err);
          startSynth();
        });
      } else {
        startSynth();
      }
    } catch (e) {
      console.error("Synthesizer error:", e);
    }
  };

  const stopAmbient = () => {
    if (noiseNodeRef.current) {
      try {
        if ('stop' in noiseNodeRef.current) {
          (noiseNodeRef.current as any).stop();
        }
      } catch (err) {}
      try {
        noiseNodeRef.current.disconnect();
      } catch (err) {}
      noiseNodeRef.current = null;
    }
  };

  // Synthesized soundscape effect: Only play when timer is active and not muted
  useEffect(() => {
    if (isActive && !isAudioMuted && (ambientSound === 'rain' || ambientSound === 'lofi' || ambientSound === 'white_noise')) {
      playAmbientOscillator(ambientSound);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [ambientSound, isAudioMuted, isActive]);

  // Local imported music play/pause effect
  useEffect(() => {
    const localAudio = localAudioRef.current;
    if (localAudio) {
      if (ambientSound === 'local' && isActive && !isAudioMuted && localAudioUrl) {
        localAudio.play().catch((err) => {
          console.warn("Local audio playback waiting for user action:", err);
        });
      } else {
        localAudio.pause();
      }
    }
  }, [ambientSound, isActive, isAudioMuted, localAudioUrl]);

  // Listen for message events from popup window
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('0.0.0.0')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.platform === 'spotify') {
        const { accessToken, refreshToken } = event.data;
        localStorage.setItem('spotify_access_token', accessToken);
        if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
        localStorage.setItem('spotify_is_demo', 'false');
        setSpotifyToken(accessToken);
        setSpotifyRefreshToken(refreshToken || null);
        setIsDemoMode(false);
        setSpotifyError(null);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setSpotifyError(event.data.error || "Authentication failed");
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Sync Spotify Profiles & Playlists
  useEffect(() => {
    if (isDemoMode) {
      setSpotifyUser({
        display_name: "Focus Explorer (Demo)",
        email: "demo@focuscoach.io",
        images: [{ url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" }]
      });
      setSpotifyPlaylists([
        { id: 'demo_pl_1', name: 'Ambient Study Beats', tracks: { total: 5 }, images: [{ url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120&h=120&fit=crop' }], description: 'Relaxing high-fidelity lofi beats for coding' },
        { id: 'demo_pl_2', name: 'Brain Wave Alpha Waves', tracks: { total: 5 }, images: [{ url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=120&h=120&fit=crop' }], description: 'Alpha frequencies designed to enhance cognitive flow' },
        { id: 'demo_pl_3', name: 'Rainfall & Analog Synths', tracks: { total: 5 }, images: [{ url: 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=120&h=120&fit=crop' }], description: 'Slow analog pad textures paired with heavy rain drops' }
      ]);
      return;
    }

    if (!spotifyToken) {
      setSpotifyUser(null);
      setSpotifyPlaylists([]);
      return;
    }

    const fetchSpotifyData = async () => {
      setIsSpotifyLoading(true);
      setSpotifyError(null);
      try {
        const profileRes = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        });
        
        if (profileRes.status === 401) {
          await refreshSpotifyToken();
          return;
        }

        if (!profileRes.ok) throw new Error('Failed to fetch Spotify profile');
        const profileData = await profileRes.json();
        setSpotifyUser(profileData);

        const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=8', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        });
        if (playlistsRes.ok) {
          const playlistsData = await playlistsRes.json();
          setSpotifyPlaylists(playlistsData.items || []);
        }
      } catch (err: any) {
        console.error("Spotify Profile Sync Failure:", err);
        setSpotifyError(err.message || "Failed to load Spotify details");
      } finally {
        setIsSpotifyLoading(false);
      }
    };

    fetchSpotifyData();
  }, [spotifyToken, isDemoMode]);

  // Synchronize playback of Selected Spotify / Demo Previews with Focus active state
  useEffect(() => {
    const audio = spotifyAudioRef.current;
    if (audio) {
      if (activeTrack?.preview_url && isActive && !isAudioMuted && ambientSound === 'external') {
        audio.play().then(() => {
          setIsPlayingTrack(true);
        }).catch((err) => {
          console.warn("Spotify audio preview waiting for interaction:", err);
        });
      } else {
        audio.pause();
        setIsPlayingTrack(false);
      }
    }
  }, [activeTrack, isActive, isAudioMuted, ambientSound]);

  const refreshSpotifyToken = async () => {
    if (!spotifyRefreshToken || isDemoMode) return;
    try {
      const res = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: spotifyRefreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('spotify_access_token', data.accessToken);
        setSpotifyToken(data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('spotify_refresh_token', data.refreshToken);
          setSpotifyRefreshToken(data.refreshToken);
        }
      } else {
        handleSpotifyLogout();
      }
    } catch (e) {
      console.error("Token refresh error:", e);
      handleSpotifyLogout();
    }
  };

  const handleSpotifyLogout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_is_demo');
    localStorage.removeItem('spotify_active_track');
    setSpotifyToken(null);
    setSpotifyRefreshToken(null);
    setSpotifyUser(null);
    setSpotifyPlaylists([]);
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setIsDemoMode(false);
    setActiveTrack(null);
    setIsPlayingTrack(false);
    if (ambientSound === 'external') {
      setAmbientSound('none');
    }
  };

  const handleConnectSpotify = async () => {
    setIsSpotifyLoading(true);
    setSpotifyError(null);
    try {
      const res = await fetch('/api/spotify/auth-url');
      if (!res.ok) throw new Error('Authorization endpoint query failed.');
      const data = await res.json();
      
      if (data.url) {
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          data.url,
          'spotify_oauth_popup',
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
      } else {
        setIsDemoMode(true);
        localStorage.setItem('spotify_is_demo', 'true');
        setSpotifyError("Spotify credentials not set on server. Entered offline high-fidelity Sandbox Demo mode so you can test features instantly!");
      }
    } catch (e: any) {
      setSpotifyError(e.message || "Could not initiate connection");
    } finally {
      setIsSpotifyLoading(false);
    }
  };

  const handleSpotifySearch = async (query: string) => {
    setSpotifySearchQuery(query);
    if (!query.trim()) {
      setSpotifySearchResults([]);
      return;
    }

    if (isDemoMode) {
      const filtered = DEMO_FOCUS_TRACKS.filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase()) || 
        t.artists[0].name.toLowerCase().includes(query.toLowerCase())
      );
      setSpotifySearchResults(filtered);
      return;
    }

    if (!spotifyToken) return;

    setIsSpotifyLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSpotifySearchResults(data.tracks?.items || []);
      } else if (res.status === 401) {
        await refreshSpotifyToken();
      }
    } catch (e) {
      console.error("Spotify search error:", e);
    } finally {
      setIsSpotifyLoading(false);
    }
  };

  const handleSelectPlaylist = async (playlist: any) => {
    setSelectedPlaylist(playlist);
    setPlaylistTracks([]);
    
    if (isDemoMode) {
      setPlaylistTracks(DEMO_FOCUS_TRACKS);
      return;
    }

    if (!spotifyToken) return;

    setIsSpotifyLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=10`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setPlaylistTracks(items.map((i: any) => i.track).filter(Boolean));
      } else if (res.status === 401) {
        await refreshSpotifyToken();
      }
    } catch (e) {
      console.error("Spotify fetch playlist tracks error:", e);
    } finally {
      setIsSpotifyLoading(false);
    }
  };

  const handleSelectSound = (sound: 'none' | 'rain' | 'lofi' | 'white_noise' | 'local' | 'external') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {
      console.warn("AudioContext initialization warning:", e);
    }
    setAmbientSound(sound);
  };

  const handleToggleMute = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {
      console.warn("AudioContext initialization warning:", e);
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleTimer = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {
      console.warn("AudioContext initialization warning:", e);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'pomodoro' ? focusMinutes * 60 : breakMinutes * 60);
  };

  const handleKeyPress = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTestText(e.target.value);
    keypressCountRef.current += 1;
  };

  // Simulated procrastination/attention trigger
  const triggerSimulatedProcrastination = (reason: 'phone' | 'youtube' | 'idle') => {
    onDistractionDetected();
    if (reason === 'phone') {
      setSimulatedDistractionNudge("📱 Distraction Detected: I noticed you picking up your phone. Behavioral nudge: Let's commit to just 10 more minutes of writing. You can do this!");
    } else if (reason === 'youtube') {
      setSimulatedDistractionNudge("🎥 Video Loop Detected: YouTube tabs are pulling your focus away. Proactive rescue: I've reinforced your block list. Let's finish this subtask first.");
    } else {
      setSimulatedDistractionNudge("💤 Idle Attention Warning: Idle keyboard detected for over 3 minutes. Nudge: The friction to start is always psychological. Write one sentence now.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md" id="focus-coach">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
            AI Focus Coach & Procrastination Detector
          </h3>
          <p className="text-sm text-slate-400">Restricts notifications, tracks active keyboard attention, and optimizes sleep rhythms.</p>
        </div>

        {/* Eye tracking simulated switch */}
        <button
          onClick={() => setEyeTrackingActive(!eyeTrackingActive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono transition-all duration-200 border ${
            eyeTrackingActive 
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Simulates standard eye-movement / camera attention logging"
        >
          <Eye className={`h-3.5 w-3.5 ${eyeTrackingActive ? 'text-indigo-400 animate-pulse' : ''}`} />
          {eyeTrackingActive ? 'Camera Attention: Tracking' : 'Camera tracking: Off'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Timer View */}
        <div className="flex flex-col items-center justify-center bg-slate-950/40 rounded-xl p-6 border border-slate-800/60 relative">
          {/* Time Customizer Settings Button */}
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={() => setShowTimeSettings(!showTimeSettings)}
              className={`p-1.5 rounded-lg border transition ${
                showTimeSettings
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Set Custom Focus/Break Time"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">
            {mode === 'pomodoro' ? '🎯 Focus Session' : '☕ Rest Period'}
          </div>

          <div className="text-6xl font-mono font-black text-slate-100 tracking-tight mb-6">
            {formatTime(timeLeft)}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-all duration-200 shadow-md ${
                isActive 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isActive ? 'Pause Session' : 'Start Focus'}
            </button>

            <button
              onClick={resetTimer}
              className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all duration-150"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Time Customizer settings drawer inline */}
          {showTimeSettings && (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-400 flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} /> Adjust Timer Parameters
                </span>
                <button onClick={() => setShowTimeSettings(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono block">Focus (Min):</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={focusMinutes}
                    onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 text-slate-200 rounded font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono block">Break (Min):</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 text-slate-200 rounded font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono leading-relaxed">Adjustments apply immediately and calibrate the active cycle.</p>
            </div>
          )}

          {/* Ambient Sound & Custom Music Selector */}
          <div className="w-full space-y-3 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center text-sm text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <Volume2 className="h-3.5 w-3.5 text-indigo-400" /> Focus Audio System
              </span>
              <div className="flex items-center gap-2">
                {ambientSound !== 'none' && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono">
                    Active
                  </span>
                )}
                <button 
                  onClick={handleToggleMute} 
                  className="text-slate-500 hover:text-slate-300 transition"
                  title={isAudioMuted ? "Unmute sounds" : "Mute sounds"}
                >
                  {isAudioMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Sync Alert Banner */}
            {!isActive && ambientSound !== 'none' && (
              <div className="p-2 rounded bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300 font-mono text-center">
                ⏳ Audio stream is idle. Start focus above to trigger play!
              </div>
            )}

            {/* Tab Selector */}
            <div className="flex border-b border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 pb-1.5 border-b-2 text-center transition ${
                  activeTab === 'presets' ? 'border-indigo-500 text-indigo-300 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setActiveTab('local')}
                className={`flex-1 pb-1.5 border-b-2 text-center transition ${
                  activeTab === 'local' ? 'border-indigo-500 text-indigo-300 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Local Audio
              </button>
              <button
                onClick={() => setActiveTab('external')}
                className={`flex-1 pb-1.5 border-b-2 text-center transition ${
                  activeTab === 'external' ? 'border-indigo-500 text-indigo-300 font-bold' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Streaming Links
              </button>
            </div>

            {/* Tab 1: PRESETS & SEARCH */}
            {activeTab === 'presets' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search sounds or genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-7 py-1 text-xs text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {/* Stop option */}
                  <button
                    onClick={() => {
                      handleSelectSound('none');
                      setParsedEmbedUrl(null);
                    }}
                    className={`w-full text-left px-2 py-1 rounded border text-xs font-mono transition flex items-center justify-between ${
                      ambientSound === 'none'
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    <span>🔇 Mute / Stop Sound</span>
                    <span className="text-xs uppercase font-bold text-slate-500">Mute</span>
                  </button>

                  {CURATED_PRESETS.filter(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((preset) => {
                    const isSelected = (preset.id === ambientSound && preset.type === 'synth') || 
                                     (preset.type === 'external' && ambientSound === 'external' && parsedEmbedUrl === preset.url);
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (preset.type === 'synth') {
                            handleSelectSound(preset.id as any);
                            setParsedEmbedUrl(null);
                          } else {
                            handleSelectSound('external');
                            setParsedEmbedUrl(preset.url);
                          }
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded border text-xs font-mono transition flex items-center justify-between ${
                          isSelected && !isAudioMuted
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="truncate max-w-[150px]">
                          <div className="font-bold flex items-center gap-1 text-xs">
                            {preset.type === 'synth' ? <Sparkles className="h-3 w-3 text-indigo-400 shrink-0 animate-pulse" /> : <Music className="h-3 w-3 text-pink-400 shrink-0" />}
                            {preset.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{preset.description}</div>
                        </div>
                        <span className="text-xs px-1 bg-slate-950 rounded text-slate-400 shrink-0 ml-1">
                          {preset.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: LOCAL AUDIO FILE */}
            {activeTab === 'local' && (
              <div className="space-y-2">
                <div className="border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-lg p-2.5 transition text-center bg-slate-950/20 relative group">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setLocalAudioUrl(url);
                        setLocalAudioName(file.name);
                        handleSelectSound('local');
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="h-4 w-4 mx-auto text-slate-500 group-hover:text-indigo-400 mb-0.5" />
                  <span className="block text-xs font-mono text-slate-400 group-hover:text-slate-200">
                    Import Local Music
                  </span>
                  <span className="block text-xs text-slate-600 font-mono">
                    Supports MP3, WAV, M4A from system
                  </span>
                </div>

                {localAudioName && (
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-850 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[130px]">
                      <Music className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate" title={localAudioName}>{localAudioName}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleSelectSound('local')}
                        className={`px-1.5 py-0.5 rounded text-xs transition ${
                          ambientSound === 'local' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ambientSound === 'local' ? 'Active' : 'Select'}
                      </button>
                      <button
                        onClick={() => {
                          setLocalAudioUrl(null);
                          setLocalAudioName(null);
                          if (ambientSound === 'local') {
                            handleSelectSound('none');
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Remove track"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                <audio ref={localAudioRef} src={localAudioUrl || undefined} loop />
                <audio ref={spotifyAudioRef} src={activeTrack?.preview_url || undefined} loop />
              </div>
            )}

            {/* Tab 3: STREAMING PLATFORMS LINKS */}
            {activeTab === 'external' && (
              <div className="space-y-3">
                {/* Spotify / Gaana / Wynk Sync Panel */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <Disc className={`h-3.5 w-3.5 ${isPlayingTrack ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                      Spotify & Streaming Console
                    </span>
                    {(spotifyToken || isDemoMode) && (
                      <button
                        onClick={handleSpotifyLogout}
                        className="flex items-center gap-1 text-xs font-mono text-rose-400 hover:text-rose-300 transition"
                        title="Disconnect Account"
                      >
                        <LogOut className="h-3 w-3" /> Disconnect
                      </button>
                    )}
                  </div>

                  {spotifyError && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono leading-relaxed">
                      ⚠️ {spotifyError}
                    </div>
                  )}

                  {/* Connect Screen */}
                  {!spotifyToken && !isDemoMode ? (
                    <div className="text-center py-4 space-y-2.5">
                      <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-[210px] mx-auto">
                        Connect your active Spotify account to play playlists, sync tracks, or browse curated focus streams.
                      </p>
                      <button
                        onClick={handleConnectSpotify}
                        disabled={isSpotifyLoading}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 text-xs font-bold rounded-full transition flex items-center gap-1.5 mx-auto shadow-md cursor-pointer animate-pulse"
                      >
                        <Music className="h-3.5 w-3.5" />
                        {isSpotifyLoading ? 'Loading Spotify...' : 'Connect Spotify Account'}
                      </button>
                      <div className="text-xs font-mono text-slate-500">
                        Supports Gaana, Wynk & YouTube link play via simulation mode.
                      </div>
                    </div>
                  ) : (
                    /* Dashboard Screen */
                    <div className="space-y-3">
                      {/* User Profile */}
                      {spotifyUser && (
                        <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-850">
                          <div className="flex items-center gap-2 min-w-0">
                            {spotifyUser.images?.[0]?.url ? (
                              <img src={spotifyUser.images[0].url} alt="Profile" className="h-5 w-5 rounded-full object-cover border border-emerald-500/30" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-400 font-bold font-mono">
                                S
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-200 truncate">{spotifyUser.display_name}</span>
                              <span className="block text-xs text-slate-500 font-mono truncate">{isDemoMode ? 'Offline Sandbox Active' : 'Spotify Premium Connected'}</span>
                            </div>
                          </div>
                          {isDemoMode && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-400 uppercase font-bold shrink-0">
                              Demo Play
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active Player Track Info */}
                      {activeTrack && (
                        <div className="p-2 rounded bg-slate-900 border border-emerald-500/25 relative overflow-hidden space-y-1.5">
                          <div className="flex items-center gap-2">
                            <img
                              src={activeTrack.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=60&h=60&fit=crop'}
                              alt="Cover"
                              className="h-8 w-8 rounded object-cover shadow-md shrink-0 border border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1 leading-tight">
                              <span className="block text-xs font-bold text-slate-100 truncate flex items-center gap-1">
                                {isPlayingTrack && <Sparkles className="h-3 w-3 text-emerald-400 shrink-0 animate-bounce" />}
                                {activeTrack.name}
                              </span>
                              <span className="block text-xs text-slate-400 truncate">{activeTrack.artists?.map((a: any) => a.name).join(', ')}</span>
                            </div>
                            <button
                              onClick={() => {
                                handleSelectSound('external');
                                if (isActive) {
                                  const audio = spotifyAudioRef.current;
                                  if (audio) {
                                    if (audio.paused) {
                                      audio.play().then(() => setIsPlayingTrack(true));
                                    } else {
                                      audio.pause();
                                      setIsPlayingTrack(false);
                                    }
                                  }
                                } else {
                                  toggleTimer();
                                }
                              }}
                              className="p-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 transition cursor-pointer"
                              title={isPlayingTrack ? "Pause Track" : "Play Track"}
                            >
                              {isPlayingTrack ? <Pause className="h-3.5 w-3.5 text-emerald-400" /> : <Play className="h-3.5 w-3.5 text-slate-400" />}
                            </button>
                          </div>

                          {/* Progress slider bar */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 leading-none">
                              <span>{isPlayingTrack && isActive ? 'Playing' : 'Ready'}</span>
                              <span>Synced with Focus Clock</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${isPlayingTrack ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} 
                                style={{ width: isPlayingTrack ? '65%' : '0%' }}
                              />
                            </div>
                          </div>

                          {/* Sync warning matching: music should start only when the focus time is started */}
                          {!isActive ? (
                            <div className="p-1 bg-amber-500/10 border border-amber-500/25 rounded text-xs text-amber-300 font-mono text-center flex items-center justify-center gap-1 leading-none mt-1">
                              <Lock className="h-2.5 w-2.5 shrink-0" />
                              Focus timer is idle. Track starts when you click "Start Focus"!
                            </div>
                          ) : (
                            <div className="p-1 bg-emerald-500/15 border border-emerald-500/25 rounded text-xs text-emerald-300 font-mono text-center flex items-center justify-center gap-1 leading-none mt-1">
                              <Sparkles className="h-2.5 w-2.5 shrink-0 animate-pulse" />
                              Streaming live in harmony with focus state!
                            </div>
                          )}
                        </div>
                      )}

                      {/* Interactive Tabs for Playlists or Track Search */}
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-1.5">
                          <div className="relative flex-1">
                            <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Search track or playlist..."
                              value={spotifySearchQuery}
                              onChange={(e) => handleSpotifySearch(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded pl-6.5 pr-6 py-1 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none placeholder-slate-700"
                            />
                            {spotifySearchQuery && (
                              <button
                                onClick={() => {
                                  setSpotifySearchQuery('');
                                  setSpotifySearchResults([]);
                                }}
                                className="absolute right-1.5 top-1.5 text-slate-500 hover:text-slate-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Search Results / Tracks display */}
                        {spotifySearchResults.length > 0 ? (
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                            <div className="text-xs font-mono text-emerald-500 font-bold px-1 uppercase tracking-wider">Search Results:</div>
                            {spotifySearchResults.map((track) => {
                              const isSelected = activeTrack?.id === track.id;
                              return (
                                <button
                                  key={track.id}
                                  onClick={() => {
                                    setActiveTrack(track);
                                    localStorage.setItem('spotify_active_track', JSON.stringify(track));
                                    handleSelectSound('external');
                                  }}
                                  className={`w-full text-left p-1 rounded border text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                      : 'bg-slate-900/60 border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                                    <img src={track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=40&h=40&fit=crop'} alt="art" className="h-4 w-4 rounded shrink-0 object-cover" referrerPolicy="no-referrer" />
                                    <div className="truncate">
                                      <div className="font-bold truncate text-xs">{track.name}</div>
                                      <div className="text-xs text-slate-500 truncate">{track.artists?.[0]?.name}</div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                                    {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : selectedPlaylist ? (
                          /* Selected Playlist Tracks list */
                          <div className="space-y-1">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-xs font-mono text-slate-400 font-bold truncate">Tracks: {selectedPlaylist.name}</span>
                              <button onClick={() => setSelectedPlaylist(null)} className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer">
                                Back to Playlists
                              </button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                              {playlistTracks.length === 0 && isSpotifyLoading ? (
                                <div className="text-center py-2 text-xs font-mono text-slate-500 animate-pulse">Loading tracks...</div>
                              ) : (
                                playlistTracks.map((track) => {
                                  const isSelected = activeTrack?.id === track.id;
                                  return (
                                    <button
                                      key={track.id}
                                      onClick={() => {
                                        setActiveTrack(track);
                                        localStorage.setItem('spotify_active_track', JSON.stringify(track));
                                        handleSelectSound('external');
                                      }}
                                      className={`w-full text-left p-1 rounded border text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                          : 'bg-slate-900/60 border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                                        <img src={track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=40&h=40&fit=crop'} alt="art" className="h-4 w-4 rounded shrink-0 object-cover" referrerPolicy="no-referrer" />
                                        <div className="truncate leading-none">
                                          <div className="font-bold truncate text-xs">{track.name}</div>
                                          <span className="text-xs text-slate-500">{track.artists?.[0]?.name}</span>
                                        </div>
                                      </div>
                                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                                        {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Browse Curated & Personal Playlists */
                          <div className="space-y-1.5">
                            <div className="text-xs font-mono text-slate-500 font-bold px-1 uppercase tracking-wider">Browse Playlists:</div>
                            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                              {spotifyPlaylists.map((playlist) => (
                                <button
                                  key={playlist.id}
                                  onClick={() => handleSelectPlaylist(playlist)}
                                  className="p-1 rounded bg-slate-900/80 border border-slate-850 hover:bg-slate-800 text-left transition flex items-center gap-1.5 text-xs font-mono text-slate-300 min-w-0 cursor-pointer"
                                >
                                  <img
                                    src={playlist.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=60&h=60&fit=crop'}
                                    alt="playlist art"
                                    className="h-6 w-6 rounded object-cover shrink-0 border border-slate-800"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0 leading-tight">
                                    <div className="font-bold text-slate-200 truncate">{playlist.name}</div>
                                    <div className="text-[9px] text-slate-500 truncate">{playlist.tracks?.total} Tracks</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Legacy Paste Url link as fallback or for YouTube, Wynk, Gaana */}
                <div className="p-2.5 rounded-lg border border-slate-850 bg-slate-950/20 space-y-1">
                  <label className="text-xs font-mono text-slate-400 block uppercase tracking-wider">
                    Or paste direct share link (Gaana, Wynk, YouTube, SoundCloud):
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. https://open.spotify.com/playlist/..."
                      value={externalStreamUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setExternalStreamUrl(url);
                        const embed = parseMusicUrl(url);
                        if (embed) {
                          setParsedEmbedUrl(embed);
                          handleSelectSound('external');
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-xs font-mono text-slate-300 focus:border-indigo-500 focus:outline-none placeholder-slate-700"
                    />
                    {externalStreamUrl && (
                      <button
                        onClick={() => {
                          setExternalStreamUrl('');
                          setParsedEmbedUrl(null);
                          if (ambientSound === 'external') {
                            handleSelectSound('none');
                          }
                        }}
                        className="px-1.5 bg-slate-800 hover:bg-slate-750 rounded text-slate-400 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {parsedEmbedUrl && (
                  <div className="space-y-1">
                    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 h-28 w-full shadow-inner flex items-center justify-center">
                      {!isActive && (
                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-2 text-center select-none">
                          <Lock className="h-4 w-4 text-indigo-400 mb-0.5 animate-bounce" />
                          <span className="text-xs font-mono text-indigo-300 font-bold">Focus Stream Locked</span>
                          <span className="text-xs text-slate-400 font-mono mt-0.5 max-w-[160px] leading-tight font-bold">
                            Starts playing when Focus session begins.
                          </span>
                        </div>
                      )}
                      
                      <iframe
                        src={parsedEmbedUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Procrastination Nudges & Activity Capture */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between text-sm font-mono text-slate-400">
                <span className="flex items-center gap-1"><Keyboard className="h-3.5 w-3.5 text-indigo-400" /> Activity Monitor</span>
                <span className={`px-1.5 py-0.5 rounded text-xs uppercase font-bold ${
                  activityLevel === 'high' ? 'bg-emerald-500/10 text-emerald-400' : activityLevel === 'active' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                }`}>{activityLevel}</span>
              </div>

              {/* Focus Scratchpad */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Use this work area / notes pad to keep active focus:</label>
                <textarea
                  value={testText}
                  onChange={handleKeyPress}
                  placeholder="Type notes, draft sections, or jot down ideas here. The coach monitors typing speed to gauge flow state."
                  className="w-full h-24 bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Current Typing Speed:</span>
                <span className="font-mono text-slate-200">{typingSpeed} WPM</span>
              </div>
            </div>

            {/* Simulated Distraction triggers */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-500">Test Procrastination Scenarios (Psychology Nudges):</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerSimulatedProcrastination('phone')}
                  className="py-1.5 px-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs font-mono text-slate-300 rounded-lg transition-all"
                >
                  Pick up Phone
                </button>
                <button
                  onClick={() => triggerSimulatedProcrastination('youtube')}
                  className="py-1.5 px-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs font-mono text-slate-300 rounded-lg transition-all"
                >
                  Open YouTube
                </button>
                <button
                  onClick={() => triggerSimulatedProcrastination('idle')}
                  className="py-1.5 px-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs font-mono text-slate-300 rounded-lg transition-all"
                >
                  Idle Timeout
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Distractions Mitigated:</span>
              <span className="font-mono text-indigo-400 font-bold">{distractionCount}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300" 
                style={{ width: `${Math.min(100, distractionCount * 12)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {simulatedDistractionNudge && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-sm text-slate-200 space-y-2 relative">
          <button 
            onClick={() => setSimulatedDistractionNudge(null)} 
            className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
          >
            ×
          </button>
          <div className="flex items-center gap-1.5 font-bold text-indigo-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            DeadlineOS Active Nudge
          </div>
          <p className="text-slate-300 leading-relaxed font-mono">{simulatedDistractionNudge}</p>
        </div>
      )}
    </div>
  );
}
