import React, { useRef, useEffect, memo } from 'react';
import './DotField.css';

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  cursorForce?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  bulgeOnly?: boolean;
}

const DotField = memo(({
  dotRadius = 1,
  dotSpacing = 20,
  bulgeStrength = 19,
  cursorForce = 0.04,
  gradientFrom = 'rgba(6,182,212,0.15)',
  gradientTo = 'rgba(16,185,129,0.08)',
  glowColor = '#0A0F1E',
  bulgeOnly = true,
}: DotFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    let mouseX = w / 2;
    let mouseY = h / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const render = () => {
      // Clear background
      ctx.fillStyle = glowColor;
      ctx.fillRect(0, 0, w, h);
      
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, gradientFrom);
      gradient.addColorStop(1, gradientTo);
      ctx.fillStyle = gradient;

      for (let x = 0; x < w; x += dotSpacing) {
        for (let y = 0; y < h; y += dotSpacing) {
          const dx = mouseX - x;
          const dy = mouseY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let drawRadius = dotRadius;
          const threshold = 250; // Range of effect
          
          if (dist < threshold) {
            drawRadius = dotRadius + (threshold - dist) * cursorForce * (bulgeStrength / 10);
          }

          if (bulgeOnly && dist >= threshold) {
            drawRadius = dotRadius;
          }

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0, drawRadius), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dotRadius, dotSpacing, bulgeStrength, cursorForce, gradientFrom, gradientTo, glowColor, bulgeOnly]);

  return (
    <div className="dot-field-container">
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
});

export default DotField;
