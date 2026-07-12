"use client";

import React from "react";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";

export default function InfiniteMovingCardsDemo() {
  return (
    <div className="h-[40rem] rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden">
      <InfiniteMovingCards
        items={testimonials}
        direction="up"
        speed="slow"
      />
    </div>
  );
}

const testimonials = [
  {
    image: "/mockup.png",
    quote:
      "Placed one on my car dashboard. Got an alert within minutes when someone bumped it in the parking lot. Absolutely worth it.",
    name: "Priya Sharma",
    title: "Mumbai, Maharashtra",
  },
  {
    image: "/mockup2.png",
    quote:
      "Bought the home gate tag for my elderly parents. Now I know whenever someone visits — even when I'm at work.",
    name: "Rohan Mehta",
    title: "Bangalore, Karnataka",
  },
  {
    image: "/mockup.png",
    quote:
      "The luggage tag saved my bag at Delhi airport. A kind stranger scanned it and contacted me immediately.",
    name: "Ananya Patel",
    title: "Ahmedabad, Gujarat",
  },
  {
    image: "/mockup2.png",
    quote:
      "My son's school bag has one now. Peace of mind knowing his route is tracked and I get alerts.",
    name: "Vikram Joshi",
    title: "Pune, Maharashtra",
  },
  {
    image: "/mockup.png",
    quote:
      "Three stickers across two cars and a bike. The family plan is brilliant — everything on one dashboard.",
    name: "Neha Kapoor",
    title: "Delhi NCR",
  },
  {
    image: "/mockup2.png",
    quote:
      "Simple setup, no app needed. Just scan, register, and you're protected. Gifted it to all my siblings.",
    name: "Arjun Reddy",
    title: "Hyderabad, Telangana",
  },
];
