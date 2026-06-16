import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, ShoppingBag, Loader2, Camera, Upload } from 'lucide-react';
import { Product } from '../types';

// ─── Dynamic Three.js loader (CDN) ──────────────────────────────────────────
const loadThreeJS = async () => {
  if (!(window as any).THREE) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  if (!(window as any).THREE.GLTFLoader) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  if (!(window as any).THREE.DRACOLoader) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js';
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
};

// ─── Static 3-D canvas overlay ───────────────────────────────────────────────
// Renders the GLB model once, centered, transparent background.
const Static3DCanvas = ({ modelUrl }: { modelUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const init = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await loadThreeJS();
    } catch {
      setStatus('error');
      return;
    }
    if (!canvas.isConnected) return;

    const THREE = (window as any).THREE;
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 480;

    // Scene + perspective camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 0, 2.5);
    camera.lookAt(0, 0, 0);

    // Renderer with transparent bg
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(1, 2, 3);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-1, -1, -2);
    scene.add(dir2);

    // Load the GLB model
    const loader = new THREE.GLTFLoader();
    if (THREE.DRACOLoader) {
      const draco = new THREE.DRACOLoader();
      draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
      loader.setDRACOLoader(draco);
    }

    const onLoad = (gltf: any) => {
      if (!canvas.isConnected) return;
      const model = gltf.scene;

      // Center geometry
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);

      // Normalize to 1 unit
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(1 / maxDim);

      scene.add(model);

      // Render once — static
      renderer.render(scene, camera);
      setStatus('ready');
    };

    const onError = (err: any) => {
      console.error('Error cargando modelo 3D:', err);
      setStatus('error');
    };

    if (modelUrl.startsWith('data:')) {
      try {
        const base64 = modelUrl.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        loader.parse(bytes.buffer, '', onLoad, onError);
      } catch (e) {
        onError(e);
      }
    } else {
      loader.load(modelUrl, onLoad, undefined, onError);
    }
  }, [modelUrl]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ opacity: status === 'ready' ? 1 : 0, transition: 'opacity 0.4s ease' }}
      />
    </div>
  );
};

// ─── SVG fallback (no model_3d) ───────────────────────────────────────────────
const GlassesSVGFallback = ({ product }: { product: Product }) => {
  const n = product.name.toLowerCase();
  const b = product.brand.toLowerCase();

  let styleType = 'classic';
  if (n.includes('multigressiv')) styleType = 'rimless';
  else if (n.includes('colormatic')) styleType = 'photochromic';
  else if (n.includes('elegance')) styleType = 'rayban';
  else if (n.includes('sport') || b.includes('oakley')) styleType = 'sport';

  const color = '#1a1a1a';

  if (styleType === 'rimless') {
    return (
      <svg viewBox="0 0 200 60" className="w-full h-auto" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 28 20 H 80 C 83 20 85 45 77 45 H 33 C 25 45 28 20 28 20 Z" className="fill-cyan-500/10 stroke-cyan-400/20" strokeWidth="1.5" />
        <path d="M 120 20 H 172 C 175 20 172 45 167 45 H 123 C 115 45 120 20 120 20 Z" className="fill-cyan-500/10 stroke-cyan-400/20" strokeWidth="1.5" />
        <path d="M 80 26 Q 100 18 120 26" stroke={color} strokeWidth="3.5" />
        <path d="M 28 24 L 5 21" stroke={color} strokeWidth="2.5" />
        <path d="M 172 24 L 195 21" stroke={color} strokeWidth="2.5" />
      </svg>
    );
  }
  if (styleType === 'rayban') {
    return (
      <svg viewBox="0 0 200 60" className="w-full h-auto" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="23" y="15" width="64" height="34" rx="8" stroke={color} strokeWidth="3.5" />
        <rect x="113" y="15" width="64" height="34" rx="8" stroke={color} strokeWidth="3.5" />
        <path d="M 87 22 Q 100 13 113 22" stroke={color} strokeWidth="4.5" />
        <path d="M 23 20 L 5 18" stroke={color} strokeWidth="3" />
        <path d="M 177 20 L 195 18" stroke={color} strokeWidth="3" />
      </svg>
    );
  }
  if (styleType === 'sport') {
    return (
      <svg viewBox="0 0 200 60" className="w-full h-auto" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 15 18 L 85 18 Q 100 23 115 18 L 185 18 Q 192 26 175 42 L 148 44 Q 133 32 100 32 Q 67 32 52 44 L 25 42 Q 8 26 15 18 Z" stroke={color} strokeWidth="5.5" />
        <path d="M 15 18 L 3 24" stroke={color} strokeWidth="4.5" />
        <path d="M 185 18 L 197 24" stroke={color} strokeWidth="4.5" />
      </svg>
    );
  }
  // classic / photochromic fallback
  return (
    <svg viewBox="0 0 200 65" className="w-full h-auto" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 23 16 H 86 C 86 16 88 48 55 48 H 36 C 14 48 23 16 23 16 Z" stroke={color} strokeWidth="6" />
      <path d="M 114 16 H 177 C 177 16 186 48 164 48 H 145 C 112 48 114 16 114 16 Z" stroke={color} strokeWidth="6" />
      <path d="M 86 21 Q 100 13 114 21" stroke={color} strokeWidth="6" />
      <path d="M 23 18 L 10 16" stroke={color} strokeWidth="4.5" />
      <path d="M 177 18 L 190 16" stroke={color} strokeWidth="4.5" />
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const VirtualTryOnModal = ({ product, onClose }: { product: Product; onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(true);
  const [captureMode, setCaptureMode] = useState<'live' | 'photo'>('live');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // ── Camera init ──────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    let localStream: MediaStream | null = null;

    (async () => {
      setLoadingCamera(true);
      setError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!active) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        localStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setLoadingCamera(false);
      } catch (err: any) {
        if (active) {
          setError(`[Error Cámara] [${err?.name || 'Error'}]: ${err?.message || 'Da permisos de cámara.'}`);
          setLoadingCamera(false);
        }
      }
    })();

    return () => {
      active = false;
      localStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // ── Photo capture / upload ───────────────────────────────────────────────
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setImageSrc(canvas.toDataURL('image/jpeg'));
    setCaptureMode('photo');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImageSrc(ev.target?.result as string);
      setCaptureMode('photo');
    };
    reader.readAsDataURL(file);
  };

  const hasModel = !!product.model_3d;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink/90 md:backdrop-blur-xl flex items-center justify-center md:p-4"
    >
      <div className="relative w-full h-full md:h-[620px] md:max-w-4xl bg-paper md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row">

        {/* ── Camera / Photo area ────────────────────────────────────────── */}
        <div
          style={{ height: '60%', minHeight: '60%' }}
          className="w-full md:!h-auto md:!min-h-0 md:flex-[1.5] bg-black relative overflow-hidden flex items-center justify-center flex-shrink-0"
        >
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 md:hidden p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Loading spinner */}
          {loadingCamera && (
            <div className="text-white text-center p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-accent" />
              <p className="font-serif text-lg text-white">Iniciando cámara...</p>
            </div>
          )}

          {/* Camera error */}
          {error && !loadingCamera && (
            <div className="text-white text-center p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50 text-red-500" />
              <p className="font-serif text-xl max-w-md mx-auto text-white">{error}</p>
              <button
                onClick={onClose}
                className="mt-6 bg-accent/20 border border-accent text-accent px-6 py-2 rounded-full hover:bg-accent hover:text-white transition-all text-sm font-semibold"
              >
                Cerrar y volver
              </button>
            </div>
          )}

          {/* Live view */}
          {!loadingCamera && !error && (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {/* Mirrored background layer (camera or photo) */}
              <div className="absolute inset-0 scale-x-[-1]">
                {captureMode === 'live' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={imageSrc!}
                    alt="Captura"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* ── 3D Model overlay — centered, static ──────────────────── */}
              {hasModel ? (
                <Static3DCanvas modelUrl={product.model_3d!} />
              ) : (
                /* SVG fallback centered */
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-[60%] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <GlassesSVGFallback product={product} />
                  </div>
                </div>
              )}

              {/* Source selector (En vivo / Foto / Subir) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className="flex gap-2 bg-black/50 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                  <button
                    onClick={() => { setCaptureMode('live'); setImageSrc(null); }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${captureMode === 'live' ? 'bg-white text-ink' : 'text-white/70 hover:text-white'}`}
                  >
                    En vivo
                  </button>
                  <button
                    onClick={handleTakePhoto}
                    className="text-white/70 hover:text-white px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Camera className="w-3 h-3" /> Foto
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all ${captureMode === 'photo' && imageSrc ? 'bg-white text-ink' : 'text-white/70 hover:text-white'}`}
                  >
                    <Upload className="w-3 h-3" /> Subir
                  </button>
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </div>
          )}
        </div>

        {/* ── Product info column ────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 w-full md:w-80 p-5 md:p-8 flex flex-col justify-between bg-paper border-t md:border-t-0 md:border-l border-ink/5 overflow-y-auto">
          <div>
            <div className="flex justify-between items-start mb-3 md:mb-6">
              <div>
                <span className="text-accent uppercase tracking-widest text-[10px] font-bold">{product.brand}</span>
                <h3 className="text-xl md:text-2xl font-serif leading-tight mt-1">{product.name}</h3>
              </div>
              <button onClick={onClose} className="hover:rotate-90 transition-transform p-1 rounded-full hover:bg-ink/5">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-ink/65 text-[11px] md:text-xs mb-3 md:mb-6 leading-relaxed">
              {hasModel
                ? 'El probador virtual muestra el modelo 3D de los lentes centrado sobre la imagen de la cámara.'
                : 'El probador virtual usa un modelo vectorial para mostrar cómo quedarían los lentes sobre tu rostro.'}
            </p>

            <div className="space-y-3 text-xs text-ink/70">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <span>Cámara activa</span>
              </div>
              {hasModel && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  <span>Modelo 3D cargado desde Supabase</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-8 space-y-3">
            <p className="text-xl md:text-2xl font-serif text-accent">
              ${product.price.toLocaleString('es-CL')}
            </p>
            <button className="w-full bg-ink text-white py-3.5 md:py-4 rounded-2xl font-bold hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4" /> Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
