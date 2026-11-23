import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  fileName?: string;
}

const STAGE_SIZE = 300; // Outer interactive viewport (px)
const CROP_SIZE = 240;  // Inner circular crop frame (px)
const OUTPUT_SIZE = 512; // Final saved image resolution (512x512)

export const ImageCropperModal = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  fileName = 'profile-photo.jpg',
}: ImageCropperModalProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Reset crop state whenever a new image is opened
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImgSize(null);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const baseScale = imgSize ? Math.max(CROP_SIZE / imgSize.w, CROP_SIZE / imgSize.h) : 1;
  const dispW = imgSize ? imgSize.w * baseScale * zoom : CROP_SIZE;
  const dispH = imgSize ? imgSize.h * baseScale * zoom : CROP_SIZE;

  const clampOffset = (x: number, y: number, currentZoom: number) => {
    if (!imgSize) return { x: 0, y: 0 };
    const w = imgSize.w * baseScale * currentZoom;
    const h = imgSize.h * baseScale * currentZoom;
    const maxX = Math.max(0, (w - CROP_SIZE) / 2);
    const maxY = Math.max(0, (h - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, newZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(clampOffset(dragStartRef.current.offsetX + dx, dragStartRef.current.offsetY + dy, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleApplyCrop = () => {
    const img = imgRef.current;
    if (!img || !imgSize) return;
    setIsExporting(true);

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const ratio = OUTPUT_SIZE / CROP_SIZE;
    const drawX = CROP_SIZE / 2 - dispW / 2 + offset.x;
    const drawY = CROP_SIZE / 2 - dispH / 2 + offset.y;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX * ratio, drawY * ratio, dispW * ratio, dispH * ratio);

    canvas.toBlob(
      (blob) => {
        setIsExporting(false);
        if (!blob) return;
        const safeName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
        const croppedFile = new File([blob], safeName, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(croppedFile);
        onCropComplete(croppedFile, previewUrl);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div>
              <h3 className="text-lg font-bold text-role">Adjust Profile Picture</h3>
              <p className="text-xs text-gray-500">Drag to reposition and use the slider to zoom.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Interactive Crop Stage */}
          <div className="p-6 flex flex-col items-center">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ width: STAGE_SIZE, height: STAGE_SIZE }}
              className={`relative rounded-2xl overflow-hidden bg-gray-900 select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                crossOrigin="anonymous"
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${dispW}px`,
                  height: `${dispH}px`,
                  maxWidth: 'none',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />

              {/* Circular Cutout Overlay */}
              <div
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none"
              />
            </div>

            <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
              <Move size={12} /> Drag photo to center your face inside the circle
            </p>

            {/* Zoom Controls */}
            <div className="w-full mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-[#2f4fa8] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={!imgSize || isExporting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-role hover:bg-role-dark text-white shadow-md transition-all disabled:opacity-60"
            >
              <Check size={16} /> {isExporting ? 'Cropping...' : 'Apply Crop'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};