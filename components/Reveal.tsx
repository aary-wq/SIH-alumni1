"use client"
import React, { useEffect, useRef, useState, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  stagger?: number; // ms between children
  rootMargin?: string;
  threshold?: number;
}

export default function Reveal({ children, className = "", stagger = 80, rootMargin = "0px", threshold = 0.12 }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        });
      },
      { root: null, rootMargin, threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  // if children is an array, apply staggered inline delays
  const renderChildren = () => {
    if (!children) return null;
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        const delay = `${i * stagger}ms`;
        return (
          <div key={i} style={{ transitionDelay: delay }} className={`reveal-init ${visible ? "reveal-show" : ""}`}>
            {child}
          </div>
        );
      });
    }
    // single child
    return (
      <div className={`reveal-init ${visible ? "reveal-show" : ""}`}>
        {children}
      </div>
    );
  };

  const setRef: (r: HTMLElement | null) => void = (r) => {
    ref.current = r;
  };

  return (
    <section ref={setRef} className={className}>
      {renderChildren()}
    </section>
  );
}
