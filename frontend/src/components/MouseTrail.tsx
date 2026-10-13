"use client";

import React, { useState, useEffect, useRef } from "react";

interface TrailItem {
  id: number;
  x: number;
  y: number;
  throwX: number;
  throwY: number;
  startRot: number;
  endRot: number;
  image: string;
}

export default function MouseTrail() {
  const [images, setImages] = useState<string[]>([]);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const lastSpawnPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
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

  // Handle mouse move & throw float effect
  useEffect(() => {
    if (images.length === 0) return;

    const triggerThrow = (currentX: number, currentY: number) => {
      const now = performance.now();

      // Reset gesture origin if cursor was idle for more than 160ms
      const isIdleResume =
        !lastSpawnPosRef.current || now - lastMoveTimeRef.current > 160;
      lastMoveTimeRef.current = now;

      if (isIdleResume || !lastSpawnPosRef.current) {
        lastSpawnPosRef.current = { x: currentX, y: currentY };
        return;
      }

      const prevPos = lastSpawnPosRef.current;
      const dx = currentX - prevPos.x;
      const dy = currentY - prevPos.y;
      const dist = Math.hypot(dx, dy);

      // Distance threshold: must move at least 60px before throwing a new image
      if (dist < 60) return;

      // Time debounce: at least 90ms between image throws to prevent clumping
      if (now - lastSpawnTimeRef.current < 90) return;

      lastSpawnTimeRef.current = now;
      lastSpawnPosRef.current = { x: currentX, y: currentY };

      const currentImg = images[imageIndexRef.current % images.length];
      imageIndexRef.current += 1;

      // Direction unit vector of the cursor movement
      const nx = dx / dist;
      const ny = dy / dist;

      // Throw momentum: proportional to speed/gesture distance (clamped between 60px and 140px)
      const throwDist = Math.min(140, Math.max(60, dist * 0.85));

      // Subtle perpendicular scatter so multiple throws drift naturally
      const perp = (Math.random() - 0.5) * 28;
      const throwX = Math.round(nx * throwDist - ny * perp);
      // Gentle buoyancy: slight upward air float (-16px to -34px)
      const throwY = Math.round(ny * throwDist + nx * perp - (16 + Math.random() * 18));

      // Rotational spin impulse during the throw
      const startRot = Math.round((Math.random() - 0.5) * 16);
      const spinDirection = nx >= 0 ? 1 : -1;
      const spinAmt = Math.round(spinDirection * (12 + Math.random() * 16));
      const endRot = startRot + spinAmt;

      const newItemId = ++idCounterRef.current;

      const newItem: TrailItem = {
        id: newItemId,
        x: currentX,
        y: currentY,
        throwX,
        throwY,
        startRot,
        endRot,
        image: currentImg,
      };

      // Keep max 7 active floating items
      setTrail((prev) => [...prev.slice(-6), newItem]);

      // Float for 800 milliseconds then unmount cleanly (does not follow cursor)
      setTimeout(() => {
        setTrail((prev) => prev.filter((item) => item.id !== newItemId));
      }, 800);
    };

    const handleMouseMove = (e: MouseEvent) => {
      triggerThrow(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        triggerThrow(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
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
            "--throw-x": `${item.throwX}px`,
            "--throw-y": `${item.throwY}px`,
            "--start-rot": `${item.startRot}deg`,
            "--end-rot": `${item.endRot}deg`,
          } as React.CSSProperties}
        >
          <img
            src={item.image}
            alt="Mouse Hover Graphic"
            className="mouse-trail-img"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
