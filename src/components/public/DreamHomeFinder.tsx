"use client";

import { useState } from "react";

const steps = [
  {
    title: "What are you looking for?",
    fields: [
      {
        name: "type",
        label: "Property Type",
        type: "select" as const,
        options: ["Single Family Home", "Condo / Townhouse", "Multi-Family", "Land", "Investment Property"],
      },
      {
        name: "purpose",
        label: "This will be my",
        type: "select" as const,
        options: ["Primary Residence", "Second Home", "Investment / Rental", "Vacation Home"],
      },
    ],
  },
  {
    title: "Budget and size",
    fields: [
      {
        name: "budgetMin",
        label: "Minimum Budget",
        type: "select" as const,
        options: ["No Minimum", "$200K", "$300K", "$400K", "$500K", "$750K", "$1M", "$1.5M", "$2M"],
      },
      {
        name: "budgetMax",
        label: "Maximum Budget",
        type: "select" as const,
        options: ["$300K", "$400K", "$500K", "$750K", "$1M", "$1.5M", "$2M", "$3M", "$5M+"],
      },
      {
        name: "beds",
        label: "Bedrooms",
        type: "select" as const,
        options: ["1+", "2+", "3+", "4+", "5+"],
      },
      {
        name: "baths",
        label: "Bathrooms",
        type: "select" as const,
        options: ["1+", "2+", "3+", "4+"],
      },
    ],
  },
  {
    title: "Where in Austin?",
    fields: [
      {
        name: "neighborhoods",
        label: "Preferred Areas (select all that apply)",
        type: "text" as const,
        placeholder: "e.g., Downtown, 78704, Westlake, East Side, open to suggestions...",
      },
      {
        name: "priorities",
        label: "What matters most?",
        type: "text" as const,
        placeholder: "e.g., walkability, good schools, large yard, close to downtown, quiet street...",
      },
    ],
  },
  {
    title: "Timeline and contact",
    fields: [
      {
        name: "timeline",
        label: "When do you want to move?",
        type: "select" as const,
        options: ["As soon as possible", "1-3 months", "3-6 months", "6-12 months", "Just exploring"],
      },
      {
        name: "firstName",
        label: "First Name",
        type: "text" as const,
        placeholder: "First name",
        required: true,
      },
      {
        name: "email",
        label: "Email",
        type: "text" as const,
        placeholder: "Email address",
        required: true,
      },
      {
        name: "phone",
        label: "Phone",
        type: "text" as const,
        placeholder: "Phone (optional)",
      },
    ],
  },
];

export function DreamHomeFinder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function updateField(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    setSending(true);
    try {
      await fetch("/api/register-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "dream_home_finder",
        }),
      });
    } catch {
      // Webhook later
    }
    setSending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-navy mb-3">We&apos;re On It</h2>
        <p className="text-mid-gray text-base max-w-md mx-auto mb-6">
          Our team is running your criteria through SuperSearch right now —
          including off-market sources Zillow can&apos;t access. Expect curated
          matches in your inbox within 48 hours.
        </p>
        <a href="/search" className="btn-primary">
          Browse SuperSearch Now
        </a>
      </div>
    );
  }

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-10">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 transition-colors ${
              i <= currentStep ? "bg-gold" : "bg-navy/10"
            }`}
          />
        ))}
      </div>

      {/* Step header */}
      <p className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">
        Step {currentStep + 1} of {steps.length}
      </p>
      <h2 className="text-2xl md:text-3xl font-light text-navy mb-8">
        {step.title}
      </h2>

      {/* Fields */}
      <div className="space-y-5 mb-10">
        {step.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-mid-gray mb-2">
              {field.label}
            </label>
            {field.type === "select" && field.options ? (
              <select
                value={formData[field.name] || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.name === "email" ? "email" : field.name === "phone" ? "tel" : "text"}
                value={formData[field.name] || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full border border-navy/15 px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="text-[12px] font-semibold tracking-[0.1em] uppercase text-mid-gray hover:text-navy transition-colors"
          >
            &larr; Back
          </button>
        ) : (
          <div />
        )}

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={sending || !formData.firstName || !formData.email}
            className="btn-primary disabled:opacity-50"
          >
            {sending ? "Sending..." : "Find My Dream Home"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="btn-primary"
          >
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
