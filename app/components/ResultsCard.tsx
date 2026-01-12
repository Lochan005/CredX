"use client";

import React from "react";

interface ResultsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  variant: "highlight" | "normal" | "comparison";
  trend?: "positive" | "negative" | "neutral";
  beforeValue?: string;
  afterValue?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ResultsCard({
  title,
  value,
  subtitle,
  variant,
  trend = "neutral",
  beforeValue,
  afterValue,
  beforeLabel = "Before",
  afterLabel = "After",
}: ResultsCardProps) {
  // Trend indicator styles
  const trendStyles = {
    positive: "text-green-400",
    negative: "text-red-400",
    neutral: "text-white",
  };

  const trendIcons = {
    positive: "↓",
    negative: "↑",
    neutral: "",
  };

  // Variant-specific rendering
  if (variant === "highlight") {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 md:p-6 shadow-lg">
        <div className="text-center">
          <div className="text-sm md:text-base text-gray-400 font-medium uppercase tracking-wide mb-2">
            {title}
          </div>
          <div
            className={`font-extrabold text-2xl md:text-3xl lg:text-4xl mb-2 select-all ${
              trendStyles[trend]
            }`}
          >
            {value}
            {trendIcons[trend] && (
              <span className="ml-2 text-xl md:text-2xl">
                {trendIcons[trend]}
              </span>
            )}
          </div>
          {subtitle && (
            <div className="text-sm md:text-base text-gray-200 font-medium mt-2">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "comparison") {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 md:p-6 shadow-lg">
        <div className="text-sm md:text-base font-semibold text-white mb-4">
          {title}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-400 mb-2">
              {beforeLabel}
            </div>
            <div className="text-lg md:text-xl font-semibold text-gray-300">
              {beforeValue || "-"}
            </div>
          </div>
          <div className="text-center border-l border-gray-700 pl-4">
            <div className="text-xs md:text-sm text-gray-400 mb-2">
              {afterLabel}
            </div>
            <div
              className={`text-lg md:text-xl font-semibold ${
                trendStyles[trend]
              }`}
            >
              {afterValue || "-"}
              {trendIcons[trend] && (
                <span className="ml-1 text-base">{trendIcons[trend]}</span>
              )}
            </div>
          </div>
        </div>
        {subtitle && (
          <div className="mt-4 text-xs md:text-sm text-gray-400 text-center">
            {subtitle}
          </div>
        )}
      </div>
    );
  }

  // Normal variant
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 md:p-6 shadow-lg">
      <div className="flex flex-col">
        <div className="text-xs md:text-sm text-gray-400 font-medium mb-2">
          {title}
        </div>
        <div
          className={`text-lg md:text-xl font-semibold ${
            trendStyles[trend]
          }`}
        >
          {value}
          {trendIcons[trend] && (
            <span className="ml-2 text-base">{trendIcons[trend]}</span>
          )}
        </div>
        {subtitle && (
          <div className="mt-2 text-xs md:text-sm text-gray-300">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
