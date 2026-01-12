"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { calculateScenario3 } from "../lib/calculator";
import LoanInputs from "../components/LoanInputs";
import ExportButtons from "../components/ExportButtons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Validation constants
const VALIDATION_RULES = {
  principal: { min: 50000, max: 100000000 },
  interestRate: { min: 1, max: 30 },
  tenureMonths: { min: 12, max: 360 },
  monthsPaid: { min: 0 },
  prepayment: { min: 0 },
  newRate: { min: 1, max: 30 },
  refinanceCost: { min: 0, max: 500000 },
  newTenure: { min: 12, max: 360 },
} as const;

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

function formatCurrencyShort(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value.toFixed(0)}`;
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

export default function RefinancePage() {
  // State variables
  const [principal, setPrincipal] = useState(5000000);
  const [interest, setInterest] = useState(9);
  const [tenureMonths, setTenureMonths] = useState(240);
  const [monthsPaid, setMonthsPaid] = useState(60);
  const [prepaymentAmount, setPrepaymentAmount] = useState(0);
  const [newRate, setNewRate] = useState(7.5);
  const [refinanceCost, setRefinanceCost] = useState(50000);
  const [newTenure, setNewTenure] = useState(180);
  const [expandedCard, setExpandedCard] = useState<'stay' | 'A' | 'B' | 'C' | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [chartHeight, setChartHeight] = useState(200);

  // Calculate remaining tenure for newTenure default
  const remainingTenureForDefault = tenureMonths - monthsPaid;
  
  // Update newTenure when remaining tenure changes
  useEffect(() => {
    if (remainingTenureForDefault > 0 && remainingTenureForDefault <= VALIDATION_RULES.newTenure.max) {
      setNewTenure(remainingTenureForDefault);
    }
  }, [remainingTenureForDefault]);

  // Chart height based on screen size
  useEffect(() => {
    const updateChartHeight = () => {
      setChartHeight(window.innerWidth >= 1024 ? 250 : 200);
    };
    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);
    return () => window.removeEventListener('resize', updateChartHeight);
  }, []);

  // Validation
  const validate = useMemo(() => {
    const errors: Record<string, string> = {};

    if (principal < VALIDATION_RULES.principal.min) {
      errors.principal = `Principal must be at least ${formatINR(VALIDATION_RULES.principal.min)}`;
    } else if (principal > VALIDATION_RULES.principal.max) {
      errors.principal = `Principal cannot exceed ${formatINR(VALIDATION_RULES.principal.max)}`;
    }

    if (interest < VALIDATION_RULES.interestRate.min) {
      errors.interestRate = `Interest rate must be at least ${VALIDATION_RULES.interestRate.min}%`;
    } else if (interest > VALIDATION_RULES.interestRate.max) {
      errors.interestRate = `Interest rate cannot exceed ${VALIDATION_RULES.interestRate.max}%`;
    }

    if (tenureMonths < VALIDATION_RULES.tenureMonths.min) {
      errors.tenureMonths = `Tenure must be at least ${VALIDATION_RULES.tenureMonths.min} months`;
    } else if (tenureMonths > VALIDATION_RULES.tenureMonths.max) {
      errors.tenureMonths = `Tenure cannot exceed ${VALIDATION_RULES.tenureMonths.max} months`;
    }

    if (monthsPaid < 0) {
      errors.monthsPaid = "Months paid cannot be negative";
    } else if (monthsPaid >= tenureMonths) {
      errors.monthsPaid = `Months paid must be less than tenure (max ${tenureMonths - 1})`;
    }

    if (newRate < VALIDATION_RULES.newRate.min) {
      errors.newRate = `New interest rate must be at least ${VALIDATION_RULES.newRate.min}%`;
    } else if (newRate > VALIDATION_RULES.newRate.max) {
      errors.newRate = `New interest rate cannot exceed ${VALIDATION_RULES.newRate.max}%`;
    } else if (newRate >= interest) {
      errors.newRate = "New rate should be less than current rate for refinancing to be beneficial";
    }

    if (refinanceCost < VALIDATION_RULES.refinanceCost.min) {
      errors.refinanceCost = `Refinance cost must be at least ${formatINR(VALIDATION_RULES.refinanceCost.min)}`;
    } else if (refinanceCost > VALIDATION_RULES.refinanceCost.max) {
      errors.refinanceCost = `Refinance cost cannot exceed ${formatINR(VALIDATION_RULES.refinanceCost.max)}`;
    }

    if (newTenure < VALIDATION_RULES.newTenure.min) {
      errors.newTenure = `New tenure must be at least ${VALIDATION_RULES.newTenure.min} months`;
    } else if (newTenure > VALIDATION_RULES.newTenure.max) {
      errors.newTenure = `New tenure cannot exceed ${VALIDATION_RULES.newTenure.max} months`;
    }

    return errors;
  }, [principal, interest, tenureMonths, monthsPaid, newRate, refinanceCost, newTenure]);

  const isValid = Object.keys(validate).length === 0;

  // Outstanding principal for prepayment validation
  const outstandingPrincipal = useMemo(() => {
    if (!isValid) return 0;
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    try {
      const tempResult = calculateScenario3(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        0,
        interest, // Use same rate for temp calculation
        0,
        remainingTenureForDefault
      );
      return tempResult.outstandingPrincipal;
    } catch {
      return 0;
    }
  }, [principal, interest, tenureMonths, monthsPaid, isValid, remainingTenureForDefault]);

  const prepaymentError = prepaymentAmount > outstandingPrincipal
    ? `Prepayment cannot exceed outstanding principal (max ${formatINR(Math.max(0, outstandingPrincipal - 1))})`
    : undefined;

  // Calculate results
  const result = useMemo(() => {
    if (!isValid) return null;
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    const safePrepay = Math.max(0, Math.min(prepaymentAmount, outstandingPrincipal));
    const safeNewTenure = Math.max(VALIDATION_RULES.newTenure.min, Math.min(newTenure, VALIDATION_RULES.newTenure.max));
    const safeRefinanceCost = Math.max(0, refinanceCost);

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
  }, [principal, interest, tenureMonths, monthsPaid, prepaymentAmount, newRate, refinanceCost, newTenure, isValid, outstandingPrincipal]);

  const refinanceResult = result ? result as {
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

  // PDF Generation
  const generatePDF = async () => {
    if (!isValid || !refinanceResult) return;

    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;

      doc.setFont("helvetica", "normal");

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
      doc.text("Credx - Refinance Comparison Report", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      doc.text("Generated on: " + currentDate, margin, y);
      y += 15;

      // Loan Details
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Loan Details", margin, y);
      y += 8;

      const loanDetailsData = [
        ["Original Principal", formatCurrencyPDF(principal)],
        ["Current Interest Rate", interest + "% per annum"],
        ["Original Tenure", tenureMonths + " months (" + formatMonthsYears(tenureMonths) + ")"],
        ["Months Already Paid", monthsPaid + " months"],
        ["Prepayment Amount", formatCurrencyPDF(prepaymentAmount)],
        ["New Interest Rate", newRate + "% per annum"],
        ["Refinance Cost", formatCurrencyPDF(refinanceCost)],
        ["New Loan Tenure", newTenure + " months"],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Parameter", "Value"]],
        body: loanDetailsData,
        theme: "striped",
        headStyles: {
          fillColor: [34, 197, 94],
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

      // Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Summary", margin, y);
      y += 8;

      const bestOptionText = refinanceResult.bestOption === "stay" ? "Stay - Do Nothing" : "Option " + refinanceResult.bestOption;
      const summaryData = [
        ["Best Option", bestOptionText],
        ["Maximum Savings", formatCurrencyPDF(refinanceResult.maxSavings)],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "striped",
        headStyles: {
          fillColor: [34, 197, 94],
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

      // Option Comparison
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Option Comparison", margin, y);
      y += 8;

      const comparisonData = [
        [
          "Stay - Do Nothing",
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
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { halign: "left", fontStyle: "bold", cellWidth: 65 },
          1: { halign: "right", cellWidth: 40 },
          2: { halign: "center", cellWidth: 35 },
          3: { halign: "right", cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Credx - Smart Loan Prepayment Calculator", margin, pageHeight - 10);

      doc.save("Credx-Refinance-Comparison-Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // WhatsApp Share
  const shareOnWhatsApp = () => {
    if (!isValid || !refinanceResult) return;

    const formatCurrency = (value: number) => {
      if (!Number.isFinite(value)) return "-";
      return value.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
    };

    let message = "📊 *LOAN PREPAYMENT ANALYSIS*\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n\n";

    message += "🏠 *Loan Details*\n";
    message += `• Principal: ₹${formatCurrency(principal)}\n`;
    message += `• Rate: ${interest}% p.a.\n`;
    message += `• Tenure: ${tenureMonths} months (${formatMonthsYears(tenureMonths)})\n`;
    message += `• Already Paid: ${monthsPaid} months\n\n`;

    message += "💰 *Refinance Comparison*\n";
    message += `• Prepayment Amount: ₹${formatCurrency(prepaymentAmount)}\n`;
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

    message += "\n🔗 Try it: credx.app\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n";
    message += "_Generated by Credx_";

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center px-2 py-4 md:py-8">
      {/* Header Section */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Refinance Comparison
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            Compare prepay vs refinance options to find the best strategy. See how different combinations of prepayment and refinancing can save you money.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
        {/* Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Loan Card */}
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current Loan</h2>
            <LoanInputs
              principal={principal}
              setPrincipal={setPrincipal}
              interestRate={interest}
              setInterestRate={setInterest}
              tenure={tenureMonths}
              setTenure={setTenureMonths}
              monthsPaid={monthsPaid}
              setMonthsPaid={setMonthsPaid}
              showValidation={true}
            />
          </div>

          {/* Prepayment Card */}
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Prepayment (Optional)</h2>
            <MoneyInput
              label="Prepayment Amount"
              id="prepayment"
              value={prepaymentAmount}
              onChange={(val) => {
                const clamped = Math.max(0, Math.min(val, outstandingPrincipal));
                setPrepaymentAmount(clamped);
              }}
              min={0}
              max={outstandingPrincipal}
              error={prepaymentError}
              helperText={outstandingPrincipal > 0 ? `Range: ₹0 - ${formatINR(Math.max(0, outstandingPrincipal - 1))}` : undefined}
            />
          </div>

          {/* Refinance Options Card */}
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Refinance Options</h2>
            <div className="space-y-4">
              <RateInput
                label="New Interest Rate"
                id="newRate"
                value={newRate}
                onChange={(val) => {
                  const clamped = Math.max(VALIDATION_RULES.newRate.min, Math.min(val, VALIDATION_RULES.newRate.max));
                  setNewRate(clamped);
                }}
                min={VALIDATION_RULES.newRate.min}
                max={VALIDATION_RULES.newRate.max}
                error={validate.newRate}
                helperText={`Range: ${VALIDATION_RULES.newRate.min}% - ${VALIDATION_RULES.newRate.max}%`}
              />
              <MoneyInput
                label="Refinance Cost"
                id="refinanceCost"
                value={refinanceCost}
                onChange={(val) => {
                  const clamped = Math.max(0, Math.min(val, VALIDATION_RULES.refinanceCost.max));
                  setRefinanceCost(clamped);
                }}
                min={0}
                max={VALIDATION_RULES.refinanceCost.max}
                error={validate.refinanceCost}
                helperText={`Range: ₹0 - ${formatINR(VALIDATION_RULES.refinanceCost.max)}`}
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
                helperText={`Range: ${VALIDATION_RULES.newTenure.min} - ${VALIDATION_RULES.newTenure.max} months`}
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        {isValid && refinanceResult && (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Comparison Results</h2>

            {/* Summary */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                <div className="text-sm text-gray-400 mb-2">Baseline comparison</div>
                {expandedCard === 'stay' && (
                  <div className="space-y-2 text-sm mt-3 pt-3 border-t border-gray-600">
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
                        Best Option
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

            {/* Chart */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-200 mb-4">Total Cost Comparison</h3>
              <ResponsiveContainer width="100%" minWidth={300} height={chartHeight}>
                <BarChart
                  data={[
                    {
                      name: "Stay",
                      totalCost: refinanceResult.stay.totalCost,
                      isBest: refinanceResult.bestOption === 'stay',
                    },
                    {
                      name: "Option A",
                      totalCost: refinanceResult.optionA.totalCost,
                      isBest: refinanceResult.bestOption === 'A',
                    },
                    {
                      name: "Option B",
                      totalCost: refinanceResult.optionB.totalCost,
                      isBest: refinanceResult.bestOption === 'B',
                    },
                    {
                      name: "Option C",
                      totalCost: refinanceResult.optionC.totalCost,
                      isBest: refinanceResult.bestOption === 'C',
                    },
                  ]}
                  margin={{ top: 20, right: 10, left: 50, bottom: 30 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#d1d5db', fontSize: 11 }}
                    axisLine={{ stroke: '#4b5563' }}
                    tickLine={{ stroke: '#4b5563' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: '#d1d5db', fontSize: 10 }}
                    axisLine={{ stroke: '#4b5563' }}
                    tickLine={{ stroke: '#4b5563' }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #4b5563',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                    formatter={(value: number | undefined) => [
                      formatINR(value ?? 0),
                      'Total Cost'
                    ]}
                    labelFormatter={(label) => `${label}:`}
                  />
                  <Bar
                    dataKey="totalCost"
                    radius={[8, 8, 0, 0]}
                  >
                    {[
                      { name: "Stay", isBest: refinanceResult.bestOption === 'stay' },
                      { name: "Option A", isBest: refinanceResult.bestOption === 'A' },
                      { name: "Option B", isBest: refinanceResult.bestOption === 'B' },
                      { name: "Option C", isBest: refinanceResult.bestOption === 'C' },
                    ].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isBest ? '#22c55e' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-500"></div>
                  <span className="text-gray-300">Standard Option</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-green-500"></div>
                  <span className="text-gray-300">Best Option</span>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <ExportButtons
              onDownloadPDF={generatePDF}
              onShareWhatsApp={shareOnWhatsApp}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        )}
      </div>
    </div>
  );
}
