"use client";

import React, { useState, useMemo } from "react";
import { calculatePrepaymentScenario, calculatePrepaymentScenario1B } from "@lib/calculator";

// Validation constants
const VALIDATION_RULES = {
  principal: { min: 50000, max: 100000000 },
  interestRate: { min: 1, max: 30 },
  tenureMonths: { min: 12, max: 360 },
  monthsPaid: { min: 0 }, // max depends on tenure
  prepayment: { min: 0 }, // max depends on outstanding principal
} as const;

// Validation types
type ValidationErrors = {
  principal?: string;
  interestRate?: string;
  tenureMonths?: string;
  monthsPaid?: string;
  prepayment?: string;
};

// Format helpers
function formatINR(value: number) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function formatMonthsYears(months: number) {
  if (months < 0) return "-";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} month${remMonths !== 1 ? "s" : ""}`;
  if (remMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""} ${remMonths} month${remMonths !== 1 ? "s" : ""}`;
}

function MoneyInput({
  label,
  id,
  value,
  onChange,
  min = 0,
  max,
  error,
  helperText,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  error?: string;
  helperText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium mb-1 text-gray-200">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">₹</span>
        <input
          inputMode="numeric"
          type="text"
          name={id}
          id={id}
          className={`w-full rounded-lg pl-10 pr-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
            error
              ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
              : "focus:ring-green-600 border-2 border-transparent"
          }`}
          value={value === 0 ? "" : value.toLocaleString("en-IN")}
          min={min}
          max={max}
          onChange={e => {
            const num = Number(e.target.value.replace(/[^0-9]/g, ""));
            onChange(Number.isNaN(num) ? 0 : num);
          }}
        />
      </div>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

function RateInput({
  label,
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  error,
  helperText,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  error?: string;
  helperText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium mb-1 text-gray-200">
        {label}
      </label>
      <div className="relative">
        <input
          inputMode="decimal"
          type="number"
          step="0.01"
          name={id}
          id={id}
          className={`w-full rounded-lg pr-10 pl-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
            error
              ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
              : "focus:ring-green-600 border-2 border-transparent"
          }`}
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">%</span>
      </div>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

function MonthsInput({
  label,
  id,
  value,
  onChange,
  min = 0,
  max = 600,
  error,
  helperText,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  error?: string;
  helperText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium mb-1 text-gray-200">
        {label}
      </label>
      <div className="relative">
        <input
          inputMode="numeric"
          type="number"
          name={id}
          id={id}
          className={`w-full rounded-lg pr-16 pl-4 py-3 bg-gray-900 text-white text-lg font-medium focus:outline-none focus:ring-2 ${
            error
              ? "border-2 border-red-500 focus:ring-red-500 focus:border-red-500"
              : "focus:ring-green-600 border-2 border-transparent"
          }`}
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">months</span>
      </div>
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-2xl w-full mx-auto my-8">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center p-4 bg-gray-800 rounded-md text-lg font-medium text-gray-100 focus:outline-none hover:bg-gray-700 transition mb-2"
        aria-expanded={open}
        aria-controls="how-it-works-content"
      >
        <span>How it works</span>
        <svg className={`w-6 h-6 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div
        id="how-it-works-content"
        className={`overflow-hidden transition-all duration-300 bg-gray-800 rounded-b-md ${open ? "max-h-[1000px] p-4" : "max-h-0 p-0"}`}
        aria-hidden={!open}
      >
        <div className="prose prose-invert text-gray-200 text-base">
          <h4>Loan EMI Formula</h4>
          <p>
            <span className="font-mono">EMI = P × r × (1+r)<sup>N</sup> / [(1+r)<sup>N</sup> - 1]</span>
          </p>
          <ul>
            <li><b>P</b> = Principal amount</li>
            <li><b>r</b> = Monthly interest rate = (Annual Rate / 12 / 100)</li>
            <li><b>N</b> = Total number of months</li>
          </ul>
          <h4>Prepayment Impact</h4>
          <ul>
            <li>
              Outstanding after <b>k</b> months:
              <div className="font-mono mt-1">O = P × [(1+r)<sup>N</sup> - (1+r)<sup>k</sup>] / [(1+r)<sup>N</sup> - 1]</div>
            </li>
            <li>
              New tenure after prepay (at same EMI):
              <div className="font-mono mt-1">
                N' = ln(EMI / (EMI - P'<sub>after</sub> × r)) / ln(1 + r)
              </div>
              <div className="text-xs text-gray-400 mt-1">(where P'<sub>after</sub> = Outstanding − Prepayment)</div>
            </li>
            <li>
              Interest saved: <span className="font-mono block mt-1">= (Old tenure × EMI) − (New tenure × EMI + Prepayment)</span>
            </li>
          </ul>
          <p>
            <span className="italic text-gray-400">All calculations are performed in your browser. No data leaves your device.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // Inputs state
  const [principal, setPrincipal] = useState(5000000);
  const [interest, setInterest] = useState(9);
  const [tenureMonths, setTenureMonths] = useState(240);
  const [monthsPaid, setMonthsPaid] = useState(60);
  const [prepay, setPrepay] = useState(500000);
  const [scenario, setScenario] = useState<"reduceTenure" | "reduceEMI">("reduceTenure");

  // Calculate result with clamped values for display (will be validated separately)
  const result = useMemo(() => {
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    const safePrepay = Math.max(0, prepay);
    
    if (scenario === "reduceEMI") {
      return calculatePrepaymentScenario1B(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        safePrepay
      );
    } else {
      return calculatePrepaymentScenario(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        safePrepay
      );
    }
  }, [principal, interest, tenureMonths, monthsPaid, prepay, scenario]);

  // Validation function
  const validate = useMemo((): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate Principal
    if (principal < VALIDATION_RULES.principal.min) {
      errors.principal = `Principal must be at least ${formatINR(VALIDATION_RULES.principal.min)}`;
    } else if (principal > VALIDATION_RULES.principal.max) {
      errors.principal = `Principal cannot exceed ${formatINR(VALIDATION_RULES.principal.max)}`;
    }

    // Validate Interest Rate
    if (interest < VALIDATION_RULES.interestRate.min) {
      errors.interestRate = `Interest rate must be at least ${VALIDATION_RULES.interestRate.min}%`;
    } else if (interest > VALIDATION_RULES.interestRate.max) {
      errors.interestRate = `Interest rate cannot exceed ${VALIDATION_RULES.interestRate.max}%`;
    }

    // Validate Tenure
    if (tenureMonths < VALIDATION_RULES.tenureMonths.min) {
      errors.tenureMonths = `Tenure must be at least ${VALIDATION_RULES.tenureMonths.min} months`;
    } else if (tenureMonths > VALIDATION_RULES.tenureMonths.max) {
      errors.tenureMonths = `Tenure cannot exceed ${VALIDATION_RULES.tenureMonths.max} months`;
    }

    // Validate Months Paid
    if (monthsPaid < VALIDATION_RULES.monthsPaid.min) {
      errors.monthsPaid = `Months paid cannot be negative`;
    } else if (tenureMonths >= VALIDATION_RULES.tenureMonths.min && monthsPaid >= tenureMonths) {
      errors.monthsPaid = `Months paid must be less than original tenure (max ${tenureMonths - 1})`;
    }

    // Validate Prepayment (needs outstanding principal - only if other fields are valid)
    if (prepay < VALIDATION_RULES.prepayment.min) {
      errors.prepayment = `Prepayment cannot be negative`;
    } else if (
      // Only validate against outstanding if principal, interest, tenure, and monthsPaid are valid
      !errors.principal &&
      !errors.interestRate &&
      !errors.tenureMonths &&
      !errors.monthsPaid &&
      tenureMonths >= VALIDATION_RULES.tenureMonths.min &&
      monthsPaid < tenureMonths
    ) {
      const outstandingPrincipal = result.outstandingPrincipal;
      if (outstandingPrincipal > 0 && prepay >= outstandingPrincipal) {
        errors.prepayment = `Prepayment cannot exceed outstanding principal (max ${formatINR(Math.max(0, outstandingPrincipal - 1))})`;
      }
    }

    return errors;
  }, [principal, interest, tenureMonths, monthsPaid, prepay, result.outstandingPrincipal, scenario]);

  // Check if validation passes
  const isValid = Object.keys(validate).length === 0;

  // Helper function to format range for helper text
  const formatRange = (min: number, max: number, suffix = "") => {
    return `Range: ${min.toLocaleString("en-IN")}${suffix} - ${max.toLocaleString("en-IN")}${suffix}`;
  };

  // For comparison table
  const totalWithout = result.totalCostWithoutPrepay;
  const totalWith = result.totalCostWithPrepay;
  
  // Type guards for scenario-specific results
  const isReduceTenure = scenario === "reduceTenure";
  const reduceTenureResult = isReduceTenure ? result as {
    emi: number;
    outstandingPrincipal: number;
    remainingTenure: number;
    newTenureAfterPrepay: number;
    interestSaved: number;
    tenureReduced: number;
    totalCostWithoutPrepay: number;
    totalCostWithPrepay: number;
  } : null;
  
  const reduceEMIResult = !isReduceTenure ? result as {
    emi: number;
    newEmi: number;
    emiReduction: number;
    outstandingPrincipal: number;
    remainingTenure: number;
    interestSaved: number;
    totalCostWithoutPrepay: number;
    totalCostWithPrepay: number;
    monthlyBenefit: number;
  } : null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center px-2 py-4 md:py-8">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto text-center mb-10 select-none">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-sm tracking-tight mb-2">
          <span className="text-green-400">Credx</span>
        </h1>
        <div className="text-2xl md:text-3xl font-medium text-gray-200 tracking-tight mb-1">
          Smart Loan Prepayment Calculator
        </div>
      </div>

      {/* Main Cards */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 mb-8">
        {/* Left Card: Inputs */}
        <div className="bg-gray-800 rounded-2xl shadow-lg flex-1 p-6 flex flex-col justify-between min-w-[0]">
          <h2 className="text-xl font-semibold text-white mb-4">Loan Details</h2>
          
          {/* Scenario Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Prepayment Option</label>
            <div className="flex gap-2 bg-gray-900 rounded-full p-1">
              <button
                type="button"
                onClick={() => setScenario("reduceTenure")}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  scenario === "reduceTenure"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Reduce Tenure
              </button>
              <button
                type="button"
                onClick={() => setScenario("reduceEMI")}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  scenario === "reduceEMI"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Reduce EMI
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {scenario === "reduceTenure"
                ? "Keep EMI same, pay off faster"
                : "Keep tenure same, lower monthly payment"}
            </p>
          </div>

          <form
            className="flex flex-col gap-6"
            onSubmit={e => e.preventDefault()}
            autoComplete="off"
          >
            <MoneyInput
              label="Original Principal"
              id="principal"
              value={principal}
              onChange={(val) => {
                const clamped = Math.max(0, Math.min(val, VALIDATION_RULES.principal.max));
                setPrincipal(clamped);
              }}
              error={validate.principal}
              helperText={formatRange(VALIDATION_RULES.principal.min, VALIDATION_RULES.principal.max)}
            />

            <RateInput
              label="Annual Interest Rate"
              id="interest"
              value={interest}
              onChange={(val) => {
                const clamped = Math.max(0, Math.min(val, VALIDATION_RULES.interestRate.max));
                setInterest(clamped);
              }}
              min={0}
              max={VALIDATION_RULES.interestRate.max}
              error={validate.interestRate}
              helperText={formatRange(VALIDATION_RULES.interestRate.min, VALIDATION_RULES.interestRate.max, "%")}
            />

            <MonthsInput
              label="Original Tenure"
              id="tenureMonths"
              value={tenureMonths}
              onChange={(val) => {
                const clamped = Math.max(VALIDATION_RULES.tenureMonths.min, Math.min(val, VALIDATION_RULES.tenureMonths.max));
                setTenureMonths(clamped);
                // Adjust monthsPaid if it exceeds new tenure
                if (monthsPaid >= clamped) {
                  setMonthsPaid(Math.max(0, clamped - 1));
                }
              }}
              min={VALIDATION_RULES.tenureMonths.min}
              max={VALIDATION_RULES.tenureMonths.max}
              error={validate.tenureMonths}
              helperText={formatRange(VALIDATION_RULES.tenureMonths.min, VALIDATION_RULES.tenureMonths.max, " months")}
            />

            <MonthsInput
              label="Months Already Paid"
              id="monthsPaid"
              value={monthsPaid}
              onChange={(val) => {
                const maxAllowed = tenureMonths >= VALIDATION_RULES.tenureMonths.min ? tenureMonths - 1 : tenureMonths;
                const clamped = Math.max(0, Math.min(val, maxAllowed));
                setMonthsPaid(clamped);
              }}
              min={0}
              max={tenureMonths >= VALIDATION_RULES.tenureMonths.min ? tenureMonths - 1 : tenureMonths}
              error={validate.monthsPaid}
              helperText={`Range: 0 - ${tenureMonths >= VALIDATION_RULES.tenureMonths.min ? (tenureMonths - 1).toLocaleString("en-IN") : "N/A"} months`}
            />

            <MoneyInput
              label="Prepayment Amount"
              id="prepay"
              value={prepay}
              onChange={(val) => {
                // Clamp to outstanding principal if other inputs are valid enough to calculate it
                const canCalculateOutstanding = 
                  principal >= VALIDATION_RULES.principal.min &&
                  principal <= VALIDATION_RULES.principal.max &&
                  interest >= VALIDATION_RULES.interestRate.min &&
                  interest <= VALIDATION_RULES.interestRate.max &&
                  tenureMonths >= VALIDATION_RULES.tenureMonths.min &&
                  tenureMonths <= VALIDATION_RULES.tenureMonths.max &&
                  monthsPaid >= 0 &&
                  monthsPaid < tenureMonths &&
                  result.outstandingPrincipal > 0;
                
                const maxAllowed = canCalculateOutstanding
                  ? Math.max(0, result.outstandingPrincipal - 1)
                  : Number.MAX_SAFE_INTEGER; // Don't clamp if we can't calculate yet
                const clamped = Math.max(0, Math.min(val, maxAllowed));
                setPrepay(clamped);
              }}
              error={validate.prepayment}
              helperText={
                !validate.principal &&
                !validate.interestRate &&
                !validate.tenureMonths &&
                !validate.monthsPaid &&
                result.outstandingPrincipal > 0
                  ? `Range: ₹0 - ${formatINR(Math.max(0, result.outstandingPrincipal - 1))}`
                  : "Enter valid loan details first"
              }
            />
          </form>
        </div>

        {/* Right Card: Results */}
        <div className={`bg-gray-800 rounded-2xl shadow-lg flex-1 p-6 min-w-[0] ${!isValid ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="text-xl font-semibold text-white mb-4">
            Prepayment Impact
            {!isValid && (
              <span className="ml-2 text-sm font-normal text-red-400">Invalid Inputs</span>
            )}
          </h2>
          {/* Interest Saved Prominently */}
          <div className="mb-6 text-center">
            <div className="text-base text-gray-400 font-medium uppercase tracking-wide mb-1">
              Interest Saved
            </div>
            <div className="font-extrabold text-3xl md:text-4xl text-green-400 mb-1 select-all">
              {result.interestSaved > 0 ? formatINR(result.interestSaved) : "-"}
            </div>
            {isReduceTenure && reduceTenureResult?.tenureReduced && reduceTenureResult.tenureReduced > 0 && (
              <div className="mt-2 text-base text-gray-200 font-medium">
                Tenure Reduced:&nbsp;
                <span className="text-green-300 font-semibold">
                  {reduceTenureResult.tenureReduced} months
                </span>
                &nbsp;(
                <span className="text-green-300">
                  {formatMonthsYears(reduceTenureResult.tenureReduced)}
                </span>
                )
              </div>
            )}
            {!isReduceTenure && reduceEMIResult?.monthlyBenefit && reduceEMIResult.monthlyBenefit > 0 && (
              <div className="mt-2 text-base text-gray-200 font-medium">
                You save&nbsp;
                <span className="text-green-300 font-semibold text-lg">
                  {formatINR(reduceEMIResult.monthlyBenefit)}
                </span>
                &nbsp;every month
              </div>
            )}
          </div>

          <div className="mb-5">
            {/* Comparison Table */}
            <div className="w-full mb-4 rounded-lg overflow-hidden border border-gray-700">
              <div className="grid grid-cols-3 bg-gray-700 text-gray-200 text-center text-sm">
                <div className="p-2 font-semibold text-left pl-4"> </div>
                <div className="p-2 font-semibold">Without Prepayment</div>
                <div className="p-2 font-semibold">With Prepayment</div>
              </div>
              <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base ">
                <div className="p-2 text-left pl-4">Total Cost</div>
                <div className="p-2 font-medium text-gray-400">{formatINR(totalWithout)}</div>
                <div className="p-2 font-medium text-green-400">{formatINR(totalWith)}</div>
              </div>
              {isReduceTenure && reduceTenureResult ? (
                <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base border-t border-gray-700">
                  <div className="p-2 text-left pl-4">Tenure</div>
                  <div className="p-2 font-medium text-gray-400">
                    {reduceTenureResult.remainingTenure} months
                  </div>
                  <div className="p-2 font-medium text-green-400">
                    {reduceTenureResult.newTenureAfterPrepay} months
                  </div>
                </div>
              ) : reduceEMIResult ? (
                <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base border-t border-gray-700">
                  <div className="p-2 text-left pl-4">Monthly EMI</div>
                  <div className="p-2 font-medium text-gray-400">
                    {formatINR(reduceEMIResult.emi)}
                  </div>
                  <div className="p-2 font-medium text-green-400">
                    {formatINR(reduceEMIResult.newEmi)}
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base border-t border-gray-700">
                <div className="p-2 text-left pl-4">Interest Paid</div>
                <div className="p-2 font-medium text-gray-400">
                  {formatINR(totalWithout - result.outstandingPrincipal)}
                </div>
                <div className="p-2 font-medium text-green-400">
                  {formatINR(totalWith - result.outstandingPrincipal)}
                </div>
              </div>
            </div>
          </div>

          {/* Other Results */}
          <div className="grid grid-cols-1 gap-y-4 text-base mb-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="">{isReduceTenure ? "Current EMI" : "Original EMI"}</span>
              <span className="font-semibold text-white">{formatINR(result.emi)}</span>
            </div>
            {!isReduceTenure && reduceEMIResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>New EMI</span>
                <span className="font-semibold text-green-400">{formatINR(reduceEMIResult.newEmi)}</span>
              </div>
            )}
            {!isReduceTenure && reduceEMIResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>EMI Reduction (Monthly Savings)</span>
                <span className="font-semibold text-green-400">{formatINR(reduceEMIResult.emiReduction)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-400">
              <span>Outstanding Principal</span>
              <span className="font-semibold text-white">{formatINR(result.outstandingPrincipal)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>Prepayment Amount</span>
              <span className="font-semibold text-white">{formatINR(prepay)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>Remaining Tenure</span>
              <span className="font-semibold text-white">
                {result.remainingTenure} months ({formatMonthsYears(result.remainingTenure)})
              </span>
            </div>
            {isReduceTenure && reduceTenureResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>New Tenure After Prepayment</span>
                <span className="font-semibold text-white">
                  {reduceTenureResult.newTenureAfterPrepay} months ({formatMonthsYears(reduceTenureResult.newTenureAfterPrepay)})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Footer */}
      <footer className="w-full mt-8 mb-2 flex flex-col items-center">
        <div className="text-center text-xs text-gray-500 mb-2">
          Your data never leaves your device. All calculations happen locally.
        </div>
        <div className="text-center text-xs text-gray-600">
          Made with <span className="text-green-400">React</span> & TailwindCSS
        </div>
      </footer>
    </div>
  );
}
