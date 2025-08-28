// components/ImageModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
const ImageViewerModal = ({ images, initialIndex, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartDistance, setTouchStartDistance] = useState(null);

  // Reset zoom and position when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

  // Desktop Mouse Events
  const handleWheel = (e) => {
    e.preventDefault();
    const newScale = e.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    setScale(Math.max(1, Math.min(newScale, 4)));
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: position.x + dx / scale,
        y: position.y + dy / scale,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Events
  const getDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setTouchStartDistance(getDistance(e.touches));
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistance !== null) {
      const newDistance = getDistance(e.touches);
      const newScale = scale * (newDistance / touchStartDistance);
      setScale(Math.max(1, Math.min(newScale, 4)));
      setTouchStartDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setPosition({
        x: position.x + dx / scale,
        y: position.y + dy / scale,
      });
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDistance(null);
    setIsDragging(false);
  };

  // Gallery Navigation
  const handleNext = (e) => {
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = images[currentImageIndex];
    link.download = `chat-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 cursor-default"
      onClick={onClose}
    >
      <div className="relative max-w-full max-h-full w-full h-full p-4 flex items-center justify-center">
        <img
          src={images[currentImageIndex]}
          alt="Zoomed-in message content"
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "pointer",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <>
            <button
              className="absolute left-4 p-2 rounded-full bg-white/20 text-white text-3xl font-bold hover:bg-white/40 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrev}
              disabled={currentImageIndex === 0}
            >
              &#8249;
            </button>
            <button
              className="absolute right-4 p-2 rounded-full bg-white/20 text-white text-3xl font-bold hover:bg-white/40 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNext}
              disabled={currentImageIndex === images.length - 1}
            >
              &#8250;
            </button>
          </>
        )}

        <button
          className="absolute top-4 right-4 text-white text-3xl font-bold p-2 z-10"
          onClick={onClose}
        >
          &times;
        </button>
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-white/20 text-white text-3xl hover:bg-white/40 z-10"
          onClick={handleDownload}
        >
          <Download className="size-8" />
        </button>
      </div>
    </div>
  );
};

export default ImageViewerModal;
