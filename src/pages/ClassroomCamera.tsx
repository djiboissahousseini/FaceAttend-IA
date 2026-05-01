import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity,
  ScanFace,
  Lock,
  Fingerprint,
  Video,
} from 'lucide-react';
import { Session } from '../types';

type ScanStatus =
  | 'standby'
  | 'ready_teacher'
  | 'holding_teacher'
  | 'scanning_teacher'
  | 'teacher_success'
  | 'teacher_error'
  | 'ready'
  | 'holding'
  | 'scanning'
  | 'success'
  | 'duplicate'
  | 'wrong_group'
  | 'unknown'
  | 'liveness_failed'
  | 'paused'
  | 'error';

import { API_URL } from '../config';
const API = API_URL;

export default function ClassroomCamera() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<ScanStatus>('standby');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ name?: string; message?: string } | null>(null);
  const [time, setTime] = useState(new Date());

  const [classroom, setClassroom] = useState<string>(() => {
    return localStorage.getItem('faceattend_camera_classroom') || 'Salle B1';
  });
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isTeacherUnlocked, setIsTeacherUnlocked] = useState(false);
  const [ignoredSessionId, setIgnoredSessionId] = useState<string | null>(null);
  const [isForcedSession, setIsForcedSession] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [livenessEnabled, setLivenessEnabled] = useState(() => {
    const saved = localStorage.getItem('faceattend_liveness_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoTracking, setAutoTracking] = useState(() => {
    const saved = localStorage.getItem('faceattend_auto_tracking_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('faceattend_liveness_enabled', JSON.stringify(livenessEnabled));
  }, [livenessEnabled]);

  useEffect(() => {
    localStorage.setItem('faceattend_auto_tracking_enabled', JSON.stringify(autoTracking));
  }, [autoTracking]);

  const [showPinPad, setShowPinPad] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // ─── FACE TRACKING (face-api.js) ───────────────────────
  const faceReticleRef = useRef<HTMLDivElement>(null);
  const earHistoryRef = useRef<number[]>([]);
  const [isIAReady, setIsIAReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        console.log('[FaceTracker] Chargement des modèles IA...');
        // Use absolute URL to ensure correct resolution
        const modelUrl = `${window.location.origin}/models`;
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        console.log('[FaceTracker] ✅ Modèles chargés avec succès !');
        if (isMounted) setIsIAReady(true);
      } catch (err) {
        console.error('[FaceTracker] ❌ Erreur de chargement des modèles:', err);
      }
    };
    loadModels();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const runDetection = async () => {
      // The tracker should run during ready state to show the reticle, and during scanning
      const isActivelyScanning = ['ready', 'ready_teacher', 'holding', 'scanning', 'holding_teacher', 'scanning_teacher'].includes(status);

      if (!isMounted || !isIAReady || !isActivelyScanning || status === 'paused') {
        if (faceReticleRef.current) {
          faceReticleRef.current.style.opacity = '0';
          faceReticleRef.current.style.pointerEvents = 'none';
        }
        if (isMounted) timeoutId = setTimeout(runDetection, 400);
        return;
      }

      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        if (video.readyState === 4 && video.videoWidth > 0) {
          try {
            let detections;
            // On calcule les landmarks (mouvement des yeux) UNIQUEMENT pendant la capture pour garder le rectangle fluide
            if (status === 'holding' || status === 'holding_teacher') {
              detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.1 })
              ).withFaceLandmarks();
            } else {
              detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.1 })
              );
            }

            if (isMounted && faceReticleRef.current) {
              if (detections.length > 0) {
                // Compatibilité : si on a des landmarks, la box est dans detection.box, sinon directement dans box
                const box = detections[0].detection ? detections[0].detection.box : detections[0].box;
                const { x, y, width, height } = box;
                
                // Calcul EAR (Eye Aspect Ratio) pour anti-spoofing pendant la capture
                if ((status === 'holding' || status === 'holding_teacher') && detections[0].landmarks) {
                  const leftEye = detections[0].landmarks.getLeftEye();
                  const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                  const ear = (dist(leftEye[1], leftEye[5]) + dist(leftEye[2], leftEye[4])) / (2.0 * dist(leftEye[0], leftEye[3]));
                  earHistoryRef.current.push(ear);
                }

                // Direct DOM update for maximum performance
                faceReticleRef.current.style.opacity = '1';
                faceReticleRef.current.style.left = `${(x / video.videoWidth) * 100}%`;
                faceReticleRef.current.style.top = `${(y / video.videoHeight) * 100}%`;
                faceReticleRef.current.style.width = `${(width / video.videoWidth) * 100}%`;
                faceReticleRef.current.style.height = `${(height / video.videoHeight) * 100}%`;
              } else {
                faceReticleRef.current.style.opacity = '0.3'; // Faint guide when scanning but no face
                faceReticleRef.current.style.left = '37.5%';
                faceReticleRef.current.style.top = '25%';
                faceReticleRef.current.style.width = '25%';
                faceReticleRef.current.style.height = '50%';
              }
            }
          } catch (err) {
            console.error("IA Detection error", err);
          }
        }
      }

      if (isMounted) {
        timeoutId = setTimeout(runDetection, 60); // 15-20 FPS with landmarks
      }
    };

    runDetection();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isIAReady, status]);

  const handleResult = (newStatus: ScanStatus, resData: { name?: string; message?: string }) => {
    setStatus(newStatus);
    setResult(resData);

    // VOICE (Teacher only) & SOUND FEEDBACK
    if (newStatus === 'teacher_success' && resData.name) {
      playSound('success');
      speak(`Bienvenue, Monsieur ${resData.name}.`);
    } else if (newStatus === 'success') {
      playSound('success');
      speak(`Présence validée pour ${resData.name}.`);
    } else if (newStatus === 'duplicate') {
      playSound('warning');
      speak(`${resData.name}, vous êtes déjà enregistré.`);
    } else if (newStatus === 'wrong_group') {
      playSound('error');
      speak(`${resData.name}, ce n'est pas votre groupe.`);
    } else if (newStatus === 'liveness_failed') {
      playSound('error');
      speak(`Alerte sécurité : tentative de fraude détectée.`);
    } else if (newStatus === 'unknown') {
      playSound('error');
      speak(`Identité non reconnue.`);
    } else if (newStatus === 'error' || newStatus === 'teacher_error') {
      playSound('error');
      speak(`Erreur système.`);
    }

    // Auto-reset results after 4 seconds
    if (
      !['scanning', 'holding', 'scanning_teacher', 'holding_teacher', 'standby', 'paused'].includes(
        newStatus
      )
    ) {
      setTimeout(() => {
        setResult(null);
        setStatus(isTeacherUnlocked ? 'ready' : 'ready_teacher');
      }, 4000);
    }
  };

  const captureAndScan = async (targetType: 'teacher' | 'student') => {
    if (!webcamRef.current || !activeSession) {
      setStatus('standby');
      return;
    }

    setStatus(targetType === 'teacher' ? 'scanning_teacher' : 'scanning');
    playSound('scan');
    const image = webcamRef.current.getScreenshot();
    if (!image) {
      handleResult(targetType === 'teacher' ? 'teacher_error' : 'error', {
        message: 'ERREUR CAMÉRA',
      });
      return;
    }

    try {
      const res = await fetch(`${API}/api/sessions/${activeSession.id}/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, target_type: targetType, liveness_enabled: livenessEnabled }),
      });
      const data = await res.json();

      if (targetType === 'teacher') {
        if (data.status === 'teacher_success') {
          setIsTeacherUnlocked(true);
          handleResult('teacher_success', { name: data.student?.name, message: 'ACCÈS AUTORISÉ' });
        } else {
          handleResult('teacher_error', { message: data.message || 'ACCÈS REFUSÉ' });
        }
      } else {
        if (data.status === 'success') {
          await fetch(`${API}/api/records/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: activeSession.id,
              student_id: data.student.id,
              status: 'present',
              method: 'facial',
              confidence_score: 1.0 - (data.student.distance || 0),
            }),
          });
          handleResult('success', { name: data.student?.name, message: 'PRÉSENCE VALIDÉE' });
        } else if (data.status === 'duplicate') {
          handleResult('duplicate', { name: data.student?.name, message: 'DÉJÀ ENREGISTRÉ' });
        } else if (data.status === 'wrong_group') {
          handleResult('wrong_group', {
            name: data.student?.name,
            message: data.message || 'GROUPE INVALIDE',
          });
        } else if (data.status === 'liveness_failed') {
          handleResult('liveness_failed', {
            name: 'ALERTE SÉCURITÉ',
            message: data.message || 'ÉCHEC LIVENESS',
          });
        } else {
          handleResult('unknown', { message: 'VISAGE INCONNU' });
        }
      }
    } catch (_e) {
      handleResult(targetType === 'teacher' ? 'teacher_error' : 'error', {
        message: 'ERREUR RÉSEAU',
      });
    }
  };

  // Enumerate cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const video = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(video);
      if (video.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(video[0].deviceId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for classroom changes AND remote commands
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'faceattend_camera_classroom' && e.newValue) {
        setClassroom(e.newValue);
      }

      if (e.key === `faceattend_cmd_${classroom}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          // Only process if the command is recent (within 5 seconds)
          if (Date.now() - data.timestamp > 5000) return;

          switch (data.command) {
            case 'OVERRIDE_TEACHER':
              if (status === 'ready_teacher' || status === 'standby') {
                setIgnoredSessionId(null); // Permettre la reprise si on force l'accès
                setIsTeacherUnlocked(true);
                setStatus('ready');
                setResult({ message: 'ACCÈS ADMIN' });
                setTimeout(() => setResult(null), 3000);
              }
              break;

            case 'REFRESH_TERMINAL':
              window.location.reload();
              break;

            case 'FORCE_STANDBY': {
              const sid = data.payload?.session_id || activeSession?.id;
              if (sid) setIgnoredSessionId(sid.toString());
              setActiveSession(null);
              setIsTeacherUnlocked(false);
              setIsForcedSession(false);
              setStatus('standby');
              break;
            }

            case 'PAUSE_SESSION':
              setStatus((prev) => {
                if (prev === 'paused') {
                  return isTeacherUnlocked ? 'ready' : 'ready_teacher';
                }
                return 'paused';
              });
              break;

            case 'FORCE_START_SESSION': {
              const fetchSessionToForce = async () => {
                try {
                  const res = await fetch(`${API}/api/sessions/${data.payload.session_id}`);
                  if (!res.ok) throw new Error('Session non trouvée');
                  const target: Session = await res.json();
                  setIgnoredSessionId(null); // Reset block
                  setActiveSession(target);
                  setIsTeacherUnlocked(false);
                  setIsForcedSession(true);
                  setStatus('ready_teacher');
                } catch (err) {
                  console.error('Failed to force session', err);
                }
              };
              fetchSessionToForce();
              break;
            }
            case 'TOGGLE_LIVENESS':
              setLivenessEnabled(data.payload.enabled);
              speak(`Anti-Spoofing ${data.payload.enabled ? 'activé' : 'désactivé'}`);
              break;
            case 'TOGGLE_AUTO_TRACKING':
              setAutoTracking(data.payload.enabled);
              speak(`Suivi I A ${data.payload.enabled ? 'activé' : 'désactivé'}`);
              break;
          }
        } catch (err) {
          console.error('Invalid command format', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [classroom, status]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // SAFE POLLING: Use a separate effect that doesn't depend on volatile state
  useEffect(() => {
    let isMounted = true;

    const checkActiveSession = async () => {
      if (!autoTracking) return; // Suivi IA désactivé : on ne cherche pas de cours automatiquement
      try {
        const res = await fetch(`${API}/api/sessions/active?room=${encodeURIComponent(classroom)}`);
        if (!res.ok) {
          if (isMounted && !isForcedSession) setStatus('standby');
          return;
        }

        const currentSession = await res.json();

        if (!isMounted) return;

        if (currentSession && currentSession.id) {
          // Skip if this session was explicitly closed/ignored by admin
          if (ignoredSessionId === currentSession.id.toString()) return;

          setActiveSession(prev => {
            // Update only if it's a new session
            if (!prev || prev.id !== currentSession.id) {
              setIsTeacherUnlocked(false);
              setStatus('ready_teacher');
              return currentSession;
            }
            return prev;
          });
        } else {
          if (!isForcedSession) {
            setActiveSession(null);
            setIsTeacherUnlocked(false);
            setStatus('standby');
          }
        }
      } catch (_e) {
        // Silent fail for background polling
      }
    };

    checkActiveSession();
    const interval = setInterval(checkActiveSession, 10000); // Poll every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [classroom, ignoredSessionId, isForcedSession, autoTracking]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Capturer status dans une variable locale pour éviter la closure stale
    const currentStatus = status;

    if (currentStatus === 'holding' || currentStatus === 'holding_teacher') {
      earHistoryRef.current = []; // Reset EAR history pour la nouvelle capture
      let initialized = false;
      setTimeout(() => {
        initialized = true;
      }, 1000);

      const step = 100 / (1000 / 50);
      interval = setInterval(() => {
        if (!initialized) return;
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            
            // ─── LOCAL LIVENESS CHECK (Eye movement) ───
            if (livenessEnabled && earHistoryRef.current.length > 5) {
              const ears = earHistoryRef.current;
              const maxEar = Math.max(...ears);
              const minEar = Math.min(...ears);
              // Une photo fixe aura une variance d'EAR presque nulle (< 0.01).
              // De vrais yeux présentent des micro-mouvements ou des clignements (> 0.015).
              if (maxEar - minEar < 0.015) {
                handleResult('liveness_failed', { message: 'AUCUN MOUVEMENT OCULAIRE DÉTECTÉ' });
                return 100;
              }
            }
            
            captureAndScan(currentStatus === 'holding_teacher' ? 'teacher' : 'student');
            return 100;
          }
          return p + step;
        });
      }, 50);
    }

    return () => {
      clearInterval(interval);
      setProgress(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const playSound = (type: 'success' | 'error' | 'warning' | 'scan') => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'scan') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // La
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // Mi
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'error') {
        // Double bip grave
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.setValueAtTime(0, now + 0.1);
        gain.gain.setValueAtTime(0.1, now + 0.15);
        gain.gain.setValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Warning (medium)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.error('Audio error', e);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stoppe toute parole en cours
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isTeacherMode = status.includes('teacher');
  const themeColor = isTeacherMode ? '#ff003c' : '#00f0ff';
  const themeClass = isTeacherMode
    ? 'text-[#ff003c] border-[#ff003c]'
    : 'text-[#00f0ff] border-[#00f0ff]';
  const themeBgClass = isTeacherMode ? 'bg-[#ff003c]' : 'bg-[#00f0ff]';

  return (
    <div className="absolute inset-0 z-40 bg-[#020617] flex flex-col items-center justify-center font-mono overflow-hidden select-none">
      <style>{`
        @keyframes globalScanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes scanY {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; opacity: 1; }
        }
        .animate-global-scan {
          animation: globalScanline 8s linear infinite;
        }
        .animate-scan-y {
          animation: scanY 2s ease-in-out infinite;
        }
      `}</style>

      {/* ─── SCANLINES OVERLAY (Subtle Noise) ─── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* ─── GLOBAL SCANLINE (Attenuated) ─── */}
      <div className="absolute inset-0 pointer-events-none z-40 animate-global-scan">
        <div className="w-full h-[2px] bg-[#00f0ff] opacity-10 shadow-[0_0_20px_#00f0ff]" />
      </div>

      {/* ─── HUD HEADER ─── */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div
            className={`p-2 border rounded-none ${themeClass} bg-black/50`}
            style={{ boxShadow: `0 0 15px ${themeColor}` }}
          >
            <Activity size={28} className="animate-pulse" />
          </div>
          <div>
            <div
              className={`font-bold text-2xl uppercase tracking-[0.2em] ${themeClass.split(' ')[0]} drop-shadow-[0_0_8px_CURRENTCOLOR]`}
            >
              {classroom}
            </div>
            <p className="text-slate-400 text-xs tracking-widest mt-1">
              SYSTÈME DE PRÉSENCE INTELLIGENT
            </p>
          </div>
        </div>

        {/* STATUS INDICATORS (TOP CENTER) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div
            className={`px-3 py-1 border text-[9px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${livenessEnabled
              ? 'border-[#00ff9d] text-[#00ff9d] bg-[#00ff9d]/10 shadow-[0_0_10px_rgba(0,255,157,0.3)]'
              : 'border-red-500 text-red-500 bg-red-500/10'
              }`}
          >
            <ShieldAlert size={10} />
            ANTI-SPOOFING: {livenessEnabled ? 'ON' : 'OFF'}
          </div>
          <div
            className={`px-3 py-1 border text-[9px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${autoTracking
              ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
              : 'border-slate-500 text-slate-500 bg-slate-800/50'
              }`}
          >
            <Activity size={10} />
            SUIVI IA: {autoTracking ? 'ON' : 'OFF'}
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="font-mono text-2xl tracking-widest text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            {time.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
          <div
            className={`${themeClass.split(' ')[0]} text-xs tracking-widest mt-1 uppercase transition-colors duration-500`}
          >
            {time.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ─── MAIN CAMERA VIEWPORT ─── */}
      <div className="relative w-full max-w-5xl aspect-video z-20 mt-8 bg-black flex items-center justify-center border border-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
        {/* Physical Corners */}
        <div
          className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 ${themeClass} z-30 transition-colors duration-500`}
        />
        <div
          className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 ${themeClass} z-30 transition-colors duration-500`}
        />
        <div
          className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 ${themeClass} z-30 transition-colors duration-500`}
        />
        <div
          className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 ${themeClass} z-30 transition-colors duration-500`}
        />

        <div className="relative w-full h-full overflow-hidden">
          {status !== 'standby' && (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                facingMode: 'user',
              }}
              className={`w-full h-full object-cover grayscale-[20%] contrast-[1.1] transition-all duration-700 ${status.includes('holding') || status.includes('scanning') ? 'scale-105 filter brightness-110' : 'scale-100'}`}
            />
          )}

          {/* Cyberpunk/Futuristic Face Tracking HUD Overlay */}
          <div
            ref={faceReticleRef}
            className={`absolute z-[60] transition-all duration-75 ease-linear flex flex-col items-center justify-center pointer-events-none ${['ready', 'ready_teacher', 'holding', 'scanning', 'holding_teacher', 'scanning_teacher'].includes(status) ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
            style={{
              boxShadow: `inset 0 0 30px ${themeColor}40`,
              backgroundColor: `${themeColor}10`
            }}
          >
            {/* Inner Crosshairs */}
            <div className={`absolute top-1/2 left-0 w-3 h-[1px] -translate-y-1/2 bg-current ${themeClass.split(' ')[0]} shadow-[0_0_5px_currentColor]`} />
            <div className={`absolute top-1/2 right-0 w-3 h-[1px] -translate-y-1/2 bg-current ${themeClass.split(' ')[0]} shadow-[0_0_5px_currentColor]`} />
            <div className={`absolute left-1/2 top-0 w-[1px] h-3 -translate-x-1/2 bg-current ${themeClass.split(' ')[0]} shadow-[0_0_5px_currentColor]`} />
            <div className={`absolute left-1/2 bottom-0 w-[1px] h-3 -translate-x-1/2 bg-current ${themeClass.split(' ')[0]} shadow-[0_0_5px_currentColor]`} />

            {/* Scanning Line Effect (Only during actual scanning) */}
            {status.includes('scanning') && (
              <div className={`absolute left-0 right-0 h-[2px] bg-current ${themeClass.split(' ')[0]} animate-scan-y shadow-[0_0_15px_currentColor]`} />
            )}

            {/* Corner Accents (Sci-Fi Style) */}
            <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-[3px] border-l-[3px] border-current ${themeClass.split(' ')[0]} shadow-[-2px_-2px_8px_currentColor]`} />
            <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-[3px] border-r-[3px] border-current ${themeClass.split(' ')[0]} shadow-[2px_-2px_8px_currentColor]`} />
            <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-[3px] border-l-[3px] border-current ${themeClass.split(' ')[0]} shadow-[-2px_2px_8px_currentColor]`} />
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-[3px] border-r-[3px] border-current ${themeClass.split(' ')[0]} shadow-[2px_2px_8px_currentColor]`} />

            {/* Tactical Data Overlays (Hidden on very small screens to avoid clutter) */}
            <div className={`absolute -right-16 top-1/2 -translate-y-1/2 text-[8px] font-mono leading-tight tracking-tighter ${themeClass.split(' ')[0]} opacity-80 hidden sm:block`}>
              <div className="flex items-center gap-1"><span className="w-1 h-1 bg-current rounded-full animate-pulse" /> DIST: 0.82m</div>
              <div className="flex items-center gap-1"><span className="w-1 h-1 bg-current rounded-full" /> CONF: 99.9%</div>
              <div className="flex items-center gap-1"><span className="w-1 h-1 bg-current rounded-full" /> REC: OK</div>
            </div>

            {/* Status Label */}
            {(status.includes('holding') || status.includes('scanning')) && (
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-black tracking-[0.2em] uppercase whitespace-nowrap bg-[#020617]/80 border border-current backdrop-blur-md shadow-[0_0_15px_currentColor] ${themeClass.split(' ')[0]}`}>
                {status.includes('scanning') ? 'IDENTIFICATION ....' : 'CIBLE ACQUISE'}
              </div>
            )}
          </div>

          {status === 'standby' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0f18]/90 backdrop-blur-xl overflow-hidden">
              {/* Animated Background Grids */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
              </div>

              {/* Radial Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00f0ff]/5 rounded-full blur-[120px]"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#00f0ff]/20 blur-2xl rounded-full animate-pulse"></div>
                  <div className="relative p-8 border-2 border-[#00f0ff]/30 rounded-full bg-black/40 backdrop-blur-md">
                    <Fingerprint size={80} className="text-[#00f0ff] animate-pulse" />
                  </div>
                </div>

                <h2 className="text-4xl font-black tracking-[0.3em] uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                  TERMINAL SÉCURISÉ
                </h2>

                <div className="flex items-center gap-4 px-6 py-2 bg-black/40 border border-[#00f0ff]/20 rounded-full backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-ping"></div>
                  <p className="tracking-[0.2em] text-xs font-bold text-[#00f0ff]/80 uppercase">
                    SYSTÈME PRÊT - EN ATTENTE DE SESSION
                  </p>
                </div>

                <div className="mt-12 flex gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={12} className="text-[#00ff9d]/50" />
                    SECURE-LINK: ACTIVE
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={12} className="text-[#00f0ff]/50" />
                    AUTONOMOUS-MODE: ON
                  </div>
                </div>
              </div>

              {/* Decorative HUD corners */}
              <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#00f0ff]/30"></div>
              <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#00f0ff]/30"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#00f0ff]/30"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#00f0ff]/30"></div>
            </div>
          )}

          {status === 'paused' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-yellow-500/80">
              <Activity size={80} className="mb-6 opacity-40" />
              <h2 className="text-3xl font-bold tracking-[0.2em] uppercase mb-3 text-yellow-500">
                SESSION EN PAUSE
              </h2>
              <p className="tracking-[0.1em] text-sm text-yellow-500/60">
                LE SCAN EST TEMPORAIREMENT SUSPENDU
              </p>
            </div>
          )}

          {/* ─── THE FLOATING SCANNING BAR (LOOPING) ─── */}
          {(status.includes('holding') || status.includes('scanning')) && (
            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
              <style>{`
                   @keyframes scanFloating {
                     0% { top: 0%; }
                     50% { top: 100%; }
                     100% { top: 0%; }
                   }
                   .animate-scan-floating {
                     animation: scanFloating 2.5s ease-in-out infinite;
                   }
                 `}</style>

              {/* Moving Laser Beam */}
              <div
                className={`absolute left-0 right-0 h-1.5 ${themeBgClass} shadow-[0_0_30px_CURRENTCOLOR,0_0_60px_CURRENTCOLOR] animate-scan-floating z-50`}
                style={{ color: themeColor }}
              />

              {/* Glowing Gradient Trail */}
              <div
                className="absolute left-0 right-0 h-40 opacity-20 animate-scan-floating"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${themeColor}, transparent)`,
                  marginTop: '-20px',
                }}
              />

            </div>
          )}

          {/* Holographic Overlays for Success/Error */}
          {!status.includes('ready') &&
            !status.includes('holding') &&
            !status.includes('scanning') &&
            status !== 'standby' &&
            status !== 'paused' &&
            !showPinPad && (
              <div className="absolute inset-0 z-40 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                <div
                  className={`w-full max-w-lg p-10 text-center border-y-2 bg-black/80 shadow-[0_0_40px_rgba(0,0,0,0.8)] ${status.includes('success')
                    ? 'border-[#00ff9d] text-[#00ff9d]'
                    : status === 'duplicate' || status === 'wrong_group'
                      ? 'border-[#ffb000] text-[#ffb000]'
                      : 'border-[#ff003c] text-[#ff003c]'
                    }`}
                >
                  <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl bg-current/10 border border-current animate-pulse">
                    {status.includes('success') ? (
                      <UserCheck size={40} className="text-current" />
                    ) : status === 'duplicate' ? (
                      <ShieldAlert size={40} className="text-current" />
                    ) : status === 'wrong_group' ? (
                      <UserX size={40} className="text-current" />
                    ) : status === 'liveness_failed' ? (
                      <ShieldAlert size={40} className="text-current" />
                    ) : (
                      <AlertTriangle size={40} className="text-current" />
                    )}
                  </div>
                  <h2 className="text-3xl font-black tracking-[0.1em] uppercase mb-3">
                    {result?.message}
                  </h2>
                  <p className="text-xl tracking-widest text-white mb-6">
                    {result?.name || 'ENTITÉ INCONNUE'}
                  </p>
                  {status === 'teacher_error' && (
                    <button
                      onClick={() => setShowPinPad(true)}
                      className="mt-4 px-6 py-3 bg-[#ffb000] text-black font-black rounded-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto uppercase text-sm tracking-tighter"
                    >
                      <Lock size={16} /> Utiliser Code PIN
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Prompt Overlays */}
          {(status === 'ready' || status === 'ready_teacher') && !showPinPad && (
            <div className="absolute inset-x-0 bottom-12 flex justify-center gap-6 z-30">
              <button
                onClick={() => setStatus(status === 'ready' ? 'holding' : 'holding_teacher')}
                className={`px-10 py-4 bg-black/80 backdrop-blur-md border ${themeClass} text-white font-bold tracking-widest text-lg uppercase flex items-center gap-4 hover:bg-black transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] active:scale-95`}
              >
                <ScanFace size={24} className={themeClass.split(' ')[0]} />
                {status === 'ready' ? 'SCAN ÉTUDIANT' : 'AUTHENTIFICATION REQUISE'}
              </button>

              {status === 'ready_teacher' && (
                <button
                  onClick={() => setShowPinPad(true)}
                  className="px-8 py-4 bg-black/80 backdrop-blur-md border border-[#ffb000] text-[#ffb000] font-bold tracking-widest text-lg uppercase flex items-center gap-4 hover:bg-black transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] active:scale-95"
                >
                  <Lock size={20} />
                  CODE PIN
                </button>
              )}
            </div>
          )}

          {/* Tech PIN Pad */}
          {showPinPad && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#020617] p-8 border border-[#ffb000] shadow-[0_0_30px_rgba(255,176,0,0.3)] max-w-sm w-full">
                <h3 className="text-[#ffb000] text-center font-bold text-lg tracking-widest mb-6 uppercase">
                  SAISIE CODE ENSEIGNANT
                </h3>

                <div className="flex justify-center gap-4 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${pinInput.length > i
                        ? 'bg-[#ffb000] border-[#ffb000] shadow-[0_0_10px_rgba(255,176,0,0.8)]'
                        : 'border-slate-700 bg-transparent'
                        }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
                    <button
                      key={key}
                      onClick={async () => {
                        if (key === 'C') setPinInput('');
                        else if (key === 'OK') {
                          if (!activeSession) return;
                          try {
                            const res = await fetch(
                              `${API}/api/sessions/${activeSession.id}/verify-pin`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pin_code: pinInput }),
                              }
                            );
                            const data = await res.json();
                            if (res.ok && data.status === 'success') {
                              setIsTeacherUnlocked(true);
                              setStatus('ready');
                              setResult({ message: 'CODE ACCEPTÉ' });
                              setTimeout(() => setResult(null), 3000);
                            } else {
                              setResult({ message: 'CODE INCORRECT' });
                              setStatus('teacher_error');
                              setTimeout(() => {
                                setResult(null);
                                setStatus('ready_teacher');
                              }, 3000);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                          setShowPinPad(false);
                          setPinInput('');
                        } else if (pinInput.length < 4) setPinInput(pinInput + key);
                      }}
                      className={`py-4 text-2xl font-mono border transition-all active:scale-95 ${key === 'OK'
                        ? 'bg-[#ffb000]/20 text-[#ffb000] border-[#ffb000] hover:bg-[#ffb000]/40'
                        : key === 'C'
                          ? 'bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/30'
                          : 'bg-slate-800/50 text-white border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                        }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowPinPad(false);
                    setPinInput('');
                  }}
                  className="mt-8 w-full py-3 text-slate-500 text-xs tracking-widest uppercase hover:text-white transition-colors"
                >
                  ANNULER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── HUD FOOTER ─── */}
      <div className="w-full max-w-5xl mt-6 px-4 flex items-center justify-between z-50">
        <div className="w-1/3">
          <p
            className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5 ${themeClass.split(' ')[0]} transition-colors duration-500`}
          >
            ÉTAT DU SCANNER
          </p>
          <div className="flex gap-1 h-1.5">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 transition-colors duration-300 ${i < progress / 5 ? themeBgClass : 'bg-slate-800'}`}
              />
            ))}
          </div>
        </div>

        <div className="w-1/3 text-center">
          {activeSession && (
            <div className="inline-block px-6 py-2 border border-slate-700 bg-black/50 text-white text-xs tracking-widest uppercase rounded">
              <span className={`${themeClass.split(' ')[0]} transition-colors duration-500`}>
                {activeSession.course_name}
              </span>{' '}
              | GRP {activeSession.group_name}
            </div>
          )}
        </div>

        <div className="w-1/3 text-right">
          <div className="flex flex-col items-end gap-1">
            <div className="relative p-[1px] bg-gradient-to-r from-cyan-500/50 via-emerald-500/50 to-cyan-500/50 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <div className="relative flex items-center gap-2 bg-[#0a0f18] border border-white/5 px-3 py-1.5 rounded-[7px]">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 border-l-2 border-emerald-500/50"></div>
                <Video size={12} className="text-[#00ff9d]" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-transparent text-[#00f0ff] text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer max-w-[180px] appearance-none"
                >
                  {videoDevices.map((device, i) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-[#0a0f18] text-white">
                      {device.label || `HARDWARE_DEV_${i + 1}`}
                    </option>
                  ))}
                </select>
                <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></div>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] tracking-[0.1em] uppercase leading-tight">
              MOTEUR IA: V2.4 | LATENCE: 12MS
              <br />
              {activeSession ? `PROF: ${activeSession.teacher_name}` : 'SYSTÈME EN VEILLE'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
