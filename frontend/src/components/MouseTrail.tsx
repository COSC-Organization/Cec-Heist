"use client";

import React, { useState, useEffect, useRef } from "react";

interface TrailItem {
  id: number;
  x: number;
  y: number;
  image: string;
  rotation: number;
}

export default function MouseTrail() {
  const [images, setImages] = useState<string[]>([]);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const imageIndexRef = useRef<number>(0);
  const idCounterRef = useRef<number>(0);

  // Load images from API
  useEffect(() => {
    let active = true;

    const fetchImages = async () => {
      try {
        const res = await fetch("/api/mouse-hover-images");
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
        }
      } catch (err) {
        console.error("Failed to fetch mouse hover images", err);
      }
    };

    fetchImages();

    // Auto-poll every 3s if no images yet, so newly added images show up immediately
    const pollInterval = setInterval(() => {
      if (images.length === 0) {
        fetchImages();
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [images.length]);

  // Handle mouse move
  useEffect(() => {
    if (images.length === 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const currentY = e.clientY;

      if (lastPosRef.current) {
        const dist = Math.hypot(
          currentX - lastPosRef.current.x,
          currentY - lastPosRef.current.y
        );
        // Only spawn after moving at least 44 pixels
        if (dist < 44) return;
      }

      lastPosRef.current = { x: currentX, y: currentY };

      const currentImg = images[imageIndexRef.current % images.length];
      imageIndexRef.current += 1;

      const randomTilt = (Math.random() - 0.5) * 24; // -12deg to +12deg
      const newItemId = ++idCounterRef.current;

      const newItem: TrailItem = {
        id: newItemId,
        x: currentX,
        y: currentY,
        image: currentImg,
        rotation: randomTilt,
      };

      setTrail((prev) => [...prev.slice(-15), newItem]); // keep max 16 active items in state

      // Clean up after 1000ms
      setTimeout(() => {
        setTrail((prev) => prev.filter((item) => item.id !== newItemId));
      }, 1000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [images]);

  if (images.length === 0 && trail.length === 0) {
    return null;
  }

  return (
    <div className="mouse-trail-container" aria-hidden="true">
      {trail.map((item) => (
        <div
          key={item.id}
          className="mouse-trail-item"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
          }}
        >
          <img
            src={item.image}
            alt="Mouse Hover Graphic"
            className="mouse-trail-img"
            style={{
              transform: `rotate(${item.rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
