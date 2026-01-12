"use client";

import React, { useState, useMemo } from "react";
import { calculatePrepaymentScenario, calculatePrepaymentScenario1B, calculateScenario2, calculateScenario3 } from "@lib/calculator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Validation constants
const VALIDATION_RULES = {
  principal: { min: 50000, max: 100000000 },
  interestRate: { min: 1, max: 30 },
  tenureMonths: { min: 12, max: 360 },
  monthsPaid: { min: 0 }, // max depends on tenure
  prepayment: { min: 0 }, // max depends on outstanding principal
  monthlyExtra: { min: 500, max: 500000 },
  newRate: { min: 1, max: 30 },
  refinanceCost: { min: 0, max: 500000 },
  newTenure: { min: 12, max: 360 },
} as const;

// Validation types
type ValidationErrors = {
  principal?: string;
  interestRate?: string;
  tenureMonths?: string;
  monthsPaid?: string;
  prepayment?: string;
  monthlyExtra?: string;
  newRate?: string;
  refinanceCost?: string;
  newTenure?: string;
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
  const [monthlyExtra, setMonthlyExtra] = useState(10000);
  const [newRate, setNewRate] = useState(7.5);
  const [refinanceCost, setRefinanceCost] = useState(50000);
  const [newTenure, setNewTenure] = useState(180); // Will be calculated based on remaining tenure
  const [scenario, setScenario] = useState<"reduceTenure" | "reduceEMI" | "monthlyExtra" | "refinance">("reduceTenure");
  const [expandedCard, setExpandedCard] = useState<'stay' | 'A' | 'B' | 'C' | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculate remaining tenure for newTenure default
  const remainingTenureForDefault = tenureMonths - monthsPaid;
  
  // Calculate result with clamped values for display (will be validated separately)
  const result = useMemo(() => {
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    const safePrepay = Math.max(0, prepay);
    const safeMonthlyExtra = Math.max(0, monthlyExtra);
    const safeNewTenure = Math.max(VALIDATION_RULES.newTenure.min, Math.min(newTenure, VALIDATION_RULES.newTenure.max));
    const safeRefinanceCost = Math.max(0, refinanceCost);
    
    if (scenario === "reduceEMI") {
      return calculatePrepaymentScenario1B(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        safePrepay
      );
    } else if (scenario === "monthlyExtra") {
      return calculateScenario2(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        safeMonthlyExtra
      );
    } else if (scenario === "refinance") {
      return calculateScenario3(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        safePrepay,
        newRate,
        safeRefinanceCost,
        safeNewTenure
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
  }, [principal, interest, tenureMonths, monthsPaid, prepay, monthlyExtra, newRate, refinanceCost, newTenure, scenario]);

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

    // Validate Prepayment (only for scenarios 1A, 1B, and 3)
    if (scenario !== "monthlyExtra") {
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
    }

    // Validate Monthly Extra Payment (only for scenario 2)
    if (scenario === "monthlyExtra") {
      if (monthlyExtra < VALIDATION_RULES.monthlyExtra.min) {
        errors.monthlyExtra = `Monthly extra payment must be at least ${formatINR(VALIDATION_RULES.monthlyExtra.min)}`;
      } else if (monthlyExtra > VALIDATION_RULES.monthlyExtra.max) {
        errors.monthlyExtra = `Monthly extra payment cannot exceed ${formatINR(VALIDATION_RULES.monthlyExtra.max)}`;
      }
    }

    // Validate Refinance inputs (only for scenario 3)
    if (scenario === "refinance") {
      // Validate New Interest Rate
      if (newRate < VALIDATION_RULES.newRate.min) {
        errors.newRate = `New interest rate must be at least ${VALIDATION_RULES.newRate.min}%`;
      } else if (newRate > VALIDATION_RULES.newRate.max) {
        errors.newRate = `New interest rate cannot exceed ${VALIDATION_RULES.newRate.max}%`;
      } else if (newRate >= interest) {
        // Warning: should be less than current rate (but not blocking)
        errors.newRate = `Warning: New rate should be less than current rate (${interest}%) to benefit from refinancing`;
      }
      
      // Validate Refinance Cost
      if (refinanceCost < VALIDATION_RULES.refinanceCost.min) {
        errors.refinanceCost = `Refinance cost cannot be negative`;
      } else if (refinanceCost > VALIDATION_RULES.refinanceCost.max) {
        errors.refinanceCost = `Refinance cost cannot exceed ${formatINR(VALIDATION_RULES.refinanceCost.max)}`;
      }
      
      // Validate New Loan Tenure
      if (newTenure < VALIDATION_RULES.newTenure.min) {
        errors.newTenure = `New loan tenure must be at least ${VALIDATION_RULES.newTenure.min} months`;
      } else if (newTenure > VALIDATION_RULES.newTenure.max) {
        errors.newTenure = `New loan tenure cannot exceed ${VALIDATION_RULES.newTenure.max} months`;
      }
    }

    return errors;
  }, [principal, interest, tenureMonths, monthsPaid, prepay, monthlyExtra, newRate, refinanceCost, newTenure, result.outstandingPrincipal, scenario]);

  // Check if validation passes
  const isValid = Object.keys(validate).length === 0;

  // Helper function to format range for helper text
  const formatRange = (min: number, max: number, suffix = "") => {
    return `Range: ${min.toLocaleString("en-IN")}${suffix} - ${max.toLocaleString("en-IN")}${suffix}`;
  };
  
  // Type guards for scenario-specific results
  const isReduceTenure = scenario === "reduceTenure";
  const isReduceEMI = scenario === "reduceEMI";
  const isMonthlyExtra = scenario === "monthlyExtra";
  const isRefinance = scenario === "refinance";
  
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
  
  const reduceEMIResult = isReduceEMI ? result as {
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
  
  const monthlyExtraResult = isMonthlyExtra ? result as {
    emi: number;
    effectiveMonthlyPayment: number;
    outstandingPrincipal: number;
    remainingTenure: number;
    newTenure: number;
    tenureReduced: number;
    interestSaved: number;
    totalExtraPaid: number;
    totalCostWithoutExtra: number;
    totalCostWithExtra: number;
  } : null;
  
  const refinanceResult = isRefinance ? result as {
    emi: number;
    outstandingPrincipal: number;
    remainingTenure: number;
    stay: { totalCost: number; totalInterest: number; monthlyPayment: number; tenure: number; hasBenefit: boolean; status?: string };
    optionA: { totalCost: number; totalInterest: number; monthlyPayment: number; tenure: number; hasBenefit: boolean; status?: string };
    optionB: { totalCost: number; totalInterest: number; monthlyPayment: number; tenure: number; hasBenefit: boolean; status?: string };
    optionC: { totalCost: number; totalInterest: number; monthlyPayment: number; tenure: number; hasBenefit: boolean; status?: string };
    bestOption: 'stay' | 'A' | 'B' | 'C';
    maxSavings: number;
  } : null;

  // For comparison table - handle different property names for different scenarios
  const totalWithout = isMonthlyExtra && monthlyExtraResult 
    ? monthlyExtraResult.totalCostWithoutExtra 
    : 'totalCostWithoutPrepay' in result 
      ? result.totalCostWithoutPrepay 
      : 0;
  const totalWith = isMonthlyExtra && monthlyExtraResult 
    ? monthlyExtraResult.totalCostWithExtra 
    : 'totalCostWithPrepay' in result 
      ? result.totalCostWithPrepay 
      : 0;

  // PDF Generation function
  const generatePDF = async () => {
    if (!isValid) return;
    
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;

      // Set font explicitly to avoid letter-spacing issues
      doc.setFont("helvetica", "normal");

      // Currency formatter for PDF (uses Rs. instead of ₹)
      const formatCurrencyPDF = (num: number) => {
        if (!Number.isFinite(num)) return "Rs. -";
        return "Rs. " + num.toLocaleString("en-IN", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        });
      };

      // Header
      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94);
      doc.setFont("helvetica", "bold");
      doc.text("Credx - Loan Prepayment Report", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      doc.text("Generated on: " + currentDate, margin, y);
      y += 15;

      // Loan Details Section - Using Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Loan Details", margin, y);
      y += 8;

      const loanDetailsData = [
        ["Original Principal", formatCurrencyPDF(principal)],
        ["Interest Rate", interest + "% per annum"],
        ["Original Tenure", tenureMonths + " months (" + formatMonthsYears(tenureMonths) + ")"],
        ["Months Already Paid", monthsPaid + " months"],
      ];

      if (scenario !== "monthlyExtra") {
        loanDetailsData.push(["Prepayment Amount", formatCurrencyPDF(prepay)]);
      }
      if (scenario === "monthlyExtra") {
        loanDetailsData.push(["Monthly Extra Payment", formatCurrencyPDF(monthlyExtra)]);
      }
      if (scenario === "refinance") {
        loanDetailsData.push(["New Interest Rate", newRate + "% per annum"]);
        loanDetailsData.push(["Refinance Cost", formatCurrencyPDF(refinanceCost)]);
        loanDetailsData.push(["New Loan Tenure", newTenure + " months"]);
      }

      autoTable(doc, {
        startY: y,
        head: [["Parameter", "Value"]],
        body: loanDetailsData,
        theme: "striped",
        headStyles: {
          fillColor: [34, 197, 94], // green-500
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        bodyStyles: {
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: "bold" },
          1: { cellWidth: "auto" },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Results Section - Using Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Results", margin, y);
      y += 8;

      let resultsData: string[][] = [];
      
      if (isReduceTenure && reduceTenureResult) {
        resultsData = [
          ["Original EMI", formatCurrencyPDF(result.emi)],
          ["Outstanding Principal", formatCurrencyPDF(result.outstandingPrincipal)],
          ["Remaining Tenure", result.remainingTenure + " months"],
          ["New Tenure After Prepayment", reduceTenureResult.newTenureAfterPrepay + " months"],
          ["Tenure Reduced", reduceTenureResult.tenureReduced + " months"],
          ["Interest Saved", formatCurrencyPDF(reduceTenureResult.interestSaved)],
          ["Total Cost Without Prepayment", formatCurrencyPDF(reduceTenureResult.totalCostWithoutPrepay)],
          ["Total Cost With Prepayment", formatCurrencyPDF(reduceTenureResult.totalCostWithPrepay)],
        ];
      } else if (isReduceEMI && reduceEMIResult) {
        resultsData = [
          ["Original EMI", formatCurrencyPDF(result.emi)],
          ["New EMI", formatCurrencyPDF(reduceEMIResult.newEmi)],
          ["EMI Reduction", formatCurrencyPDF(reduceEMIResult.emiReduction) + " per month"],
          ["Outstanding Principal", formatCurrencyPDF(result.outstandingPrincipal)],
          ["Remaining Tenure", result.remainingTenure + " months"],
          ["Interest Saved", formatCurrencyPDF(reduceEMIResult.interestSaved)],
          ["Total Cost Without Prepayment", formatCurrencyPDF(reduceEMIResult.totalCostWithoutPrepay)],
          ["Total Cost With Prepayment", formatCurrencyPDF(reduceEMIResult.totalCostWithPrepay)],
        ];
      } else if (isMonthlyExtra && monthlyExtraResult) {
        resultsData = [
          ["Original EMI", formatCurrencyPDF(result.emi)],
          ["Effective Monthly Payment", formatCurrencyPDF(monthlyExtraResult.effectiveMonthlyPayment)],
          ["Outstanding Principal", formatCurrencyPDF(result.outstandingPrincipal)],
          ["New Tenure", monthlyExtraResult.newTenure + " months"],
          ["Tenure Reduced", monthlyExtraResult.tenureReduced + " months"],
          ["Interest Saved", formatCurrencyPDF(monthlyExtraResult.interestSaved)],
          ["Total Extra Paid", formatCurrencyPDF(monthlyExtraResult.totalExtraPaid)],
          ["Total Cost Without Extra", formatCurrencyPDF(monthlyExtraResult.totalCostWithoutExtra)],
          ["Total Cost With Extra", formatCurrencyPDF(monthlyExtraResult.totalCostWithExtra)],
        ];
      } else if (isRefinance && refinanceResult) {
        const bestOptionText = refinanceResult.bestOption === "stay" ? "Stay - Do Nothing" : "Option " + refinanceResult.bestOption;
        resultsData = [
          ["Original EMI", formatCurrencyPDF(result.emi)],
          ["Outstanding Principal", formatCurrencyPDF(result.outstandingPrincipal)],
          ["Remaining Tenure", result.remainingTenure + " months"],
          ["Best Option", bestOptionText],
          ["Maximum Savings", formatCurrencyPDF(refinanceResult.maxSavings)],
        ];
      }

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: resultsData,
        theme: "striped",
        headStyles: {
          fillColor: [34, 197, 94], // green-500
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        bodyStyles: {
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: "bold" },
          1: { cellWidth: "auto" },
        },
        margin: { left: margin, right: margin },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Refinance Comparison Table (if applicable)
      if (isRefinance && refinanceResult) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("Option Comparison", margin, y);
        y += 8;

        const comparisonData = [
          [
            "Stay",
            formatCurrencyPDF(refinanceResult.stay.monthlyPayment),
            refinanceResult.stay.tenure + " months",
            formatCurrencyPDF(refinanceResult.stay.totalCost),
          ],
          [
            "Option A - Prepay Only",
            formatCurrencyPDF(refinanceResult.optionA.monthlyPayment),
            refinanceResult.optionA.tenure + " months",
            formatCurrencyPDF(refinanceResult.optionA.totalCost),
          ],
          [
            "Option B - Refinance Only",
            formatCurrencyPDF(refinanceResult.optionB.monthlyPayment),
            refinanceResult.optionB.tenure + " months",
            formatCurrencyPDF(refinanceResult.optionB.totalCost),
          ],
          [
            "Option C - Prepay + Refinance",
            formatCurrencyPDF(refinanceResult.optionC.monthlyPayment),
            refinanceResult.optionC.tenure + " months",
            formatCurrencyPDF(refinanceResult.optionC.totalCost),
          ],
        ];

        autoTable(doc, {
          startY: y,
          head: [["Option", "Monthly Payment", "Tenure", "Total Cost"]],
          body: comparisonData,
          theme: "grid",
          headStyles: {
            fillColor: [0, 51, 102], // Navy blue
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245], // Light gray
          },
          columnStyles: {
            0: { halign: "left", fontStyle: "bold", cellWidth: 65 },
            1: { halign: "right", cellWidth: 40 },
            2: { halign: "center", cellWidth: 35 },
            3: { halign: "right", cellWidth: 40 },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Credx - Smart Loan Prepayment Calculator", margin, pageHeight - 10);

      // Save PDF
      doc.save("Credx-Prepayment-Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // WhatsApp Share function
  const shareOnWhatsApp = () => {
    if (!isValid) return;

    // Helper function to format currency without ₹ symbol (for WhatsApp)
    const formatCurrency = (value: number) => {
      if (!Number.isFinite(value)) return "-";
      return value.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
    };

    let message = "📊 *LOAN PREPAYMENT ANALYSIS*\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n\n";

    // Loan Details Section
    message += "🏠 *Loan Details*\n";
    message += `• Principal: ₹${formatCurrency(principal)}\n`;
    message += `• Rate: ${interest}% p.a.\n`;
    message += `• Tenure: ${tenureMonths} months (${formatMonthsYears(tenureMonths)})\n`;
    message += `• Already Paid: ${monthsPaid} months\n\n`;

    // Prepayment Impact Section - Scenario Specific
    message += "💰 *Prepayment Impact*\n";

    if (isReduceTenure && reduceTenureResult) {
      message += `• Prepayment Amount: ₹${formatCurrency(prepay)}\n`;
      message += `• Interest Saved: *₹${formatCurrency(reduceTenureResult.interestSaved)}* ✅\n`;
      message += `• Tenure Reduced: *${reduceTenureResult.tenureReduced} months*\n`;
      message += `• New Tenure: ${reduceTenureResult.newTenureAfterPrepay} months (${formatMonthsYears(reduceTenureResult.newTenureAfterPrepay)})\n\n`;
      message += "📈 *Summary*\n";
      message += `Without Prepay: ₹${formatCurrency(reduceTenureResult.totalCostWithoutPrepay)}\n`;
      message += `With Prepay: ₹${formatCurrency(reduceTenureResult.totalCostWithPrepay)}\n`;
      message += `*Total Savings: ₹${formatCurrency(reduceTenureResult.interestSaved)}*\n`;
    } else if (isReduceEMI && reduceEMIResult) {
      message += `• Prepayment Amount: ₹${formatCurrency(prepay)}\n`;
      message += `• Interest Saved: *₹${formatCurrency(reduceEMIResult.interestSaved)}* ✅\n`;
      message += `• Original EMI: ₹${formatCurrency(reduceEMIResult.emi)}\n`;
      message += `• New EMI: *₹${formatCurrency(reduceEMIResult.newEmi)}*\n`;
      message += `• Monthly Savings: *₹${formatCurrency(reduceEMIResult.monthlyBenefit)}* per month 💵\n`;
      message += `• Remaining Tenure: ${reduceEMIResult.remainingTenure} months (${formatMonthsYears(reduceEMIResult.remainingTenure)})\n\n`;
      message += "📈 *Summary*\n";
      message += `Without Prepay: ₹${formatCurrency(reduceEMIResult.totalCostWithoutPrepay)}\n`;
      message += `With Prepay: ₹${formatCurrency(reduceEMIResult.totalCostWithPrepay)}\n`;
      message += `*Total Savings: ₹${formatCurrency(reduceEMIResult.interestSaved)}*\n`;
    } else if (isMonthlyExtra && monthlyExtraResult) {
      message += `• Monthly Extra Payment: ₹${formatCurrency(monthlyExtra)}\n`;
      message += `• Interest Saved: *₹${formatCurrency(monthlyExtraResult.interestSaved)}* ✅\n`;
      message += `• Original EMI: ₹${formatCurrency(monthlyExtraResult.emi)}\n`;
      message += `• Effective Payment: *₹${formatCurrency(monthlyExtraResult.effectiveMonthlyPayment)}* per month\n`;
      message += `• Tenure Reduced: *${monthlyExtraResult.tenureReduced} months*\n`;
      message += `• New Tenure: ${monthlyExtraResult.newTenure} months (${formatMonthsYears(monthlyExtraResult.newTenure)})\n\n`;
      message += "📈 *Summary*\n";
      message += `Without Extra: ₹${formatCurrency(monthlyExtraResult.totalCostWithoutExtra)}\n`;
      message += `With Extra: ₹${formatCurrency(monthlyExtraResult.totalCostWithExtra)}\n`;
      message += `*Total Savings: ₹${formatCurrency(monthlyExtraResult.interestSaved)}*\n`;
      message += `*Total Extra Paid: ₹${formatCurrency(monthlyExtraResult.totalExtraPaid)}*\n`;
    } else if (isRefinance && refinanceResult) {
      message += `• Prepayment Amount: ₹${formatCurrency(prepay)}\n`;
      message += `• New Interest Rate: ${newRate}% p.a.\n`;
      message += `• Refinance Cost: ₹${formatCurrency(refinanceCost)}\n`;
      message += `• New Loan Tenure: ${newTenure} months\n\n`;
      message += "📈 *Comparison*\n";
      const bestOptionName = refinanceResult.bestOption === 'stay' ? 'Stay' : `Option ${refinanceResult.bestOption}`;
      message += `*Best Option: ${bestOptionName}* ✅\n`;
      message += `*Maximum Savings: ₹${formatCurrency(refinanceResult.maxSavings)}*\n\n`;
      message += "• Stay: ₹" + formatCurrency(refinanceResult.stay.totalCost) + "\n";
      message += "• Option A (Prepay Only): ₹" + formatCurrency(refinanceResult.optionA.totalCost) + "\n";
      message += "• Option B (Refinance Only): ₹" + formatCurrency(refinanceResult.optionB.totalCost) + "\n";
      message += "• Option C (Prepay + Refinance): ₹" + formatCurrency(refinanceResult.optionC.totalCost) + "\n";
    }

    message += "\n🔗 Try it: credx.app\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n";
    message += "_Generated by Credx_";

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

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
            <div className="grid grid-cols-2 gap-1 bg-gray-900 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setScenario("reduceTenure")}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
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
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  scenario === "reduceEMI"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Reduce EMI
              </button>
              <button
                type="button"
                onClick={() => setScenario("monthlyExtra")}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  scenario === "monthlyExtra"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Monthly Extra
              </button>
              <button
                type="button"
                onClick={() => {
                  setScenario("refinance");
                  // Set newTenure default to remaining tenure when switching to refinance
                  const remaining = tenureMonths - monthsPaid;
                  if (newTenure === 180 || remaining !== newTenure) {
                    setNewTenure(Math.max(VALIDATION_RULES.newTenure.min, Math.min(remaining, VALIDATION_RULES.newTenure.max)));
                  }
                }}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  scenario === "refinance"
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Refinance
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {scenario === "reduceTenure"
                ? "Keep EMI same, pay off faster"
                : scenario === "reduceEMI"
                ? "Keep tenure same, lower monthly payment"
                : scenario === "monthlyExtra"
                ? "Pay extra every month, reduce tenure"
                : "Compare prepay, refinance, or both options"}
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
              label={scenario === "refinance" ? "Current Interest Rate" : "Annual Interest Rate"}
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

            {scenario !== "monthlyExtra" && (
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
            )}

            {scenario === "monthlyExtra" && (
              <MoneyInput
                label="Monthly Extra Payment"
                id="monthlyExtra"
                value={monthlyExtra}
                onChange={(val) => {
                  const clamped = Math.max(0, Math.min(val, VALIDATION_RULES.monthlyExtra.max));
                  setMonthlyExtra(clamped);
                }}
                error={validate.monthlyExtra}
                helperText={formatRange(VALIDATION_RULES.monthlyExtra.min, VALIDATION_RULES.monthlyExtra.max)}
              />
            )}

            {scenario === "refinance" && (
              <>
                <RateInput
                  label="New Interest Rate"
                  id="newRate"
                  value={newRate}
                  onChange={(val) => {
                    const clamped = Math.max(0, Math.min(val, VALIDATION_RULES.newRate.max));
                    setNewRate(clamped);
                  }}
                  min={0}
                  max={VALIDATION_RULES.newRate.max}
                  error={validate.newRate}
                  helperText={formatRange(VALIDATION_RULES.newRate.min, VALIDATION_RULES.newRate.max, "%")}
                />
                
                <MoneyInput
                  label="Refinance Cost"
                  id="refinanceCost"
                  value={refinanceCost}
                  onChange={(val) => {
                    const clamped = Math.max(0, Math.min(val, VALIDATION_RULES.refinanceCost.max));
                    setRefinanceCost(clamped);
                  }}
                  error={validate.refinanceCost}
                  helperText={formatRange(VALIDATION_RULES.refinanceCost.min, VALIDATION_RULES.refinanceCost.max)}
                />
                
                <MonthsInput
                  label="New Loan Tenure"
                  id="newTenure"
                  value={newTenure}
                  onChange={(val) => {
                    const clamped = Math.max(VALIDATION_RULES.newTenure.min, Math.min(val, VALIDATION_RULES.newTenure.max));
                    setNewTenure(clamped);
                  }}
                  min={VALIDATION_RULES.newTenure.min}
                  max={VALIDATION_RULES.newTenure.max}
                  error={validate.newTenure}
                  helperText={formatRange(VALIDATION_RULES.newTenure.min, VALIDATION_RULES.newTenure.max, " months")}
                />
              </>
            )}
          </form>
        </div>

        {/* Right Card: Results */}
        <div className={`bg-gray-800 rounded-2xl shadow-lg flex-1 p-6 min-w-[0] ${!isValid ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="text-xl font-semibold text-white mb-4">
            {isRefinance ? "Refinance Comparison" : "Prepayment Impact"}
            {!isValid && (
              <span className="ml-2 text-sm font-normal text-red-400">Invalid Inputs</span>
            )}
          </h2>
          {/* Interest Saved Prominently - only for scenarios 1A, 1B, 2 */}
          {!isRefinance && (
            <>
              <div className="mb-6 text-center">
                <div className="text-base text-gray-400 font-medium uppercase tracking-wide mb-1">
                  Interest Saved
                </div>
                <div className="font-extrabold text-3xl md:text-4xl text-green-400 mb-1 select-all">
                  {'interestSaved' in result && result.interestSaved > 0 ? formatINR(result.interestSaved) : "-"}
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
            {isReduceEMI && reduceEMIResult?.monthlyBenefit && reduceEMIResult.monthlyBenefit > 0 && (
              <div className="mt-2 text-base text-gray-200 font-medium">
                You save&nbsp;
                <span className="text-green-300 font-semibold text-lg">
                  {formatINR(reduceEMIResult.monthlyBenefit)}
                </span>
                &nbsp;every month
              </div>
            )}
            {isMonthlyExtra && monthlyExtraResult?.tenureReduced && monthlyExtraResult.tenureReduced > 0 && (
              <div className="mt-2 text-base text-gray-200 font-medium">
                Tenure Reduced:&nbsp;
                <span className="text-green-300 font-semibold">
                  {monthlyExtraResult.tenureReduced} months
                </span>
                &nbsp;(
                <span className="text-green-300">
                  {formatMonthsYears(monthlyExtraResult.tenureReduced)}
                </span>
                )
              </div>
                )}
              </div>
              
              <div className="mb-5">
                {/* Comparison Table - only for scenarios 1A, 1B, 2 */}
                <div className="w-full mb-4 rounded-lg overflow-hidden border border-gray-700">
              <div className="grid grid-cols-3 bg-gray-700 text-gray-200 text-center text-sm">
                <div className="p-2 font-semibold text-left pl-4"> </div>
                <div className="p-2 font-semibold">
                  {scenario === "monthlyExtra" ? "Without Extra" : "Without Prepayment"}
                </div>
                <div className="p-2 font-semibold">
                  {scenario === "monthlyExtra" ? "With Extra" : "With Prepayment"}
                </div>
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
              ) : isReduceEMI && reduceEMIResult ? (
                <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base border-t border-gray-700">
                  <div className="p-2 text-left pl-4">Monthly EMI</div>
                  <div className="p-2 font-medium text-gray-400">
                    {formatINR(reduceEMIResult.emi)}
                  </div>
                  <div className="p-2 font-medium text-green-400">
                    {formatINR(reduceEMIResult.newEmi)}
                  </div>
                </div>
              ) : isMonthlyExtra && monthlyExtraResult ? (
                <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base border-t border-gray-700">
                  <div className="p-2 text-left pl-4">Tenure</div>
                  <div className="p-2 font-medium text-gray-400">
                    {monthlyExtraResult.remainingTenure} months
                  </div>
                  <div className="p-2 font-medium text-green-400">
                    {monthlyExtraResult.newTenure} months
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
              <span className="">Original EMI</span>
              <span className="font-semibold text-white">{formatINR(result.emi)}</span>
            </div>
            {isReduceEMI && reduceEMIResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>New EMI</span>
                <span className="font-semibold text-green-400">{formatINR(reduceEMIResult.newEmi)}</span>
              </div>
            )}
            {isReduceEMI && reduceEMIResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>EMI Reduction (Monthly Savings)</span>
                <span className="font-semibold text-green-400">{formatINR(reduceEMIResult.emiReduction)}</span>
              </div>
            )}
            {isMonthlyExtra && monthlyExtraResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Effective Monthly Payment</span>
                <span className="font-semibold text-green-400">{formatINR(monthlyExtraResult.effectiveMonthlyPayment)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-gray-400">
              <span>Outstanding Principal</span>
              <span className="font-semibold text-white">{formatINR(result.outstandingPrincipal)}</span>
            </div>
            {scenario !== "monthlyExtra" && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Prepayment Amount</span>
                <span className="font-semibold text-white">{formatINR(prepay)}</span>
              </div>
            )}
            {isMonthlyExtra && monthlyExtraResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Monthly Extra Payment</span>
                <span className="font-semibold text-white">{formatINR(monthlyExtra)}</span>
              </div>
            )}
            {isMonthlyExtra && monthlyExtraResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Total Extra You'll Pay</span>
                <span className="font-semibold text-white">{formatINR(monthlyExtraResult.totalExtraPaid)}</span>
              </div>
            )}
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
            {isMonthlyExtra && monthlyExtraResult && (
              <div className="flex items-center justify-between text-gray-400">
                <span>New Tenure (After Extra Payments)</span>
                <span className="font-semibold text-white">
                  {monthlyExtraResult.newTenure} months ({formatMonthsYears(monthlyExtraResult.newTenure)})
                </span>
              </div>
            )}
              </div>
            </>
          )}

          {/* Scenario 3: Refinance Comparison Cards */}
          {isRefinance && refinanceResult && (
            <>
              {/* Summary Section */}
              <div className="mb-6 text-center">
                <div className="text-base text-gray-400 font-medium uppercase tracking-wide mb-2">
                  Best Option
                </div>
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {refinanceResult.bestOption === 'stay' ? 'Stay - Do Nothing' : `Option ${refinanceResult.bestOption}`}
                </div>
                <div className="text-base text-gray-300">
                  Maximum Savings: <span className="text-green-400 font-semibold">{formatINR(refinanceResult.maxSavings)}</span>
                </div>
              </div>

              {/* Comparison Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Stay Card */}
                <button
                  type="button"
                  onClick={() => setExpandedCard(expandedCard === 'stay' ? null : 'stay')}
                  className={`bg-gray-700 rounded-lg p-4 border-2 text-left transition-all hover:bg-gray-600 ${refinanceResult.bestOption === 'stay' ? 'border-green-500' : 'border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {refinanceResult.bestOption === 'stay' && (
                        <div className="bg-green-500 text-white text-[8.5px] font-bold px-[4.4px] py-[2.2px] rounded-full">
                          Best Option
                        </div>
                      )}
                      <div className="font-semibold text-white">Stay - Do Nothing</div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedCard === 'stay' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {expandedCard === 'stay' && (
                    <div className="space-y-2 text-sm mt-3">
                      <div className="flex justify-between text-gray-300">
                        <span>Monthly Payment:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.stay.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Tenure:</span>
                        <span className="font-medium text-white">{refinanceResult.stay.tenure} months</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Total Cost:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.stay.totalCost)}</span>
                      </div>
                    </div>
                  )}
                </button>

                {/* Option A Card */}
                <button
                  type="button"
                  onClick={() => setExpandedCard(expandedCard === 'A' ? null : 'A')}
                  className={`bg-gray-700 rounded-lg p-4 border-2 text-left transition-all hover:bg-gray-600 ${refinanceResult.bestOption === 'A' ? 'border-green-500' : 'border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {refinanceResult.bestOption === 'A' && (
                        <div className="bg-green-500 text-white text-[8.5px] font-bold px-[4.4px] py-[2.2px] rounded-full">
                          Best
                        </div>
                      )}
                      <div className="font-semibold text-white">Option A - Prepay Only</div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedCard === 'A' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {refinanceResult.optionA.status ? (
                    <div className="text-yellow-400 text-sm">
                      <span className="font-semibold">{refinanceResult.optionA.status}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-green-400 text-sm">
                      <span className="font-semibold">Savings:</span>
                      <span className="font-bold">{formatINR(refinanceResult.stay.totalCost - refinanceResult.optionA.totalCost)}</span>
                    </div>
                  )}
                  {expandedCard === 'A' && (
                    <div className="space-y-2 text-sm mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between text-gray-300">
                        <span>Monthly Payment:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.optionA.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Tenure:</span>
                        <span className="font-medium text-white">{refinanceResult.optionA.tenure} months</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Total Cost:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.optionA.totalCost)}</span>
                      </div>
                    </div>
                  )}
                </button>

                {/* Option B Card */}
                <button
                  type="button"
                  onClick={() => setExpandedCard(expandedCard === 'B' ? null : 'B')}
                  className={`bg-gray-700 rounded-lg p-4 border-2 text-left transition-all hover:bg-gray-600 ${refinanceResult.bestOption === 'B' ? 'border-green-500' : 'border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {refinanceResult.bestOption === 'B' && (
                        <div className="bg-green-500 text-white text-[8.5px] font-bold px-[4.4px] py-[2.2px] rounded-full">
                          Best Option
                        </div>
                      )}
                      <div className="font-semibold text-white">Option B - Refinance Only</div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedCard === 'B' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {refinanceResult.optionB.status ? (
                    <div className="text-yellow-400 text-sm">
                      <span className="font-semibold">{refinanceResult.optionB.status}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-green-400 text-sm">
                      <span className="font-semibold">Savings:</span>
                      <span className="font-bold">{formatINR(refinanceResult.stay.totalCost - refinanceResult.optionB.totalCost)}</span>
                    </div>
                  )}
                  {expandedCard === 'B' && (
                    <div className="space-y-2 text-sm mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between text-gray-300">
                        <span>Monthly Payment:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.optionB.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Tenure:</span>
                        <span className="font-medium text-white">{refinanceResult.optionB.tenure} months</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Total Cost:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.optionB.totalCost)}</span>
                      </div>
                    </div>
                  )}
                </button>

                {/* Option C Card */}
                <button
                  type="button"
                  onClick={() => setExpandedCard(expandedCard === 'C' ? null : 'C')}
                  className={`bg-gray-700 rounded-lg p-4 border-2 text-left transition-all hover:bg-gray-600 ${refinanceResult.bestOption === 'C' ? 'border-green-500' : 'border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {refinanceResult.bestOption === 'C' && (
                        <div className="bg-green-500 text-white text-[8.5px] font-bold px-[4.4px] py-[2.2px] rounded-full">
                          Best Option
                        </div>
                      )}
                      <div className="font-semibold text-white">Option C - Prepay + Refinance</div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedCard === 'C' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {refinanceResult.optionC.status ? (
                    <div className="text-yellow-400 text-sm">
                      <span className="font-semibold">{refinanceResult.optionC.status}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-green-400 text-sm">
                      <span className="font-semibold">Savings:</span>
                      <span className="font-bold">{formatINR(refinanceResult.stay.totalCost - refinanceResult.optionC.totalCost)}</span>
                    </div>
                  )}
                  {expandedCard === 'C' && (
                    <div className="space-y-2 text-sm mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between text-gray-300">
                        <span>Monthly Payment:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.optionC.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Tenure:</span>
                        <span className="font-medium text-white">{refinanceResult.optionC.tenure} months</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Total Cost:</span>
                        <span className="font-medium text-white">{formatINR(refinanceResult.optionC.totalCost)}</span>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </>
          )}

          {/* PDF Download and WhatsApp Share Buttons */}
          {isValid && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-500 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share on WhatsApp</span>
              </button>
            </div>
          )}
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
