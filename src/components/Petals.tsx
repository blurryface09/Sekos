"use client";

import { useEffect, useRef } from "react";

type Petal = {
  x: number;
  y: number;
  size: number;
  drift: number;
  fall: number;
  spin: number;
  angle: number;
  tint: number;
};

/**
 * A slow fall of petals behind the page. Deliberately few and faint: it should
 * read as weather, not as an effect. Stops entirely when the tab is hidden or
 * the reader asked for less motion.
 */
export function Petals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    const petals: Petal[] = [];

    function resize() {
      if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function seed() {
      petals.length = 0;
      // Fewer on a phone, both for the look and for the battery.
      const count = width < 700 ? 9 : 16;
      for (let i = 0; i < count; i++) {
        petals.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 5 + Math.random() * 7,
          drift: 0.15 + Math.random() * 0.35,
          fall: 0.18 + Math.random() * 0.32,
          spin: (Math.random() - 0.5) * 0.008,
          angle: Math.random() * Math.PI * 2,
          tint: Math.random(),
        });
      }
    }

    function draw() {
      if (!context || !running) return;
      context.clearRect(0, 0, width, height);

      const dark = document.documentElement.dataset.theme === "dark"
        || (document.documentElement.dataset.theme !== "light"
          && window.matchMedia("(prefers-color-scheme: dark)").matches);

      for (const petal of petals) {
        petal.y += petal.fall;
        petal.x += Math.sin(petal.y / 90) * petal.drift;
        petal.angle += petal.spin;

        if (petal.y - petal.size > height) {
          petal.y = -petal.size * 2;
          petal.x = Math.random() * width;
        }

        context.save();
        context.translate(petal.x, petal.y);
        context.rotate(petal.angle);
        context.beginPath();
        context.ellipse(0, 0, petal.size * 0.58, petal.size, 0, 0, Math.PI * 2);
        const alpha = dark ? 0.13 + petal.tint * 0.1 : 0.16 + petal.tint * 0.12;
        context.fillStyle = dark
          ? `rgba(240, 141, 171, ${alpha})`
          : `rgba(184, 57, 95, ${alpha})`;
        context.fill();
        context.restore();
      }

      frame = requestAnimationFrame(draw);
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    }

    resize();
    seed();
    frame = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="petals" aria-hidden="true" />;
}
