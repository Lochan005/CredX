"use client";

import React from "react";

interface LoanInputsProps {
  principal: number;
  setPrincipal: (value: number) => void;
  interestRate: number;
  setInterestRate: (value: number) => void;
  tenure: number;
  setTenure: (value: number) => void;
  monthsPaid: number;
  setMonthsPaid: (value: number) => void;
  showValidation?: boolean;
}

// Validation constants
const VALIDATION_RULES = {
  principal: { min: 50000, max: 100000000 },
  interestRate: { min: 1, max: 30 },
  tenureMonths: { min: 12, max: 360 },
} as const;

// Format helper for range display
function formatINR(value: number) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function formatRange(min: number, max: number, suffix: string = "") {
  return `Range: ${min.toLocaleString("en-IN")}${suffix} - ${max.toLocaleString("en-IN")}${suffix}`;
}

export default function LoanInputs({
  principal,
  setPrincipal,
  interestRate,
  setInterestRate,
  tenure,
  setTenure,
  monthsPaid,
  setMonthsPaid,
  showValidation = true,
}: LoanInputsProps) {
  // Validation
  const errors = {
    principal:
      showValidation && principal < VALIDATION_RULES.principal.min
        ? `Principal must be at least ${formatINR(VALIDATION_RULES.principal.min)}`
        : showValidation && principal > VALIDATION_RULES.principal.max
        ? `Principal cannot exceed ${formatINR(VALIDATION_RULES.principal.max)}`
        : undefined,
    interestRate:
      showValidation && interestRate < VALIDATION_RULES.interestRate.min
        ? `Interest rate must be at least ${VALIDATION_RULES.interestRate.min}%`
        : showValidation && interestRate > VALIDATION_RULES.interestRate.max
        ? `Interest rate cannot exceed ${VALIDATION_RULES.interestRate.max}%`
        : undefined,
    tenure:
      showValidation && tenure < VALIDATION_RULES.tenureMonths.min
        ? `Tenure must be at least ${VALIDATION_RULES.tenureMonths.min} months`
        : showValidation && tenure > VALIDATION_RULES.tenureMonths.max
        ? `Tenure cannot exceed ${VALIDATION_RULES.tenureMonths.max} months`
        : undefined,
    monthsPaid:
      showValidation && monthsPaid < 0
        ? "Months paid cannot be negative"
        : showValidation && monthsPaid >= tenure
        ? `Months paid must be less than tenure (max ${tenure - 1})`
        : undefined,
  };

  return (
    <div className="space-y-4">
      {/* Original Principal */}
      <div>
        <label
          htmlFor="principal"
          className="block text-base font-medium mb-1 text-gray-200"
        >
          Original Principal
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">
            ₹
          </span>
          <input
            inputMode="numeric"
            type="text"
            name="principal"
            id="principal"
            className={`w-full rounded-lg pl-10 pr-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
              errors.principal
                ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
                : "focus:ring-green-600 border-2 border-transparent"
            }`}
            value={principal === 0 ? "" : principal.toLocaleString("en-IN")}
            onChange={(e) => {
              const num = Number(e.target.value.replace(/[^0-9]/g, ""));
              setPrincipal(Number.isNaN(num) ? 0 : num);
            }}
          />
        </div>
        {showValidation && !errors.principal && (
          <p className="mt-1 text-xs text-gray-500">
            {formatRange(
              VALIDATION_RULES.principal.min,
              VALIDATION_RULES.principal.max
            )}
          </p>
        )}
        {errors.principal && (
          <p className="mt-1 text-xs text-red-400">{errors.principal}</p>
        )}
      </div>

      {/* Annual Interest Rate */}
      <div>
        <label
          htmlFor="interestRate"
          className="block text-base font-medium mb-1 text-gray-200"
        >
          Annual Interest Rate
        </label>
        <div className="relative">
          <input
            inputMode="decimal"
            type="number"
            step="0.01"
            name="interestRate"
            id="interestRate"
            className={`w-full rounded-lg pr-10 pl-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
              errors.interestRate
                ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
                : "focus:ring-green-600 border-2 border-transparent"
            }`}
            min={VALIDATION_RULES.interestRate.min}
            max={VALIDATION_RULES.interestRate.max}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">
            %
          </span>
        </div>
        {showValidation && !errors.interestRate && (
          <p className="mt-1 text-xs text-gray-500">
            {formatRange(
              VALIDATION_RULES.interestRate.min,
              VALIDATION_RULES.interestRate.max,
              "%"
            )}
          </p>
        )}
        {errors.interestRate && (
          <p className="mt-1 text-xs text-red-400">{errors.interestRate}</p>
        )}
      </div>

      {/* Original Tenure */}
      <div>
        <label
          htmlFor="tenure"
          className="block text-base font-medium mb-1 text-gray-200"
        >
          Original Tenure
        </label>
        <div className="relative">
          <input
            inputMode="numeric"
            type="number"
            name="tenure"
            id="tenure"
            className={`w-full rounded-lg pr-16 pl-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
              errors.tenure
                ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
                : "focus:ring-green-600 border-2 border-transparent"
            }`}
            min={VALIDATION_RULES.tenureMonths.min}
            max={VALIDATION_RULES.tenureMonths.max}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
            months
          </span>
        </div>
        {showValidation && !errors.tenure && (
          <p className="mt-1 text-xs text-gray-500">
            {formatRange(
              VALIDATION_RULES.tenureMonths.min,
              VALIDATION_RULES.tenureMonths.max,
              " months"
            )}
          </p>
        )}
        {errors.tenure && (
          <p className="mt-1 text-xs text-red-400">{errors.tenure}</p>
        )}
      </div>

      {/* Months Already Paid */}
      <div>
        <label
          htmlFor="monthsPaid"
          className="block text-base font-medium mb-1 text-gray-200"
        >
          Months Already Paid
        </label>
        <div className="relative">
          <input
            inputMode="numeric"
            type="number"
            name="monthsPaid"
            id="monthsPaid"
            className={`w-full rounded-lg pr-16 pl-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
              errors.monthsPaid
                ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
                : "focus:ring-green-600 border-2 border-transparent"
            }`}
            min={0}
            max={tenure > 0 ? tenure - 1 : 0}
            value={monthsPaid}
            onChange={(e) => setMonthsPaid(Number(e.target.value))}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
            months
          </span>
        </div>
        {showValidation && !errors.monthsPaid && (
          <p className="mt-1 text-xs text-gray-500">
            Range: 0 - {tenure > 0 ? tenure - 1 : 0} months
          </p>
        )}
        {errors.monthsPaid && (
          <p className="mt-1 text-xs text-red-400">{errors.monthsPaid}</p>
        )}
      </div>
    </div>
  );
}
