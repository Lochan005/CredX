"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { calculatePrepaymentScenario, calculatePrepaymentScenario1B } from "../lib/calculator";
import LoanInputs from "../components/LoanInputs";
import ExportButtons from "../components/ExportButtons";
import ResultsReveal from "../components/ResultsReveal";
import SavingsHighlight from "../components/SavingsHighlight";
import ComparisonTable from "../components/ComparisionTable";
import AnimatedNumber from "../components/AnimatedNumber";
import { AnimatedPieChart, AnimatedBarChart } from "../components/AnimatedCharts";
import AnimatedToggle from "../components/AnimatedToggle";
import BackButton from "../components/BackButton";
import { fadeIn } from "../lib/animation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Validation constants
const VALIDATION_RULES = {
  principal: { min: 50000, max: 100000000 },
  interestRate: { min: 1, max: 30 },
  tenureMonths: { min: 12, max: 360 },
  monthsPaid: { min: 0 },
  prepayment: { min: 0 },
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

export default function LumpSumPage() {
  // State variables
  const [principal, setPrincipal] = useState(5000000);
  const [interest, setInterest] = useState(9);
  const [tenureMonths, setTenureMonths] = useState(240);
  const [monthsPaid, setMonthsPaid] = useState(60);
  const [prepaymentAmount, setPrepaymentAmount] = useState(500000);
  const [scenario, setScenario] = useState<'1A' | '1B'>('1A');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [chartHeight, setChartHeight] = useState(200);

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

    return errors;
  }, [principal, interest, tenureMonths, monthsPaid]);

  const isValid = Object.keys(validate).length === 0;

  // Calculate results
  const result = useMemo(() => {
    if (!isValid) return null;
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    const safePrepay = Math.max(0, prepaymentAmount);

    if (scenario === '1B') {
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
  }, [principal, interest, tenureMonths, monthsPaid, prepaymentAmount, scenario, isValid]);

  const reduceTenureResult = scenario === '1A' && result ? result as {
    emi: number;
    outstandingPrincipal: number;
    remainingTenure: number;
    newTenureAfterPrepay: number;
    interestSaved: number;
    tenureReduced: number;
    totalCostWithoutPrepay: number;
    totalCostWithPrepay: number;
  } : null;

  const reduceEMIResult = scenario === '1B' && result ? result as {
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

  // PDF Generation
  const generatePDF = async () => {
    if (!isValid || !result) return;

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
      doc.text("Credx - Lump Sum Prepayment Report", margin, y);
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
        ["Interest Rate", interest + "% per annum"],
        ["Original Tenure", tenureMonths + " months (" + formatMonthsYears(tenureMonths) + ")"],
        ["Months Already Paid", monthsPaid + " months"],
        ["Prepayment Amount", formatCurrencyPDF(prepaymentAmount)],
        ["Scenario", scenario === '1A' ? "Reduce Tenure" : "Reduce EMI"],
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

      // Results
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Results", margin, y);
      y += 8;

      let resultsData: string[][] = [];

      if (scenario === '1A' && reduceTenureResult) {
        resultsData = [
          ["Original EMI", formatCurrencyPDF(reduceTenureResult.emi)],
          ["Outstanding Principal", formatCurrencyPDF(reduceTenureResult.outstandingPrincipal)],
          ["Remaining Tenure", reduceTenureResult.remainingTenure + " months"],
          ["New Tenure After Prepayment", reduceTenureResult.newTenureAfterPrepay + " months"],
          ["Tenure Reduced", reduceTenureResult.tenureReduced + " months"],
          ["Interest Saved", formatCurrencyPDF(reduceTenureResult.interestSaved)],
          ["Total Cost Without Prepayment", formatCurrencyPDF(reduceTenureResult.totalCostWithoutPrepay)],
          ["Total Cost With Prepayment", formatCurrencyPDF(reduceTenureResult.totalCostWithPrepay)],
        ];
      } else if (scenario === '1B' && reduceEMIResult) {
        resultsData = [
          ["Original EMI", formatCurrencyPDF(reduceEMIResult.emi)],
          ["New EMI", formatCurrencyPDF(reduceEMIResult.newEmi)],
          ["EMI Reduction", formatCurrencyPDF(reduceEMIResult.emiReduction) + " per month"],
          ["Outstanding Principal", formatCurrencyPDF(reduceEMIResult.outstandingPrincipal)],
          ["Remaining Tenure", reduceEMIResult.remainingTenure + " months"],
          ["Interest Saved", formatCurrencyPDF(reduceEMIResult.interestSaved)],
          ["Total Cost Without Prepayment", formatCurrencyPDF(reduceEMIResult.totalCostWithoutPrepay)],
          ["Total Cost With Prepayment", formatCurrencyPDF(reduceEMIResult.totalCostWithPrepay)],
        ];
      }

      if (resultsData.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Metric", "Value"]],
          body: resultsData,
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
            0: { cellWidth: 80, fontStyle: "bold" },
            1: { cellWidth: "auto" },
          },
          margin: { left: margin, right: margin },
        });
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Credx - Smart Loan Prepayment Calculator", margin, pageHeight - 10);

      doc.save("Credx-Lump-Sum-Prepayment-Report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // WhatsApp Share
  const shareOnWhatsApp = () => {
    if (!isValid || !result) return;

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

    message += "💰 *Prepayment Impact*\n";

    if (scenario === '1A' && reduceTenureResult) {
      message += `• Prepayment Amount: ₹${formatCurrency(prepaymentAmount)}\n`;
      message += `• Interest Saved: *₹${formatCurrency(reduceTenureResult.interestSaved)}* ✅\n`;
      message += `• Tenure Reduced: *${reduceTenureResult.tenureReduced} months*\n`;
      message += `• New Tenure: ${reduceTenureResult.newTenureAfterPrepay} months (${formatMonthsYears(reduceTenureResult.newTenureAfterPrepay)})\n\n`;
      message += "📈 *Summary*\n";
      message += `Without Prepay: ₹${formatCurrency(reduceTenureResult.totalCostWithoutPrepay)}\n`;
      message += `With Prepay: ₹${formatCurrency(reduceTenureResult.totalCostWithPrepay)}\n`;
      message += `*Total Savings: ₹${formatCurrency(reduceTenureResult.interestSaved)}*\n`;
    } else if (scenario === '1B' && reduceEMIResult) {
      message += `• Prepayment Amount: ₹${formatCurrency(prepaymentAmount)}\n`;
      message += `• Interest Saved: *₹${formatCurrency(reduceEMIResult.interestSaved)}* ✅\n`;
      message += `• Original EMI: ₹${formatCurrency(reduceEMIResult.emi)}\n`;
      message += `• New EMI: *₹${formatCurrency(reduceEMIResult.newEmi)}*\n`;
      message += `• Monthly Savings: *₹${formatCurrency(reduceEMIResult.monthlyBenefit)}* per month 💵\n`;
      message += `• Remaining Tenure: ${reduceEMIResult.remainingTenure} months (${formatMonthsYears(reduceEMIResult.remainingTenure)})\n\n`;
      message += "📈 *Summary*\n";
      message += `Without Prepay: ₹${formatCurrency(reduceEMIResult.totalCostWithoutPrepay)}\n`;
      message += `With Prepay: ₹${formatCurrency(reduceEMIResult.totalCostWithPrepay)}\n`;
      message += `*Total Savings: ₹${formatCurrency(reduceEMIResult.interestSaved)}*\n`;
    }

    message += "\n🔗 Try it: credx.app\n";
    message += "━━━━━━━━━━━━━━━━━━━━━\n";
    message += "_Generated by Credx_";

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  // Outstanding principal for prepayment validation
  const outstandingPrincipal = useMemo(() => {
    if (!isValid) return 0;
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    try {
      const tempResult = calculatePrepaymentScenario(
        principal,
        interest,
        tenureMonths,
        safeMonthsPaid,
        0
      );
      return tempResult.outstandingPrincipal;
    } catch {
      return 0;
    }
  }, [principal, interest, tenureMonths, monthsPaid, isValid]);

  const prepaymentError = prepaymentAmount > outstandingPrincipal
    ? `Prepayment cannot exceed outstanding principal (max ${formatINR(Math.max(0, outstandingPrincipal - 1))})`
    : undefined;

  const totalWithout = scenario === '1A' && reduceTenureResult
    ? reduceTenureResult.totalCostWithoutPrepay
    : scenario === '1B' && reduceEMIResult
    ? reduceEMIResult.totalCostWithoutPrepay
    : 0;

  const totalWith = scenario === '1A' && reduceTenureResult
    ? reduceTenureResult.totalCostWithPrepay
    : scenario === '1B' && reduceEMIResult
    ? reduceEMIResult.totalCostWithPrepay
    : 0;

  const interestWithout = scenario === '1A' && reduceTenureResult
    ? reduceTenureResult.totalCostWithoutPrepay - principal
    : scenario === '1B' && reduceEMIResult
    ? reduceEMIResult.totalCostWithoutPrepay - principal
    : 0;

  const interestWith = scenario === '1A' && reduceTenureResult
    ? reduceTenureResult.totalCostWithPrepay - principal - prepaymentAmount
    : scenario === '1B' && reduceEMIResult
    ? reduceEMIResult.totalCostWithPrepay - principal - prepaymentAmount
    : 0;

  const interestSaved = scenario === '1A' && reduceTenureResult
    ? reduceTenureResult.interestSaved
    : scenario === '1B' && reduceEMIResult
    ? reduceEMIResult.interestSaved
    : 0;

  return (
    <motion.div
      className="min-h-screen bg-gray-900 flex flex-col items-center px-2 py-4 md:py-8"
      {...fadeIn}
    >
      {/* Header Section */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Lump Sum Prepayment
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Toggle */}
        <div className="mb-4">
          <AnimatedToggle
            options={[
              { value: '1A', label: 'Reduce Tenure' },
              { value: '1B', label: 'Reduce EMI' }
            ]}
            selected={scenario}
            onChange={(value) => setScenario(value as '1A' | '1B')}
          />
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            {scenario === '1A' 
              ? "Pay off your loan faster by keeping the same EMI. Your prepayment reduces the loan tenure, saving you interest."
              : "Lower your monthly EMI while keeping the same remaining tenure. Your prepayment reduces the monthly payment amount."}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Left: Inputs */}
        <motion.div
          className="bg-gray-800 rounded-2xl shadow-lg flex-1 p-6"
          {...fadeIn}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Loan Details</h2>
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

          <motion.div
            className="mt-6"
            {...fadeIn}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Prepayment</h2>
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
          </motion.div>
        </motion.div>

        {/* Right: Results */}
        <motion.div
          className={`bg-gray-800 rounded-2xl shadow-lg flex-1 p-6 min-w-[0] ${!isValid ? "opacity-50 pointer-events-none" : ""}`}
          {...fadeIn}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Prepayment Impact
            {!isValid && (
              <span className="ml-2 text-sm font-normal text-red-400">Invalid Inputs</span>
            )}
          </h2>

          {isValid && result && (
            <ResultsReveal>
              {/* Interest Saved */}
              <SavingsHighlight value={interestSaved} />

              {/* Tenure Reduced / Monthly Benefit */}
              {scenario === '1A' && reduceTenureResult?.tenureReduced && reduceTenureResult.tenureReduced > 0 && (
                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                    Tenure Reduced
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <AnimatedNumber
                      value={reduceTenureResult.tenureReduced}
                      prefix=""
                      className="text-2xl md:text-3xl font-bold"
                    />
                    <span className="text-lg md:text-xl font-semibold">months</span>
                    <span className="text-gray-400">({formatMonthsYears(reduceTenureResult.tenureReduced)})</span>
                  </div>
                </div>
              )}
              {scenario === '1B' && reduceEMIResult?.monthlyBenefit && reduceEMIResult.monthlyBenefit > 0 && (
                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                    Monthly Savings
                  </p>
                  <div className="text-green-500">
                    <AnimatedNumber
                      value={reduceEMIResult.monthlyBenefit}
                      className="text-2xl md:text-3xl font-bold"
                    />
                    <span className="text-lg md:text-xl font-semibold ml-2">per month</span>
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              <div className="mb-5">
                <ComparisonTable
                  data={[
                    {
                      label: "Total Cost",
                      before: totalWithout,
                      after: totalWith,
                    },
                    ...(scenario === '1A' && reduceTenureResult
                      ? [
                          {
                            label: "Tenure",
                            before: `${reduceTenureResult.remainingTenure} months`,
                            after: `${reduceTenureResult.newTenureAfterPrepay} months`,
                          },
                        ]
                      : scenario === '1B' && reduceEMIResult
                      ? [
                          {
                            label: "EMI",
                            before: reduceEMIResult.emi,
                            after: reduceEMIResult.newEmi,
                          },
                        ]
                      : []),
                    {
                      label: "Interest Paid",
                      before: interestWithout,
                      after: interestWith,
                      highlight: true,
                    },
                  ]}
                />
              </div>

              {/* Charts */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <AnimatedPieChart
                    title="Payment Breakdown"
                    delay={0.3}
                    data={(() => {
                      if (scenario === '1A' && reduceTenureResult) {
                        const principalAmount = principal;
                        const interestWithPrepay = totalWith - principalAmount - prepaymentAmount;
                        return [
                          { name: "Principal", value: principalAmount, color: "#3b82f6" },
                          { name: "Interest (With Prepay)", value: Math.max(0, interestWithPrepay), color: "#ef4444" },
                          { name: "Interest Saved", value: interestSaved, color: "#22c55e" },
                        ];
                      } else if (scenario === '1B' && reduceEMIResult) {
                        const principalAmount = principal;
                        const interestWithPrepay = reduceEMIResult.totalCostWithPrepay - principalAmount - prepaymentAmount;
                        return [
                          { name: "Principal", value: principalAmount, color: "#3b82f6" },
                          { name: "Interest (With Prepay)", value: Math.max(0, interestWithPrepay), color: "#ef4444" },
                          { name: "Interest Saved", value: interestSaved, color: "#22c55e" },
                        ];
                      }
                      return [];
                    })()}
                  />

                  {/* Bar Chart */}
                  <AnimatedBarChart
                    title="Cost Comparison"
                    delay={0.5}
                    stacked={true}
                    data={[
                      {
                        name: "Without Prepayment",
                        principal: principal,
                        interest: interestWithout,
                      },
                      {
                        name: "With Prepayment",
                        principal: principal,
                        interest: interestWith,
                      },
                    ]}
                  />
                </div>
              </motion.div>

              {/* Export Buttons */}
              <ExportButtons
                onDownloadPDF={generatePDF}
                onShareWhatsApp={shareOnWhatsApp}
                isGeneratingPDF={isGeneratingPDF}
              />
            </ResultsReveal>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
