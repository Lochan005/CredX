"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { calculateScenario2 } from "../lib/calculator";
import LoanInputs from "../components/LoanInputs";
import ExportButtons from "../components/ExportButtons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Validation constants
const VALIDATION_RULES = {
  principal: { min: 50000, max: 100000000 },
  interestRate: { min: 1, max: 30 },
  tenureMonths: { min: 12, max: 360 },
  monthsPaid: { min: 0 },
  monthlyExtra: { min: 500, max: 500000 },
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

export default function MonthlyExtraPage() {
  // State variables
  const [principal, setPrincipal] = useState(5000000);
  const [interest, setInterest] = useState(9);
  const [tenureMonths, setTenureMonths] = useState(240);
  const [monthsPaid, setMonthsPaid] = useState(60);
  const [monthlyExtra, setMonthlyExtra] = useState(10000);
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

    if (monthlyExtra < VALIDATION_RULES.monthlyExtra.min) {
      errors.monthlyExtra = `Monthly extra payment must be at least ${formatINR(VALIDATION_RULES.monthlyExtra.min)}`;
    } else if (monthlyExtra > VALIDATION_RULES.monthlyExtra.max) {
      errors.monthlyExtra = `Monthly extra payment cannot exceed ${formatINR(VALIDATION_RULES.monthlyExtra.max)}`;
    }

    return errors;
  }, [principal, interest, tenureMonths, monthsPaid, monthlyExtra]);

  const isValid = Object.keys(validate).length === 0;

  // Calculate results
  const result = useMemo(() => {
    if (!isValid) return null;
    const safeMonthsPaid = Math.max(0, Math.min(monthsPaid, tenureMonths - 1));
    const safeMonthlyExtra = Math.max(VALIDATION_RULES.monthlyExtra.min, Math.min(monthlyExtra, VALIDATION_RULES.monthlyExtra.max));

    return calculateScenario2(
      principal,
      interest,
      tenureMonths,
      safeMonthsPaid,
      safeMonthlyExtra
    );
  }, [principal, interest, tenureMonths, monthsPaid, monthlyExtra, isValid]);

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
      doc.text("Credx - Monthly Extra Payment Report", margin, y);
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
        ["Monthly Extra Payment", formatCurrencyPDF(monthlyExtra)],
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

      const resultsData = [
        ["Original EMI", formatCurrencyPDF(result.emi)],
        ["Effective Monthly Payment", formatCurrencyPDF(result.effectiveMonthlyPayment)],
        ["Outstanding Principal", formatCurrencyPDF(result.outstandingPrincipal)],
        ["New Tenure", result.newTenure + " months"],
        ["Tenure Reduced", result.tenureReduced + " months"],
        ["Interest Saved", formatCurrencyPDF(result.interestSaved)],
        ["Total Extra Paid", formatCurrencyPDF(result.totalExtraPaid)],
        ["Total Cost Without Extra", formatCurrencyPDF(result.totalCostWithoutExtra)],
        ["Total Cost With Extra", formatCurrencyPDF(result.totalCostWithExtra)],
      ];

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

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by Credx - Smart Loan Prepayment Calculator", margin, pageHeight - 10);

      doc.save("Credx-Monthly-Extra-Payment-Report.pdf");
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

    message += "💰 *Monthly Extra Payment Impact*\n";
    message += `• Monthly Extra Payment: ₹${formatCurrency(monthlyExtra)}\n`;
    message += `• Interest Saved: *₹${formatCurrency(result.interestSaved)}* ✅\n`;
    message += `• Original EMI: ₹${formatCurrency(result.emi)}\n`;
    message += `• Effective Payment: *₹${formatCurrency(result.effectiveMonthlyPayment)}* per month\n`;
    message += `• Tenure Reduced: *${result.tenureReduced} months*\n`;
    message += `• New Tenure: ${result.newTenure} months (${formatMonthsYears(result.newTenure)})\n\n`;
    message += "📈 *Summary*\n";
    message += `Without Extra: ₹${formatCurrency(result.totalCostWithoutExtra)}\n`;
    message += `With Extra: ₹${formatCurrency(result.totalCostWithExtra)}\n`;
    message += `*Total Savings: ₹${formatCurrency(result.interestSaved)}*\n`;
    message += `*Total Extra Paid: ₹${formatCurrency(result.totalExtraPaid)}*\n`;

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
            Monthly Extra Payment
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            Pay extra every month on top of your EMI to reduce your loan tenure. This strategy helps you pay off your loan faster and save on interest while maintaining a consistent monthly payment schedule.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Left: Inputs */}
        <div className="bg-gray-800 rounded-2xl shadow-lg flex-1 p-6">
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

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Extra Payment</h2>
            <MoneyInput
              label="Monthly Extra Amount"
              id="monthlyExtra"
              value={monthlyExtra}
              onChange={(val) => {
                const clamped = Math.max(VALIDATION_RULES.monthlyExtra.min, Math.min(val, VALIDATION_RULES.monthlyExtra.max));
                setMonthlyExtra(clamped);
              }}
              min={VALIDATION_RULES.monthlyExtra.min}
              max={VALIDATION_RULES.monthlyExtra.max}
              error={validate.monthlyExtra}
              helperText={`Range: ${formatINR(VALIDATION_RULES.monthlyExtra.min)} - ${formatINR(VALIDATION_RULES.monthlyExtra.max)}`}
            />
          </div>
        </div>

        {/* Right: Results */}
        <div className={`bg-gray-800 rounded-2xl shadow-lg flex-1 p-6 min-w-[0] ${!isValid ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="text-xl font-semibold text-white mb-4">
            Payment Impact
            {!isValid && (
              <span className="ml-2 text-sm font-normal text-red-400">Invalid Inputs</span>
            )}
          </h2>

          {isValid && result && (
            <>
              {/* Interest Saved */}
              <div className="mb-6 text-center">
                <div className="text-base text-gray-400 font-medium uppercase tracking-wide mb-1">
                  Interest Saved
                </div>
                <div className="font-extrabold text-3xl md:text-4xl text-green-400 mb-1 select-all">
                  {formatINR(result.interestSaved)}
                </div>
                {result.tenureReduced > 0 && (
                  <div className="mt-2 text-base text-gray-200 font-medium">
                    Tenure Reduced:&nbsp;
                    <span className="text-green-300 font-semibold">
                      {result.tenureReduced} months
                    </span>
                    &nbsp;(
                    <span className="text-green-300">
                      {formatMonthsYears(result.tenureReduced)}
                    </span>
                    )
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className="mb-5 space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Original EMI</span>
                  <span className="text-white font-semibold">{formatINR(result.emi)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Effective Monthly Payment</span>
                  <span className="text-green-400 font-semibold">{formatINR(result.effectiveMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Total Extra You'll Pay</span>
                  <span className="text-white font-semibold">{formatINR(result.totalExtraPaid)}</span>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="mb-5">
                <div className="w-full mb-4 rounded-lg overflow-hidden border border-gray-700">
                  <div className="grid grid-cols-3 bg-gray-700 text-gray-200 text-center text-sm">
                    <div className="p-2 font-semibold text-left pl-4"></div>
                    <div className="p-2 font-semibold">Without Extra</div>
                    <div className="p-2 font-semibold">With Extra</div>
                  </div>
                  <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base">
                    <div className="p-2 text-left pl-4">Total Cost</div>
                    <div className="p-2 font-medium text-gray-400">{formatINR(result.totalCostWithoutExtra)}</div>
                    <div className="p-2 font-medium text-green-400">{formatINR(result.totalCostWithExtra)}</div>
                  </div>
                  <div className="grid grid-cols-3 bg-gray-800 text-gray-200 text-center text-base border-t border-gray-700">
                    <div className="p-2 text-left pl-4">Tenure</div>
                    <div className="p-2 font-medium text-gray-400">
                      {result.remainingTenure} months
                    </div>
                    <div className="p-2 font-medium text-green-400">
                      {result.newTenure} months
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="mt-8 bg-gray-800 rounded-2xl shadow-lg p-3 md:p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Visual Analysis
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-200 mb-4">Payment Breakdown</h3>
                    <ResponsiveContainer width="100%" minWidth={250} height={chartHeight}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Principal", value: principal, color: "#3b82f6" },
                            { name: "Interest (With Extra)", value: Math.max(0, result.totalCostWithExtra - principal - result.totalExtraPaid), color: "#ef4444" },
                            { name: "Interest Saved", value: result.interestSaved, color: "#22c55e" },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell key="principal" fill="#3b82f6" />
                          <Cell key="interest" fill="#ef4444" />
                          <Cell key="saved" fill="#22c55e" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #4b5563',
                            borderRadius: '8px',
                            color: '#f3f4f6',
                          }}
                          formatter={(value: number | undefined, name: string | undefined) => [
                            formatINR(value ?? 0),
                            name ?? ''
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-gray-300">
                      {[
                        { name: "Principal", color: "#3b82f6" },
                        { name: "Interest (With Extra)", color: "#ef4444" },
                        { name: "Interest Saved", color: "#22c55e" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-200 mb-4">Cost Comparison</h3>
                    <ResponsiveContainer width="100%" minWidth={300} height={chartHeight}>
                      <BarChart
                        data={[
                          {
                            name: "Without",
                            Principal: principal,
                            Interest: result.totalCostWithoutExtra - principal,
                          },
                          {
                            name: "With Extra",
                            Principal: principal,
                            Interest: result.totalCostWithExtra - principal - result.totalExtraPaid,
                          },
                        ]}
                        margin={{ top: 20, right: 10, left: 50, bottom: 30 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#d1d5db', fontSize: 11 }}
                          axisLine={{ stroke: '#4b5563' }}
                          tickLine={{ stroke: '#4b5563' }}
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
                          formatter={(value: number | undefined, name: string | undefined) => [
                            formatINR(value ?? 0),
                            name === 'Principal' ? 'Principal' : 'Interest'
                          ]}
                          labelFormatter={(label) => `${label}:`}
                        />
                        <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Interest" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-blue-500"></div>
                        <span>Principal</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-red-500"></div>
                        <span>Interest</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <ExportButtons
                onDownloadPDF={generatePDF}
                onShareWhatsApp={shareOnWhatsApp}
                isGeneratingPDF={isGeneratingPDF}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
