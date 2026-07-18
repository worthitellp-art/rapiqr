"use client";

import React, { useState } from "react";

interface CarouselImage {
  src: string;
  alt: string;
}

interface HeroCarouselProps {
  images: CarouselImage[];
  speed?: number;
  pauseOnHover?: boolean;
}

export default function HeroCarousel({
  images,
  speed = 25,
  pauseOnHover = true,
}: HeroCarouselProps) {
  const [paused, setPaused] = useState(false);
  const doubled = [...images, ...images];

  return (
    <div
      className="hero-marquee"
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <div
        className={`hero-marquee-track${paused ? " paused" : ""}`}
        style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
      >
        {doubled.map((img, i) => (
          <div className="hero-marquee-card" key={i}>
            <img src={img.src} alt={img.alt} loading="lazy" draggable={false} />
          </div>
        ))}
      </div>
      <div className="hero-marquee-fade hero-marquee-fade-left" />
      <div className="hero-marquee-fade hero-marquee-fade-right" />
    </div>
  );
}
