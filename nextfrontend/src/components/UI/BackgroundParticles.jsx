// frontend/frontend/src/components/UI/BackgroundParticles.jsx
import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

const BackgroundParticles = () => {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateParticles();
    };
    
    // Create particles
    const generateParticles = () => {
      particles = [];
      const particleCount = Math.floor(window.innerWidth * window.innerHeight / 20000);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          speedX: (Math.random() * 0.5 - 0.25) / 2.0,
          speedY: (Math.random() * 0.5 - 0.25) / 2.0,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    };
    
    // Draw and update particles
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set color based on theme
      const colorValue = theme === 'dark' ? '255, 255, 255' : '0, 0, 0';
      
      // Draw particles
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorValue}, ${particle.opacity})`;
        ctx.fill();
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });
      
      // Draw connections between particles
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const opacity = 0.15 * (1 - distance / 120);
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(${colorValue}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    // Initial setup
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40" 
    />
  );
};

export default BackgroundParticles;