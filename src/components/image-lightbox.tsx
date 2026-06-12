import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  product_name?: string;
}

export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
  product_name,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          setIndex((i) => (i - 1 + images.length) % images.length);
          setScale(1);
          setPosition({ x: 0, y: 0 });
          break;
        case "ArrowRight":
          setIndex((i) => (i + 1) % images.length);
          setScale(1);
          setPosition({ x: 0, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((s) => Math.max(1, Math.min(5, s + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setPosition((prev) => ({
        ...prev,
        startX: e.clientX - prev.x,
        startY: e.clientY - prev.y,
      }));
    }
  }, [scale]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        const newX = e.clientX - (position as any).startX;
        const newY = e.clientY - (position as any).startY;
        setPosition((prev) => ({ ...prev, x: newX, y: newY }));
      }
    },
    [isDragging, scale, position]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleZoom = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => {
            if (scale === 1) onClose();
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors rounded-full"
          >
            <X size={24} />
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScale((s) => Math.max(1, s - 0.5));
              }}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
              disabled={scale <= 1}
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScale((s) => Math.min(5, s + 0.5));
              }}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
              disabled={scale >= 5}
            >
              <ZoomIn size={20} />
            </button>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + images.length) % images.length);
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors rounded-full z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % images.length);
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors rounded-full z-10"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image container */}
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          >
            <motion.img
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={images[index]}
              alt={product_name ?? ""}
              className="max-h-[85vh] max-w-[90vw] object-contain select-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleZoom();
              }}
              draggable={false}
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`w-16 h-20 border transition-all ${
                    i === index ? "border-white opacity-100" : "border-white/30 opacity-60 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 right-4 z-10 text-white/60 text-sm">
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Image zoom lens component for desktop hover
export function ImageZoomLens({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lensSize = 150;
  const zoomLevel = 2;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate lens position (centered on cursor)
    const lensX = Math.max(0, Math.min(rect.width - lensSize, x - lensSize / 2));
    const lensY = Math.max(0, Math.min(rect.height - lensSize, y - lensSize / 2));
    setLensPosition({ x: lensX, y: lensY });
    setMousePosition({ x, y });
  };

  // Calculate background position for the zoomed view
  const bgX = (mousePosition.x / (containerRef.current?.offsetWidth || 1)) * 100;
  const bgY = (mousePosition.y / (containerRef.current?.offsetHeight || 1)) * 100;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />

      {/* Hover lens */}
      {isHovering && (
        <div
          className="absolute pointer-events-none border-2 border-white shadow-lg hidden lg:block"
          style={{
            width: lensSize,
            height: lensSize,
            left: lensPosition.x,
            top: lensPosition.y,
            backgroundImage: `url(${src})`,
            backgroundSize: `${(containerRef.current?.offsetWidth || 1) * zoomLevel}px ${(containerRef.current?.offsetHeight || 1) * zoomLevel}px`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {/* Zoomed preview panel (alternative approach) */}
      {isHovering && (
        <div
          className="fixed right-8 top-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-white border border-border shadow-xl overflow-hidden hidden xl:block pointer-events-none z-30"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${(containerRef.current?.offsetWidth || 1) * 3}px auto`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
}
