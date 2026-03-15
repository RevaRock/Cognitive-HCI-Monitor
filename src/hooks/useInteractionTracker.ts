import { useState, useEffect, useRef } from 'react';

export interface InteractionMetrics {
  mouseVelocity: number;
  clickFrequency: number;
  typingSpeed: number;
  scrollJitter: number;
  idleTime: number;
  timestamp: number;
}

export function useInteractionTracker() {
  const [metrics, setMetrics] = useState<InteractionMetrics>({
    mouseVelocity: 0,
    clickFrequency: 0,
    typingSpeed: 0,
    scrollJitter: 0,
    idleTime: 0,
    timestamp: Date.now(),
  });

  const lastPos = useRef({ x: 0, y: 0, t: Date.now() });
  const mouseDistances = useRef<number[]>([]);
  const clickCount = useRef(0);
  const charCount = useRef(0);
  const scrollPositions = useRef<number[]>([]);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = (now - lastPos.current.t) / 1000;
      if (dt > 0) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        mouseDistances.current.push(dist / dt);
        if (mouseDistances.current.length > 50) mouseDistances.current.shift();
      }
      lastPos.current = { x: e.clientX, y: e.clientY, t: now };
      lastActivity.current = now;
    };

    const handleClick = () => {
      clickCount.current++;
      lastActivity.current = Date.now();
    };

    const handleKeyDown = () => {
      charCount.current++;
      lastActivity.current = Date.now();
    };

    const handleScroll = () => {
      scrollPositions.current.push(window.scrollY);
      if (scrollPositions.current.length > 20) scrollPositions.current.shift();
      lastActivity.current = Date.now();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Calculate average velocity
      const avgVelocity = mouseDistances.current.length > 0 
        ? mouseDistances.current.reduce((a, b) => a + b, 0) / mouseDistances.current.length 
        : 0;

      // Calculate scroll jitter (variance)
      let jitter = 0;
      if (scrollPositions.current.length > 1) {
        const diffs = [];
        for (let i = 1; i < scrollPositions.current.length; i++) {
          diffs.push(Math.abs(scrollPositions.current[i] - scrollPositions.current[i-1]));
        }
        const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        jitter = diffs.reduce((a, b) => a + Math.pow(b - avgDiff, 2), 0) / diffs.length;
      }

      setMetrics({
        mouseVelocity: Math.round(avgVelocity),
        clickFrequency: clickCount.current * 12, // Extrapolated to clicks per minute (5s interval)
        typingSpeed: charCount.current * 12, // CPM
        scrollJitter: Math.round(jitter),
        idleTime: Math.round((now - lastActivity.current) / 1000),
        timestamp: now,
      });

      // Reset counters for next window
      clickCount.current = 0;
      charCount.current = 0;
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  return metrics;
}
