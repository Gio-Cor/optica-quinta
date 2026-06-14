import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Maximize2, ShoppingBag, Loader2, Camera, Upload } from 'lucide-react';
import { Product } from '../types';

// Dynamic script loader for ThreeJS & GLTFLoader
const loadThreeJS = async () => {
  if (!(window as any).THREE) {
    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    document.head.appendChild(threeScript);
    await new Promise(resolve => threeScript.onload = resolve);
  }
  if (!(window as any).THREE.GLTFLoader) {
    const loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js';
    document.head.appendChild(loaderScript);
    await new Promise(resolve => loaderScript.onload = resolve);
  }
};

export const VirtualTryOnModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [faceLandmarker, setFaceLandmarker] = useState<any>(null);
  const [scaleAdjustment, setScaleAdjustment] = useState(1.95);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureMode, setCaptureMode] = useState<'live' | 'photo'>('live');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const staticImageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cachedResultsRef = useRef<any>(null);
  
  // Handlers for taking and uploading photos
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setImageSrc(canvas.toDataURL('image/jpeg'));
      setCaptureMode('photo');
      cachedResultsRef.current = null; // reset cache
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setCaptureMode('photo');
        cachedResultsRef.current = null; // reset cache
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 1. Determine frame style type based on the specific catalog product
  const getStyleType = () => {
    const n = product.name.toLowerCase();
    const b = product.brand.toLowerCase();
    if (n.includes('multigressiv')) {
      return 'rimless';
    }
    if (n.includes('colormatic')) {
      return 'photochromic';
    }
    if (n.includes('elegance')) {
      return 'rayban';
    }
    if (n.includes('sport') || n.includes('oakley')) {
      return 'sport';
    }
    return 'classic';
  };

  const styleType = getStyleType();

  // 2. Define beautiful premium color options based on specific catalog designs
  const colorOptions = styleType === 'rimless'
    ? [
        { name: 'Oro Fino', hex: '#D4AF37' },
        { name: 'Platino', hex: '#E5E4E2' },
        { name: 'Oro Rosa', hex: '#B76E79' },
        { name: 'Negro Fino', hex: '#262626' }
      ]
    : styleType === 'photochromic'
    ? [
        { name: 'Habana Carey', hex: '#8A4A1C' },
        { name: 'Negro Mate', hex: '#262626' },
        { name: 'Oro de 18K', hex: '#D4AF37' }
      ]
    : styleType === 'rayban'
    ? [
        { name: 'Negro Titanio', hex: '#1a1a1a' },
        { name: 'Plata Satinado', hex: '#94A3B8' },
        { name: 'Azul Acero', hex: '#334155' }
      ]
    : styleType === 'sport'
    ? [
        { name: 'Carbón Mate', hex: '#374151' },
        { name: 'Rojo Fuego', hex: '#DC2626' },
        { name: 'Azul Eléctrico', hex: '#2563EB' }
      ]
    : [
        { name: 'Negro', hex: '#1a1a1a' },
        { name: 'Habana', hex: '#8A4A1C' },
        { name: 'Azul Noche', hex: '#1E293B' }
      ];

  const [frameColor, setFrameColor] = useState(colorOptions[0]);
  const [useVectorModel, setUseVectorModel] = useState(!product.model_3d);

  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(-90);
  const [rotationZ, setRotationZ] = useState(180);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [extraScale, setExtraScale] = useState(1.0);

  const rotationXRef = useRef(0);
  const rotationYRef = useRef(-90);
  const rotationZRef = useRef(180);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const extraScaleRef = useRef(1.0);

  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeSceneRef = useRef<any>(null);
  const threeCameraRef = useRef<any>(null);
  const threeRendererRef = useRef<any>(null);
  const glassesModelRef = useRef<any>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);

  const initThree = async (canvas: HTMLCanvasElement) => {
    if (!product.model_3d) return;

    await loadThreeJS();
    if (!canvas.isConnected) return;

    const THREE = (window as any).THREE;
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 480;

    // Create Scene
    const scene = new THREE.Scene();
    threeSceneRef.current = scene;

    // Create Orthographic Camera (pixels mapping)
    const camera = new THREE.OrthographicCamera(0, width, 0, height, -1000, 1000);
    threeCameraRef.current = camera;

    // Create WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRendererRef.current = renderer;

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(0, 1, 1).normalize();
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(0, -1, -1).normalize();
    scene.add(dirLight2);

    // Load Model
    const loader = new THREE.GLTFLoader();
    loader.load(
      product.model_3d,
      (gltf: any) => {
        if (!canvas.isConnected) return;
        const model = gltf.scene;

        // Auto center the geometry
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center);

        // Apply initial rotation offsets from refs
        model.rotation.x = (rotationXRef.current * Math.PI) / 180;
        model.rotation.y = (rotationYRef.current * Math.PI) / 180;
        model.rotation.z = (rotationZRef.current * Math.PI) / 180;

        // Wrap model in parent group for precise manipulation
        const group = new THREE.Group();
        group.add(model);

        scene.add(group);
        glassesModelRef.current = group;
        setThreeLoaded(true);

        // Render once to test
        renderer.render(scene, camera);
      },
      undefined,
      (err: any) => console.error("Error loading GLB model in VirtualTryOnModal:", err)
    );
  };

  const threeCanvasCallbackRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      if (threeRendererRef.current) {
        threeRendererRef.current.dispose();
        threeRendererRef.current = null;
      }
      glassesModelRef.current = null;
      threeSceneRef.current = null;
      threeCameraRef.current = null;
      threeCanvasRef.current = null;
      return;
    }

    threeCanvasRef.current = canvas;
    initThree(canvas);
  }, [product.model_3d]);

  // Resize handler using useEffect
  useEffect(() => {
    const handleResize = () => {
      if (!threeCanvasRef.current || !threeRendererRef.current || !threeCameraRef.current) return;
      const w = threeCanvasRef.current.clientWidth;
      const h = threeCanvasRef.current.clientHeight;
      threeRendererRef.current.setSize(w, h);
      
      threeCameraRef.current.left = 0;
      threeCameraRef.current.right = w;
      threeCameraRef.current.top = 0;
      threeCameraRef.current.bottom = h;
      threeCameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [glassesTransform, setGlassesTransform] = useState<{
    left: number;
    top: number;
    width: number;
    rotate: number;
    visible: boolean;
  }>({ left: 50, top: 42, width: 43, rotate: 0, visible: true });

  // Initialize MediaPipe and Camera
  useEffect(() => {
    let active = true;
    let landmarkerInstance: any = null;
    let localStream: MediaStream | null = null;

    async function initAR() {
      setLoadingModel(true);
      setError(null);

      // 1. Load MediaPipe Model
      try {
        // Dynamic import of Google MediaPipe Tasks-Vision ESM from CDN
        const visionModule = await import(
          /* @vite-ignore */
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs"
        );
        
        if (!active) return;

        const { FilesetResolver, FaceLandmarker } = visionModule;

        // Resolve WASM assets
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );

        if (!active) return;

        // Create the Landmarker instance using the official lightweight face model
        landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });

        if (!active) return;
        setFaceLandmarker(landmarkerInstance);
      } catch (modelErr: any) {
        console.error("Error loading MediaPipe model:", modelErr);
        if (active) {
          setError(`[Error IA] No se pudo descargar el modelo: ${modelErr?.name || 'Error'}: ${modelErr?.message || modelErr}`);
          setLoadingModel(false);
        }
        return;
      }

      // 2. Start Camera Feed
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        
        if (!active) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        localStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setLoadingModel(false);
      } catch (camErr: any) {
        console.error("Error accessing camera:", camErr);
        if (active) {
          setError(`[Error Cámara] [${camErr?.name || 'Error'}]: ${camErr?.message || 'Asegúrate de dar permisos de cámara en Safari.'}`);
          setLoadingModel(false);
        }
      }
    }

    initAR();

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Play camera stream as soon as video element is mounted and stream is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.play().catch(e => console.error("Error playing video:", e));
    }
  }, [stream]);

  // Frame processing loop for Face Tracking
  useEffect(() => {
    if (!faceLandmarker || !stream || !videoRef.current) return;

    let active = true;
    let lastVideoTime = -1;
    let animationFrameId: number;

    function predictLoop() {
      if (!active) return;

      try {
        let results: any = null;

        if (captureMode === 'live') {
          const video = videoRef.current;
          if (video && video.readyState >= 3) {
            const currentTime = video.currentTime;
            if (currentTime !== lastVideoTime) {
              lastVideoTime = currentTime;
              results = faceLandmarker.detectForVideo(video, performance.now());
            }
          }
        } else if (captureMode === 'photo' && staticImageRef.current) {
          if (!cachedResultsRef.current) {
            // Only detect once per image to save CPU
            cachedResultsRef.current = faceLandmarker.detect(staticImageRef.current);
          }
          results = cachedResultsRef.current;
        }

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const leftEye = landmarks[33];
              const rightEye = landmarks[263];
              
              if (leftEye && rightEye) {
                const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
                setFaceDetected(true);
                if (!useVectorModel && glassesModelRef.current && threeCanvasRef.current) {
                  // --- 3D GLB Face Overlay Tracking ---
                  const width = threeCanvasRef.current.clientWidth;
                  const height = threeCanvasRef.current.clientHeight;

                  // Center coordinates + manual offset
                  const midX = ((leftEye.x + rightEye.x) / 2) * width;
                  const midY = height - (((leftEye.y + rightEye.y) / 2) * height);
                  
                  glassesModelRef.current.position.set(
                    midX + offsetXRef.current, 
                    midY + offsetYRef.current, 
                    0
                  );

                  // Update inner model rotation using the sliders
                  const innerModel = glassesModelRef.current.children[0];
                  if (innerModel) {
                    innerModel.rotation.x = (rotationXRef.current * Math.PI) / 180;
                    innerModel.rotation.y = (rotationYRef.current * Math.PI) / 180;
                    innerModel.rotation.z = (rotationZRef.current * Math.PI) / 180;
                  }

                  // Calculate tracking rotation angle (Roll)
                  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
                  glassesModelRef.current.rotation.z = -roll;

                  // Estimate tracking Yaw (rotation around Y axis)
                  const noseTip = landmarks[1];
                  if (noseTip) {
                    const midEyeX = (leftEye.x + rightEye.x) / 2;
                    const yaw = ((noseTip.x - midEyeX) / eyeDistance) * 0.8;
                    glassesModelRef.current.rotation.y = yaw;
                  }

                  // Estimate tracking Pitch (rotation around X axis)
                  const forehead = landmarks[10];
                  const chin = landmarks[152];
                  if (noseTip && forehead && chin) {
                    const midEyeY = (leftEye.y + rightEye.y) / 2;
                    const faceHeight = Math.abs(chin.y - forehead.y);
                    const pitch = ((noseTip.y - midEyeY) / faceHeight) * 1.5;
                    // Standard pitch offset so glasses sit straight
                    glassesModelRef.current.rotation.x = pitch - 0.15;
                  }

                  // Scale based on eye distance * manual scale adjustment
                  const scaleVal = eyeDistance * width * 1.7 * (scaleAdjustment / 1.95) * extraScaleRef.current;
                  glassesModelRef.current.scale.set(scaleVal, scaleVal, scaleVal);

                  // Render ThreeJS Scene
                  if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
                    threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
                  }

                  // Hide 2D layout overlay
                  setGlassesTransform({
                    left: 50,
                    top: 42,
                    width: 0,
                    rotate: 0,
                    visible: false
                  });
                } else {
                  // --- 2D / SVG Overlay Tracking ---
                  // Hide 3D model if it exists
                  if (glassesModelRef.current) {
                    glassesModelRef.current.position.set(-1000, -1000, 0);
                    if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
                      threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
                    }
                  }

                  setGlassesTransform({
                    left: 50,
                    top: 42,
                    width: eyeDistance * scaleAdjustment * 100,
                    rotate: 0,
                    visible: true
                  });
                }
              } else {
                // Hide both overlays
                if (glassesModelRef.current) {
                  glassesModelRef.current.position.set(-1000, -1000, 0);
                  if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
                    threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
                  }
                }
                setGlassesTransform(prev => ({ ...prev, visible: false }));
                setFaceDetected(false);
              }
            } else {
              if (glassesModelRef.current) {
                glassesModelRef.current.position.set(-1000, -1000, 0);
                if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
                  threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
                }
              }
              setGlassesTransform(prev => ({ ...prev, visible: false }));
              setFaceDetected(false);
            }
          } else {
            if (glassesModelRef.current) {
              glassesModelRef.current.position.set(-1000, -1000, 0);
              if (threeRendererRef.current && threeSceneRef.current && threeCameraRef.current) {
                threeRendererRef.current.render(threeSceneRef.current, threeCameraRef.current);
              }
            }
            setGlassesTransform(prev => ({ ...prev, visible: false }));
            setFaceDetected(false);
          }
      } catch (e) {
        console.error("Frame tracking error:", e);
      }
      
      animationFrameId = requestAnimationFrame(predictLoop);
    }

    predictLoop();

    return () => {
      active = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [faceLandmarker, stream, scaleAdjustment, captureMode]);

  // Helper to render beautiful, 100% transparent vector glasses matching the product style
  const renderGlassesSVG = () => {
    if (product.ar_image && !useVectorModel) {
      return (
        <img 
          src={product.ar_image} 
          alt={product.name} 
          className="w-full h-auto select-none pointer-events-none transition-all duration-300"
          style={{
            transform: 'scale(1.05)',
            mixBlendMode: 'multiply',
            filter: 'contrast(1.6) brightness(1.2) saturate(1.1)',
            opacity: 0.95 // Excellent frame presence with maximum lens transparency
          }}
        />
      );
    }

    if (styleType === 'rimless') {
      // 1. Premium Rimless / Rodenstock Multigressiv style
      return (
        <svg viewBox="0 0 200 60" className="w-full h-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]" fill="none" stroke={frameColor.hex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Lenses with a very soft, elegant semi-transparent blue/purple AR coating reflection */}
          <path d="M 28 20 H 80 C 83 20 85 45 77 45 H 33 C 25 45 28 20 28 20 Z" className="fill-cyan-500/10 stroke-cyan-400/20" strokeWidth="1.5" />
          <path d="M 120 20 H 172 C 175 20 172 45 167 45 H 123 C 115 45 120 20 120 20 Z" className="fill-cyan-500/10 stroke-cyan-400/20" strokeWidth="1.5" />
          
          {/* Subtle rimless lens cut highlights */}
          <path d="M 33 22 Q 55 18 75 22" stroke="white" strokeWidth="1" className="opacity-70" />
          <path d="M 125 22 Q 145 18 165 22" stroke="white" strokeWidth="1" className="opacity-70" />
          
          {/* Minimalist nose bridge */}
          <path d="M 80 26 Q 100 18 120 26" stroke={frameColor.hex} strokeWidth="3.5" />
          
          {/* Elegant metallic temples */}
          <path d="M 28 24 L 5 21" stroke={frameColor.hex} strokeWidth="2.5" />
          <path d="M 172 24 L 195 21" stroke={frameColor.hex} strokeWidth="2.5" />
          
          {/* Premium gold/silver mount screws */}
          <circle cx="32" cy="24" r="1.5" fill={frameColor.hex} stroke="none" />
          <circle cx="76" cy="24" r="1.5" fill={frameColor.hex} stroke="none" />
          <circle cx="124" cy="24" r="1.5" fill={frameColor.hex} stroke="none" />
          <circle cx="168" cy="24" r="1.5" fill={frameColor.hex} stroke="none" />
        </svg>
      );
    } else if (styleType === 'photochromic') {
      // 2. High-end Clubmaster Acetate / Rodenstock ColorMatic Transition style
      return (
        <svg viewBox="0 0 200 60" className="w-full h-auto drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)]" fill="none" stroke={frameColor.hex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Photochromic Transition Lenses (amber/grey/purple phototransition gradient) */}
          <path d="M 25 18 H 85 Q 85 46 55 46 H 33 Q 25 46 25 18 Z" className="fill-amber-900/25 stroke-amber-600/15" strokeWidth="1.5" />
          <path d="M 115 18 H 175 Q 175 46 145 46 H 123 Q 115 46 115 18 Z" className="fill-amber-900/25 stroke-amber-600/15" strokeWidth="1.5" />
          
          {/* Fine gold lower rim */}
          <path d="M 25 22 C 25 48 85 48 85 22" stroke="#E5C158" strokeWidth="2" />
          <path d="M 115 22 C 115 48 175 48 175 22" stroke="#E5C158" strokeWidth="2" />
          
          {/* Thick browbar (acetate) */}
          <path d="M 20 16 H 88 C 88 16 88 23 80 23 H 28 C 20 23 20 16 20 16 Z" fill={frameColor.hex} stroke="none" />
          <path d="M 112 16 H 180 C 180 16 180 23 172 23 H 120 C 112 23 112 16 112 16 Z" fill={frameColor.hex} stroke="none" />
          
          {/* Bridge (Gold metal) */}
          <path d="M 88 20 Q 100 12 112 20" stroke="#E5C158" strokeWidth="4.5" />
          
          {/* Shiny rivets on browbar */}
          <circle cx="26" cy="19" r="1.2" fill="#E5C158" stroke="none" />
          <circle cx="174" cy="19" r="1.2" fill="#E5C158" stroke="none" />
          
          {/* Temples */}
          <path d="M 20 19 L 5 17" stroke={frameColor.hex} strokeWidth="4" />
          <path d="M 180 19 L 195 17" stroke={frameColor.hex} strokeWidth="4" />
        </svg>
      );
    } else if (styleType === 'rayban') {
      // 3. Rectangular Fine Titanium / Ray-Ban Armazón Elegance
      return (
        <svg viewBox="0 0 200 60" className="w-full h-auto drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]" fill="none" stroke={frameColor.hex} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Clear Lenses with subtle reflection */}
          <rect x="25" y="17" width="60" height="30" rx="6" className="fill-slate-400/5 stroke-none" />
          <rect x="115" y="17" width="60" height="30" rx="6" className="fill-slate-400/5 stroke-none" />
          <path d="M 30 20 Q 55 17 80 20" stroke="white" strokeWidth="1" className="opacity-60" />
          <path d="M 120 20 Q 145 17 170 20" stroke="white" strokeWidth="1" className="opacity-60" />

          {/* Thin, elegant rectangular titanium-black rims */}
          <rect x="23" y="15" width="64" height="34" rx="8" stroke={frameColor.hex} strokeWidth="3.5" />
          <rect x="113" y="15" width="64" height="34" rx="8" stroke={frameColor.hex} strokeWidth="3.5" />
          
          {/* High-quality nose bridge */}
          <path d="M 87 22 Q 100 13 113 22" stroke={frameColor.hex} strokeWidth="4.5" />
          
          {/* Tiny premium silver rivets */}
          <circle cx="28" cy="20" r="1.2" fill="#E5E4E2" stroke="none" />
          <circle cx="172" cy="20" r="1.2" fill="#E5E4E2" stroke="none" />

          {/* Temples */}
          <path d="M 23 20 L 5 18" stroke={frameColor.hex} strokeWidth="3" />
          <path d="M 177 20 L 195 18" stroke={frameColor.hex} strokeWidth="3" />
        </svg>
      );
    } else if (styleType === 'sport') {
      // 4. Aerodynamic Sporty Curved Wrap / Oakley Armazón Sport Pro
      return (
        <svg viewBox="0 0 200 60" className="w-full h-auto drop-shadow-[0_10px_16px_rgba(0,0,0,0.6)]" fill="none" stroke={frameColor.hex} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {/* Reflective Orange/Blue sport lens coating */}
          <path d="M 15 18 L 85 18 Q 100 23 115 18 L 185 18 Q 192 26 175 42 L 148 44 Q 133 32 100 32 Q 67 32 52 44 L 25 42 Q 8 26 15 18 Z" className="fill-orange-500/20 stroke-orange-400/20" strokeWidth="1" />
          <path d="M 30 20 Q 55 24 80 20" stroke="white" strokeWidth="1" className="opacity-70" />
          <path d="M 120 20 Q 145 24 170 20" stroke="white" strokeWidth="1" className="opacity-70" />
          
          {/* Thick sporty wrap frame */}
          <path d="M 15 18 L 85 18 Q 100 23 115 18 L 185 18 Q 192 26 175 42 L 148 44 Q 133 32 100 32 Q 67 32 52 44 L 25 42 Q 8 26 15 18 Z" stroke={frameColor.hex} strokeWidth="5.5" />
          
          {/* Nose grips */}
          <path d="M 90 32 L 95 38" stroke={frameColor.hex} strokeWidth="3.5" />
          <path d="M 110 32 L 105 38" stroke={frameColor.hex} strokeWidth="3.5" />

          {/* Aggressive Oakley-style hinges */}
          <path d="M 15 18 L 3 24" stroke={frameColor.hex} strokeWidth="4.5" />
          <path d="M 185 18 L 197 24" stroke={frameColor.hex} strokeWidth="4.5" />
        </svg>
      );
    } else {
      // 5. Classic Elegant Wayfarer (Fallback)
      return (
        <svg viewBox="0 0 200 65" className="w-full h-auto drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" fill="none" stroke={frameColor.hex} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 26 19 H 84 Q 84 45 55 45 H 36 Q 26 45 26 19 Z" className="fill-accent/8 stroke-none" />
          <path d="M 116 19 H 174 Q 174 45 145 45 H 126 Q 116 45 116 19 Z" className="fill-accent/8 stroke-none" />
          
          <path d="M 23 16 H 86 C 86 16 88 48 55 48 H 36 C 14 48 23 16 23 16 Z" stroke={frameColor.hex} strokeWidth="6" />
          <path d="M 114 16 H 177 C 177 16 186 48 164 48 H 145 C 112 48 114 16 114 16 Z" stroke={frameColor.hex} strokeWidth="6" />
          
          <path d="M 86 21 Q 100 13 114 21" stroke={frameColor.hex} strokeWidth="6" />
          
          <ellipse cx="29" cy="22" rx="2.5" ry="1.5" className="fill-accent text-accent" strokeWidth="0" />
          <ellipse cx="171" cy="22" rx="2.5" ry="1.5" className="fill-accent text-accent" strokeWidth="0" />
          
          <path d="M 23 18 L 10 16" stroke={frameColor.hex} strokeWidth="4.5" />
          <path d="M 177 18 L 190 16" stroke={frameColor.hex} strokeWidth="4.5" />
        </svg>
      );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink/90 md:backdrop-blur-xl flex items-center justify-center md:p-4"
    >
      <div className="relative w-full h-full md:h-[620px] md:max-w-4xl bg-paper md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row md:max-h-none">
        {/* Camera Feed Area */}
        <div 
          style={{ height: '60%', minHeight: '60%' }}
          className="w-full md:!h-auto md:!min-h-0 md:flex-[1.5] bg-black relative overflow-hidden flex items-center justify-center flex-shrink-0"
        >
          {/* Floating Close Button for Mobile */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 md:hidden p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          {loadingModel && (
            <div className="text-white text-center p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-accent" />
              <p className="font-serif text-lg text-white">Iniciando Probador Virtual...</p>
              <p className="text-xs text-white/50 max-w-[250px]">Cargando módulo de inteligencia artificial de Google MediaPipe</p>
            </div>
          )}

          {error && !loadingModel && (
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
          
          {!loadingModel && !error && (
            <>
              {/* Unified Mirrored Layer Container */}
              <div className="absolute inset-0 w-full h-full scale-x-[-1] overflow-hidden pointer-events-none">
                {/* Camera or Image View */}
                {captureMode === 'live' ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    webkitPlaysInline={true}
                    muted 
                    className="w-full h-full object-cover pointer-events-auto"
                  />
                ) : (
                  <img
                    ref={staticImageRef}
                    src={imageSrc!}
                    alt="Captured"
                    className="w-full h-full object-cover pointer-events-auto"
                  />
                )}

                {/* Live 3D Overlay Canvas */}
                {product.model_3d && (
                  <canvas 
                    ref={threeCanvasCallbackRef} 
                    style={{ display: useVectorModel ? 'none' : 'block' }}
                    className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  />
                )}

                {/* Dynamic AR Glasses Overlay (Using standard div to prevent Framer Motion from stripping the centering translation) */}
                {glassesTransform.visible && (
                  <div 
                    className="absolute pointer-events-none transition-all duration-75"
                    style={{
                      left: `${glassesTransform.left}%`,
                      top: `${glassesTransform.top}%`,
                      width: `${glassesTransform.width}%`,
                      transform: `translate(-50%, -50%) rotate(${glassesTransform.rotate}deg)`,
                      zIndex: 10
                    }}
                  >
                    {renderGlassesSVG()}
                  </div>
                )}
              </div>
              
              {/* Target Face Guide Overlay (Only shown when face is NOT detected) */}
              {!faceDetected && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-60 h-76 border-2 border-dashed border-white/20 rounded-[100px] flex items-center justify-center flex-col gap-2 bg-black/10 backdrop-blur-[0.5px]">
                    <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-semibold">Alinea tu rostro</p>
                    <p className="text-[8px] text-white/40 max-w-[120px] text-center leading-normal">Ubícate frente a los lentes para probarlos</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Product Information & Adjustments Column */}
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
              El probador virtual usa inteligencia artificial y un modelo digital vectorial transparente para garantizar máxima claridad y fluidez sin tapar tu rostro.
            </p>
            
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-3 text-xs text-ink/80">
                <div className={`w-2 h-2 rounded-full ${glassesTransform.visible ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
                <span>{glassesTransform.visible ? 'Rostro detectado' : 'Buscando rostro...'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink/80">
                <Maximize2 className="w-4 h-4 opacity-40" />
                <span>Detección MediaPipe activa</span>
              </div>

              {/* Source Selector (Camera / Photo) */}
              {!loadingModel && !error && (
                <div className="pt-3 md:pt-4 border-t border-ink/5">
                  <span className="text-[11px] text-ink/60 font-semibold block mb-2">Fuente de Imagen</span>
                  <div className="grid grid-cols-3 gap-2 bg-ink/5 p-1 rounded-xl">
                    <button
                      onClick={() => setCaptureMode('live')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${captureMode === 'live' ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'}`}
                    >
                      En vivo
                    </button>
                    <button
                      onClick={handleTakePhoto}
                      className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all text-ink/60 hover:text-ink`}
                    >
                      <Camera className="w-3 h-3" /> Foto
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${captureMode === 'photo' && imageSrc ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'}`}
                    >
                      <Upload className="w-3 h-3" /> Subir
                    </button>
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>
              )}

              {/* Try-On Mode Toggle Selector */}
              {!loadingModel && !error && (product.ar_image || product.model_3d) && (
                <div className="pt-3 md:pt-4 border-t border-ink/5">
                  <span className="text-[11px] text-ink/60 font-semibold block mb-2">Modo del Probador</span>
                  <div className="grid grid-cols-2 gap-2 bg-ink/5 p-1 rounded-xl">
                    <button
                      onClick={() => setUseVectorModel(true)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${useVectorModel ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'}`}
                    >
                      Modelo Digital
                    </button>
                    <button
                      onClick={() => setUseVectorModel(false)}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${!useVectorModel ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'}`}
                    >
                      {product.model_3d ? "Modelo 3D 🌐" : "Foto Real"}
                    </button>
                  </div>
                  <p className="text-[9px] text-ink/40 mt-1">
                    {useVectorModel 
                      ? "Modelo vectorial premium 100% transparente y con cambio de color en tiempo real." 
                      : product.model_3d 
                        ? "Modelo 3D GLB interactivo ajustado a tu rostro en tiempo real. [v1.2 - Frente]"
                        : "Foto real del catálogo con eliminación digital de fondo blanco."}
                  </p>
                </div>
              )}

              {/* 3D Model Manual Adjustments Panel */}
              {!loadingModel && !error && product.model_3d && !useVectorModel && (
                <div className="pt-3 md:pt-4 border-t border-ink/5 space-y-3">
                  <span className="text-[11px] text-ink/60 font-semibold block">Ajustes del Modelo 3D</span>
                  
                  <div className="space-y-3 bg-ink/5 p-3 rounded-2xl text-[10px]">
                    {/* Scale Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-ink/60">Tamaño (Escala)</span>
                        <span className="font-bold text-ink">{extraScale.toFixed(2)}x</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2.0" step="0.05" 
                        value={extraScale} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setExtraScale(val);
                          extraScaleRef.current = val;
                        }} 
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    {/* Rotation Y Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-ink/60">Giro (Yaw)</span>
                        <span className="font-bold text-ink">{rotationY}°</span>
                      </div>
                      <input 
                        type="range" min="-180" max="180" step="5" 
                        value={rotationY} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRotationY(val);
                          rotationYRef.current = val;
                        }} 
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    {/* Rotation Z Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-ink/60">Inclinación (Roll)</span>
                        <span className="font-bold text-ink">{rotationZ}°</span>
                      </div>
                      <input 
                        type="range" min="-180" max="180" step="5" 
                        value={rotationZ} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRotationZ(val);
                          rotationZRef.current = val;
                        }} 
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    {/* Rotation X Slider */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-ink/60">Inclinación (Pitch)</span>
                        <span className="font-bold text-ink">{rotationX}°</span>
                      </div>
                      <input 
                        type="range" min="-180" max="180" step="5" 
                        value={rotationX} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRotationX(val);
                          rotationXRef.current = val;
                        }} 
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    {/* Offset Y (Vertical) */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-ink/60">Altura (Vertical)</span>
                        <span className="font-bold text-ink">{offsetY} px</span>
                      </div>
                      <input 
                        type="range" min="-100" max="100" step="2" 
                        value={offsetY} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOffsetY(val);
                          offsetYRef.current = val;
                        }} 
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {!loadingModel && !error && (
                <div className="pt-3 md:pt-4 border-t border-ink/5">
                  <span className="text-[11px] text-ink/60 font-semibold block mb-2">Color del Marco: <span className="text-ink font-bold">{frameColor.name}</span></span>
                  <div className="flex gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.hex}
                        onClick={() => setFrameColor(option)}
                        className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${frameColor.hex === option.hex ? 'border-accent scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                        title={option.name}
                      >
                        <span 
                          className="w-6 h-6 rounded-full block border border-ink/10" 
                          style={{ backgroundColor: option.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Size Adjuster Slider */}
              {!loadingModel && !error && (
                <div className="pt-3 md:pt-4 border-t border-ink/5">
                  <div className="flex justify-between text-[11px] text-ink/60 mb-1.5">
                    <span className="font-semibold">Tamaño de lentes</span>
                    <span className="font-bold text-accent">{Math.round(scaleAdjustment * 50)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.4" 
                    max="2.5" 
                    step="0.05" 
                    value={scaleAdjustment}
                    onChange={(e) => setScaleAdjustment(parseFloat(e.target.value))}
                    className="w-full h-1 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <p className="text-[9px] text-ink/40 mt-1">Desliza para ajustar la anchura exacta sobre tu rostro.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-8 space-y-3">
            <p className="text-xl md:text-2xl font-serif text-accent">${product.price.toLocaleString('es-CL')}</p>
            <button className="w-full bg-ink text-white py-3.5 md:py-4 rounded-2xl font-bold hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4" /> Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

