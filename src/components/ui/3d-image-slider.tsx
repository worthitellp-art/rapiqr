"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const DEFAULT_DATA = [
  "/mockup.png",
  "/mockup2.png",
  "/mockup.png",
  "/mockup2.png",
  "/mockup.png",
  "/mockup2.png",
];

interface Slider3DProps {
  images?: string[];
  duration?: number;
  cardWidth?: string;
  cardAspectRatio?: string;
  perspective?: string;
  containerClassName?: string;
  imageClassName?: string;
  rotationDirection?: "left" | "right";
  withMask?: boolean;
}

export default function ImageSlider3D({
  images = DEFAULT_DATA,
  duration = 32,
  cardWidth = "17.5em",
  cardAspectRatio = "7/10",
  perspective = "35em",
  containerClassName = "",
  imageClassName = "",
  rotationDirection = "left",
  withMask = true,
}: Slider3DProps) {
  const n = images.length;
  const prefersReducedMotion = useReducedMotion();
  const animationDuration = prefersReducedMotion ? duration * 4 : duration;

  const rotationValues = rotationDirection === "left" ? [0, 360] : [360, 0];

  const maskStyles = withMask
    ? {
        WebkitMask:
          "linear-gradient(90deg, transparent 0%, #000 8% 92%, transparent 100%)",
        mask: "linear-gradient(90deg, transparent 0%, #000 8% 92%, transparent 100%)",
      }
    : {};

  return (
    <div
      className={`grid w-full overflow-visible place-items-center ${containerClassName}`}
      style={{
        perspective: perspective,
        ...maskStyles,
      }}
    >
      <motion.div
        className="grid place-self-center pointer-events-auto"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateY: rotationValues,
        }}
        transition={{
          duration: animationDuration,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i}`}
            className={`col-start-1 row-start-1 object-cover rounded-[1.5em] ${imageClassName}`}
            style={{
              width: cardWidth,
              aspectRatio: cardAspectRatio,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: `rotateY(calc(${i} * (1turn / ${n}))) translateZ(calc(-1 * (0.5 * ${cardWidth} + 0.5em) / tan(0.5 * (1turn / ${n}))))`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
