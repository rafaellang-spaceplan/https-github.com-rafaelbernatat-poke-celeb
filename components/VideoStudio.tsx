import React, { useRef, useState, useEffect } from 'react';
import { GeneratedAssets } from '../types';
import { Play, Download, Loader2, Square, Video, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { removeSmartBackground } from '../utils/imageProcessing';
import PokeCard from './PokeCard';

interface VideoStudioProps {
  assets: GeneratedAssets;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ assets }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isPlayingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDurationDisplay, setTotalDurationDisplay] = useState(60);

  useEffect(() => {
    const captureCard = async () => {
      setIsPreparing(true);
      setError(null);
      await new Promise(r => setTimeout(r, 1000));
      
      const cardEl = document.querySelector('#pokemon-card-preview');
      if (cardEl) {
        try {
          const dataUrl = await toPng(cardEl as HTMLElement, { 
            pixelRatio: 2,
            cacheBust: true,
          });
          setCardImage(dataUrl);
        } catch (e) {
          console.error("Falha na captura da carta", e);
          setCardImage(`data:image/png;base64,${assets.originalImageBase64}`);
        } finally {
          setIsPreparing(false);
        }
      } else {
        setIsPreparing(false);
      }
    };
    if (assets.data) captureCard();
  }, [assets.data, assets.originalImageBase64]);

  const drawImageContain = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, x: number, y: number, w: number, h: number) => {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let finalW, finalH, finalX, finalY;

    if (imgRatio > targetRatio) {
        finalW = w;
        finalH = w / imgRatio;
        finalX = x;
        finalY = y + (h - finalH) / 2;
    } else {
        finalW = h * imgRatio;
        finalH = h;
        finalX = x + (w - finalW) / 2;
        finalY = y;
    }
    ctx.drawImage(img, finalX, finalY, finalW, finalH);
  };

  const drawSunburst = (ctx: CanvasRenderingContext2D, width: number, height: number, color1: string, color2: string, rotationOffset: number) => {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotationOffset);
    ctx.fillStyle = color2;
    const rays = 24;
    const angleStep = (Math.PI * 2) / rays;
    for (let i = 0; i < rays; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const startAngle = i * angleStep;
        const endAngle = startAngle + angleStep / 2;
        const radius = Math.max(width, height) * 1.5;
        ctx.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);
        ctx.lineTo(Math.cos(endAngle) * radius, Math.sin(endAngle) * radius);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
  };

  const drawPokedexOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, elapsedInState: number) => {
    const scanLineY = (elapsedInState * 0.8) % height;
    ctx.save();
    ctx.fillStyle = '#C03028'; 
    ctx.fillRect(0, 0, width, 120); 
    ctx.fillRect(0, height - 120, width, 120); 
    ctx.fillRect(0, 0, 40, height); 
    ctx.fillRect(width - 40, 0, 40, height); 
    ctx.beginPath();
    ctx.arc(90, 60, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#1E90FF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    const colors = ['#FF0000', '#FFFF00', '#00FF00'];
    colors.forEach((c, i) => {
        ctx.beginPath();
        ctx.arc(160 + (i * 40), 40, 10, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
    });
    ctx.beginPath();
    ctx.rect(40, 120, width - 80, height - 240);
    ctx.clip();
    ctx.fillStyle = 'rgba(0, 255, 100, 0.05)';
    ctx.fillRect(40, 120, width - 80, height - 240);
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < width - 40; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 120; y < height - 120; y += 50) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(40, scanLineY, width - 80, 5);
    ctx.shadowBlur = 0;
    if (Math.floor(elapsedInState / 200) % 2 === 0) {
        drawText(ctx, "ANALISANDO DADOS...", width / 2, 160, 30, false, '#00ff00');
    }
    ctx.restore();
  };

  const drawKaraokeSubtitles = (ctx: CanvasRenderingContext2D, text: string, elapsedAudio: number, totalAudioDuration: number, width: number, height: number) => {
      if (!text || totalAudioDuration <= 0) return;
      
      const words = text.split(/\s+/).filter(w => w.length > 0);
      if (words.length === 0) return;

      // SINCRONIA BASEADA EM CARACTERES (Mais natural que contagem de palavras)
      const totalChars = words.reduce((acc, w) => acc + w.length, 0);
      const progress = Math.min(1, Math.max(0, elapsedAudio / totalAudioDuration));
      
      const currentTargetChar = Math.floor(progress * totalChars);
      
      let charCount = 0;
      let currentWordIndex = 0;
      
      // Encontra a palavra atual baseada na contagem cumulativa de caracteres
      for (let i = 0; i < words.length; i++) {
          charCount += words[i].length;
          if (charCount >= currentTargetChar) {
              currentWordIndex = i;
              break;
          }
      }
      // Garante que a última palavra seja marcada no final
      if (progress > 0.98) currentWordIndex = words.length - 1;

      // Paginação
      const WORDS_PER_PAGE = 5; 
      const pageIndex = Math.floor(currentWordIndex / WORDS_PER_PAGE);
      const startWordIdx = pageIndex * WORDS_PER_PAGE;
      const endWordIdx = Math.min(startWordIdx + WORDS_PER_PAGE, words.length);
      const currentWords = words.slice(startWordIdx, endWordIdx);
      
      // Configuração Visual (Levantada para evitar UI do TikTok)
      const boxHeight = 160;
      const boxY = height - 320; 
      const sidePadding = 40;
      const maxTextWidth = width - (sidePadding * 2);
      
      ctx.save();
      
      // Caixa estilizada
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; 
      ctx.beginPath();
      ctx.roundRect(sidePadding / 2, boxY, width - sidePadding, boxHeight, 24);
      ctx.fill();
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fbbf24'; 
      ctx.stroke();
      ctx.shadowBlur = 0;

      // AJUSTE DINÂMICO DE FONTE
      let fontSize = 42;
      ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
      
      // Mede largura total da frase atual
      let textWidth = currentWords.reduce((acc, w) => acc + ctx.measureText(w + " ").width, 0);
      
      // Reduz fonte se exceder a largura da caixa
      while (textWidth > maxTextWidth && fontSize > 20) {
          fontSize -= 2;
          ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
          textWidth = currentWords.reduce((acc, w) => acc + ctx.measureText(w + " ").width, 0);
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      let currentX = (width - textWidth) / 2; // Centraliza bloco
      const centerY = boxY + (boxHeight / 2);

      currentWords.forEach((word, i) => {
          const globalIdx = startWordIdx + i;
          const wMetrics = ctx.measureText(word + " ");
          
          if (globalIdx <= currentWordIndex) {
              ctx.fillStyle = "#fbbf24"; // Amarelo (Atual/Lido)
              ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
              ctx.shadowBlur = 15;
          } else {
              ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; // Branco Transparente (Futuro)
              ctx.shadowBlur = 0;
          }

          ctx.strokeStyle = 'black';
          ctx.lineWidth = fontSize * 0.15;
          ctx.strokeText(word, currentX, centerY);
          ctx.fillText(word, currentX, centerY);
          
          currentX += wMetrics.width;
      });

      ctx.restore();
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, elapsed: number, duration: number, resources: any) => {
    const { width, height, silhouette, creatureTransparent, galleryImages, cardImg, scriptAudioEl, scriptDurationSec } = resources;
    const p = Math.min(elapsed / duration, 1);
    setProgress(p);

    const INTRO_DURATION = 4000;
    const SCAN_PRE_DURATION = 1500;
    const SCRIPT_START = INTRO_DURATION + SCAN_PRE_DURATION; 
    const GALLERY_START = SCRIPT_START + 2000;
    const CARD_START = duration - 8000;

    // Calculo de tempo de áudio preciso
    const audioTotalMs = (scriptAudioEl.duration && isFinite(scriptAudioEl.duration)) 
        ? scriptAudioEl.duration * 1000 
        : scriptDurationSec * 1000;
    const audioElapsed = elapsed - SCRIPT_START;

    // --- 1. INTRO ---
    if (elapsed < INTRO_DURATION) {
        const rot = elapsed / 2000; 
        drawSunburst(ctx, width, height, '#004a80', '#0066cc', rot);
        const bounce = Math.abs(Math.sin(elapsed / 300)) * 20;
        ctx.save();
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 20;
        drawImageContain(ctx, silhouette, 50, 300 - bounce, width - 100, 600);
        ctx.restore();
        drawText(ctx, "QUEM É ESSE", width/2, 150, 60, true, "#fbbf24");
        drawText(ctx, "POKÉMON?", width/2, 230, 80, true, "#fbbf24");

    // --- 2. REVEAL & SCAN ---
    } else if (elapsed < GALLERY_START) {
        const localElapsed = elapsed - INTRO_DURATION;
        if (localElapsed < 200) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
        } else {
            const rot = elapsed / 2000;
            drawSunburst(ctx, width, height, '#800000', '#cc0000', -rot); 
            drawImageContain(ctx, creatureTransparent, 50, 300, width - 100, 600);
            if (localElapsed > 400) drawPokedexOverlay(ctx, width, height, localElapsed);

            if (elapsed >= SCRIPT_START) {
                const name = assets.data?.name.toUpperCase() || 'POKEMON';
                drawText(ctx, "É O...", width/2, 150, 50, true, "#fff");
                drawText(ctx, name, width/2, 230, 80, true, "#fff");
                drawKaraokeSubtitles(ctx, assets.data?.script || '', audioElapsed, audioTotalMs, width, height);
            }
        }

    // --- 3. GALLERY ---
    } else if (elapsed < CARD_START) {
        ctx.fillStyle = '#101010';
        ctx.fillRect(0, 0, width, height);
        const galleryDuration = CARD_START - GALLERY_START;
        const galleryElapsed = elapsed - GALLERY_START;
        const imagesToShow = galleryImages;
        const imgDuration = galleryDuration / imagesToShow.length;
        const imgIndex = Math.min(imagesToShow.length - 1, Math.floor(galleryElapsed / imgDuration));
        const currentImg = imagesToShow[imgIndex];
        const imgProgress = (galleryElapsed % imgDuration) / imgDuration; 

        ctx.save();
        ctx.filter = 'blur(20px) brightness(0.4)';
        drawImageContain(ctx, currentImg, -100, -100, width + 200, height + 200);
        ctx.filter = 'none';
        const zoom = 1 + (imgProgress * 0.1);
        ctx.translate(width/2, height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-width/2, -height/2);
        drawImageContain(ctx, currentImg, 0, 0, width, height);
        ctx.restore();

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 80, width, 100);
        drawText(ctx, assets.data?.name || '', width/2, 130, 50, true, '#fff');
        
        drawKaraokeSubtitles(ctx, assets.data?.script || '', audioElapsed, audioTotalMs, width, height);

    // --- 4. FINAL CARD ---
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        const cardElapsed = elapsed - CARD_START;
        let scale = cardElapsed < 400 ? 2.5 - (cardElapsed / 400 * 1.3) : 1.2;
        ctx.save();
        ctx.translate(width/2, height/2);
        ctx.scale(scale, scale);
        if (cardImg && cardImg.complete) {
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 40;
            ctx.drawImage(cardImg, -175, -245, 350, 490);
        }
        ctx.restore();
        if (cardElapsed > 1000) drawText(ctx, "DEIXE SEU LIKE!", width/2, 120, 60, true, "#fbbf24");
        if (cardElapsed > 2500) {
             drawText(ctx, "QUEM DEVE SER", width/2, height - 200, 40, true, "#fff");
             drawText(ctx, "O PRÓXIMO?", width/2, height - 140, 60, true, "#fff");
        }
    }
  };

  const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, stroke = false, color = "#fff") => {
    ctx.font = `900 ${size}px Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    if (stroke) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = size * 0.15;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
    }
    ctx.fillText(text, x, y);
  };

  const createSoundEffect = (type: 'ping' | 'whoosh' | 'scan' | 'swish') => {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(gainNodeRef.current || ctx.destination);
      const now = ctx.currentTime;
      if (type === 'ping') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now); osc.stop(now + 0.5);
      } else if (type === 'whoosh') {
          osc.type = 'triangle'; 
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.linearRampToValueAtTime(800, now + 0.3);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
          osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'swish') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'scan') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
          osc.frequency.linearRampToValueAtTime(400, now + 0.1);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
      }
  };

  const loadResources = async () => {
    const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
    });

    const loadAudio = (src: string) => new Promise<HTMLAudioElement>((resolve) => {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.onloadedmetadata = () => resolve(audio);
        audio.onerror = () => resolve(audio);
        audio.src = src;
        audio.load();
    });

    const silhouette = await loadImg(assets.silhouetteImageBase64 || '');
    const creature = await loadImg(`data:image/png;base64,${assets.originalImageBase64}`);
    const creatureTransparent = await removeSmartBackground(creature);
    const galleryImages = await Promise.all(assets.gallery.map(base64 => loadImg(`data:image/png;base64,${base64}`)));
    const galleryTransparent = await Promise.all(galleryImages.map(img => removeSmartBackground(img))); 
    const cardImg = cardImage ? await loadImg(cardImage) : null;
    const scriptAudioEl = await loadAudio(assets.scriptAudioUrl || '');
    const outroAudioEl = await loadAudio(assets.outroAudioUrl || '');
    
    return { 
        silhouette, 
        creatureTransparent, 
        galleryImages: galleryTransparent.length > 0 ? galleryTransparent : [creatureTransparent],
        cardImg, 
        scriptAudioEl,
        outroAudioEl,
        scriptDurationSec: scriptAudioEl.duration || 30,
        width: 720, 
        height: 1280 
    };
  };

  const startPlayback = async (record = false) => {
    if (isPlayingRef.current || isRecordingRef.current) return;
    setError(null);
    setIsPreparing(true);

    try {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas error");
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Context error");

        const resources = await loadResources();
        canvas.width = resources.width;
        canvas.height = resources.height;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const dest = audioCtx.createMediaStreamDestination();
        const masterGain = audioCtx.createGain();
        masterGain.connect(dest);
        masterGain.connect(audioCtx.destination);
        gainNodeRef.current = masterGain; 

        const introUrl = assets.introAudioUrl || 'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptrackid=158752';
        const introAudio = new Audio(introUrl);
        introAudio.crossOrigin = "anonymous";
        const scriptAudio = resources.scriptAudioEl;
        const outroAudio = resources.outroAudioEl;

        const AUDIO_START = 5.5;
        const calculatedDuration = AUDIO_START + resources.scriptDurationSec + 8;
        const totalDurationMs = calculatedDuration * 1000;
        setTotalDurationDisplay(Math.ceil(calculatedDuration));
        
        audioCtx.createMediaElementSource(scriptAudio).connect(masterGain);
        audioCtx.createMediaElementSource(outroAudio).connect(masterGain);
        try { audioCtx.createMediaElementSource(introAudio).connect(masterGain); } catch (e) {}

        let recorder: MediaRecorder | null = null;
        let chunks: Blob[] = [];

        if (record) {
            isRecordingRef.current = true;
            setIsRecording(true);
            const stream = canvas.captureStream(30);
            const combinedStream = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
            recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 8000000 });
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${assets.data?.name}_Pokemon.webm`;
                a.click();
                cleanup();
            };
            recorder.start();
        } else {
            isPlayingRef.current = true;
            setIsPlaying(true);
        }

        setIsPreparing(false);
        const startTime = performance.now();
        let scriptStarted = false;
        let outroStarted = false;
        let sfxPlayed = { reveal: false, gallery: -1, card: false };
        let lastScanBeep = 0;

        introAudio.play().catch(() => {});
        
        const renderLoop = (now: number) => {
            if (!isPlayingRef.current && !isRecordingRef.current) { cleanup(); return; }
            const elapsed = now - startTime;
            drawFrame(ctx, elapsed, totalDurationMs, resources);

            if (elapsed >= 4000 && elapsed < 5500) {
                 if (elapsed - lastScanBeep > 180) { createSoundEffect('scan'); lastScanBeep = elapsed; }
            }
            if (elapsed >= 5500 && !sfxPlayed.reveal) { createSoundEffect('ping'); sfxPlayed.reveal = true; }
            if (elapsed >= 5500 && !scriptStarted) { scriptAudio.play().catch(() => {}); scriptStarted = true; }
            if (elapsed > 7500 && elapsed < (totalDurationMs - 8000)) {
                 const galleryElapsed = elapsed - 7500;
                 const imgDuration = (totalDurationMs - 8000 - 7500) / resources.galleryImages.length;
                 const currentIdx = Math.floor(galleryElapsed / imgDuration);
                 if (currentIdx > sfxPlayed.gallery) { createSoundEffect('whoosh'); sfxPlayed.gallery = currentIdx; }
            }
            if (elapsed >= (totalDurationMs - 8000)) {
                if (!sfxPlayed.card) { createSoundEffect('swish'); sfxPlayed.card = true; }
                if (!outroStarted) { outroAudio.play().catch(() => {}); outroStarted = true; }
            }

            if (elapsed < totalDurationMs) requestAnimationFrame(renderLoop);
            else { if (recorder && recorder.state !== 'inactive') recorder.stop(); cleanup(); }
        };

        const cleanup = () => {
            isPlayingRef.current = false; isRecordingRef.current = false;
            setIsPlaying(false); setIsRecording(false);
            introAudio.pause(); scriptAudio.pause(); outroAudio.pause();
            if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
        };

        requestAnimationFrame(renderLoop);
    } catch (err: any) {
        setError("Erro no vídeo.");
        setIsPreparing(false);
        stopAction();
    }
  };

  const stopAction = () => {
    isPlayingRef.current = false; isRecordingRef.current = false;
    setIsPlaying(false); setIsRecording(false);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full object-contain shadow-2xl bg-black" />
        
        {isPreparing && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
            <Loader2 size={48} className="text-yellow-400 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">GERANDO VÍDEO...</h3>
            <p className="text-slate-400 text-sm">Aguarde a composição final.</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <button onClick={() => setError(null)} className="bg-white text-red-900 px-6 py-2 rounded-xl font-bold">FECHAR</button>
          </div>
        )}

        {!isPlaying && !isRecording && !isPreparing && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <Video size={56} className="text-yellow-400 mb-6" />
            <h3 className="text-3xl font-black mb-2 text-white">VÍDEO PRONTO!</h3>
            <div className="flex flex-col w-full gap-4 max-w-[280px]">
              <button onClick={() => startPlayback(false)} className="bg-white text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3">PRÉVIA</button>
              <button onClick={() => startPlayback(true)} className="bg-red-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl">BAIXAR VÍDEO</button>
            </div>
          </div>
        )}

        {(isRecording || isPlaying) && (
          <button onClick={stopAction} className="absolute bottom-12 bg-white text-slate-950 p-5 rounded-full shadow-2xl z-30">
            <Square size={28} fill="currentColor" />
          </button>
        )}

        <div style={{ position: 'fixed', top: -4000, left: -4000, pointerEvents: 'none' }}>
          <div id="pokemon-card-preview">{assets.data && <PokeCard data={assets.data} image={assets.originalImageBase64} />}</div>
        </div>
    </div>
  );
};

export default VideoStudio;