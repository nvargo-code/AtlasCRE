"use client";

import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-white">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

export function StatsCounter() {
  const stats = [
    { value: 500, suffix: "M+", label: "Closed Volume" },
    { value: 15, suffix: "+", label: "Years in Austin" },
    { value: 102, suffix: "%", label: "Avg. Sale-to-List" },
    { value: 235, suffix: "+", label: "Listings Zillow Doesn't Have" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <AnimatedNumber target={stat.value} suffix={stat.suffix} />
          <p className="text-white/40 text-[11px] md:text-[12px] font-medium tracking-[0.15em] uppercase mt-3">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
