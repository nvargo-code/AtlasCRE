"use client";

import { useState } from "react";

const testimonials = [
  {
    quote:
      "David didn't just find us a home — he found us one that wasn't even on the market. He mailed an entire neighborhood to track down a willing seller when nothing was listed. That kind of hustle is why we'll never use another agent.",
    name: "Mike & Lyndsey Reding",
    context: "Found their dream home off-market in Austin",
  },
  {
    quote:
      "I've bought and sold over a dozen investment properties. David is the most analytically rigorous agent I've ever worked with. He doesn't pitch — he presents data, runs the numbers, and lets the math speak. That's rare in this industry.",
    name: "Susy Horrigan",
    context: "Multi-property investor",
  },
  {
    quote:
      "As a former realtor, my bar was impossibly high. David cleared it. We had multiple offers above asking within 48 hours. His pricing strategy created exactly the urgency he said it would. I went from skeptical to evangelical.",
    name: "Claire Winslow",
    context: "Owner, Best Practice Media",
  },
];

export function TestimonialSlider() {
  const [active, setActive] = useState(0);

  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="mb-10 min-h-[160px] flex items-center justify-center">
        <div key={active}>
          <svg className="w-8 h-8 text-gold/40 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
          </svg>
          <p className="text-white/80 text-lg md:text-xl font-light leading-relaxed italic">
            &ldquo;{testimonials[active].quote}&rdquo;
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-white font-semibold tracking-wide">
          {testimonials[active].name}
        </p>
        <p className="text-white/40 text-sm mt-1">
          {testimonials[active].context}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === active ? "bg-gold w-8" : "bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
