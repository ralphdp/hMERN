import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const AnimatedLogo = ({ size = 40, color = '#1976d2', className }) => {
  const canvasRef = useRef(null);
  const prevColorRef = useRef(color);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Particle class
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        // Keep particles away from edges when spawning
        const margin = 4; // Reduced margin
        this.x = margin + Math.random() * (size - 2 * margin);
        this.y = margin + Math.random() * (size - 2 * margin);
        this.size = Math.random() * 1.6 + 0.8; // Reduced size (20% smaller)
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.glow = Math.random();
        this.glowSpeed = (Math.random() - 0.5) * 0.02;
        this.color = color;
      }

      update() {
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        this.glow += this.glowSpeed;

        // Keep particles within bounds with smooth bouncing
        const margin = this.size;
        if (this.x < margin) {
          this.x = margin;
          this.speedX = Math.abs(this.speedX);
        } else if (this.x > size - margin) {
          this.x = size - margin;
          this.speedX = -Math.abs(this.speedX);
        }

        if (this.y < margin) {
          this.y = margin;
          this.speedY = Math.abs(this.speedY);
        } else if (this.y > size - margin) {
          this.y = size - margin;
          this.speedY = -Math.abs(this.speedY);
        }

        // Smoothly transition color
        if (this.color !== color) {
          this.color = color;
        }

        // Clamp glow between 0 and 1
        if (this.glow > 1) {
          this.glow = 1;
          this.glowSpeed *= -1;
        } else if (this.glow < 0) {
          this.glow = 0;
          this.glowSpeed *= -1;
        }
      }

      draw() {
        const glowIntensity = 0.5 + this.glow * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = glowIntensity;
        ctx.fill();

        // Add very subtle glow
        ctx.shadowBlur = this.size * 0.5;
        ctx.shadowColor = this.color;
        ctx.shadowOpacity = 0.1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const particleCount = 15;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < size * 0.4) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - distance / (size * 0.4)) * 0.2;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, color]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      className={className}
      sx={{
        width: size,
        height: size,
        cursor: 'pointer',
      }}
    />
  );
};

export default AnimatedLogo; 