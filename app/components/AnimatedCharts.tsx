"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";
import { fadeIn } from "../lib/animation";

// Helper: Format Indian currency (Lakhs/Crores)
function formatIndianCurrency(value: number): string {
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

// Helper: Calculate percentage
function calculatePercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return 0;
  return (value / total) * 100;
}

// Helper: Format currency for tooltip
function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

// Custom Tooltip Component for Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0];
  const value = data.value || 0;
  const name = data.name || "";
  const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
  const percentage = calculatePercentage(value, total);

  return (
    <div
      className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-2 shadow-xl max-w-[160px]"
      style={{
        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))",
        zIndex: 100,
        position: "relative",
      }}
    >
      <p className="text-white text-xs font-medium mb-1">{name}</p>
      <p className="text-white text-sm font-semibold">{formatIndianCurrency(value)}</p>
      <p className="text-gray-400 text-xs mt-0.5">{percentage.toFixed(1)}%</p>
    </div>
  );
};

// Custom Tooltip Component for Bar Chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-2 shadow-xl max-w-[160px]"
      style={{
        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))",
      }}
    >
      <p className="text-white text-xs font-medium mb-1.5">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5 mb-0.5 last:mb-0">
          <div
            className="w-2 h-2 rounded flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400 text-xs capitalize">{entry.name}:</span>
          <span className="text-white text-sm font-semibold">{formatIndianCurrency(entry.value || 0)}</span>
        </div>
      ))}
    </div>
  );
};

interface PieChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface AnimatedPieChartProps {
  data: PieChartData[];
  title?: string;
  delay?: number;
}

export function AnimatedPieChart({
  data,
  title,
  delay = 0,
}: AnimatedPieChartProps) {
  const [showLabels, setShowLabels] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLabels(true);
    }, delay * 1000 + 1500);
    return () => clearTimeout(timer);
  }, [delay]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate Total to Pay: Sum of all values MINUS Interest Saved
  const interestSavedValue = data.find(item => 
    item.name.toLowerCase().includes("saved")
  )?.value || 0;
  
  const totalToPay = total - interestSavedValue;

  return (
    <motion.div
      className="relative"
      style={{
        background: "rgba(31, 41, 55, 0.7)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "24px",
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      {title && (
        <h3 className="text-white text-lg font-semibold mb-4">{title}</h3>
      )}
      <div 
        className="relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <defs>
              <linearGradient id="gradientPrincipal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="gradientInterest" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="gradientSaved" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              innerRadius={60}
              outerRadius={90}
              cornerRadius={4}
              fill="#8884d8"
              dataKey="value"
              animationBegin={delay * 1000}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => {
                let gradientId = "";
                if (entry.name.toLowerCase().includes("principal")) {
                  gradientId = "gradientPrincipal";
                } else if (entry.name.toLowerCase().includes("interest") && !entry.name.toLowerCase().includes("saved")) {
                  gradientId = "gradientInterest";
                } else if (entry.name.toLowerCase().includes("saved")) {
                  gradientId = "gradientSaved";
                }

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={gradientId ? `url(#${gradientId})` : entry.color}
                    style={{
                      filter: `drop-shadow(0 0 8px ${entry.color}40)`,
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip 
              content={<CustomPieTooltip />}
              wrapperStyle={{ zIndex: 50 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label Overlay - Only show when not hovering */}
        {!isHovering && (
          <div 
            className="absolute pointer-events-none"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <p className="text-white font-bold text-lg md:text-xl lg:text-2xl text-center">
              {formatIndianCurrency(totalToPay)}
            </p>
            <p className="text-gray-400 text-xs text-center mt-1">
              Total to Pay
            </p>
          </div>
        )}
      </div>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {data.map((entry, index) => {
          const percentage = calculatePercentage(entry.value, total);
          let gradientId = "";
          if (entry.name.toLowerCase().includes("principal")) {
            gradientId = "gradientPrincipal";
          } else if (entry.name.toLowerCase().includes("interest") && !entry.name.toLowerCase().includes("saved")) {
            gradientId = "gradientInterest";
          } else if (entry.name.toLowerCase().includes("saved")) {
            gradientId = "gradientSaved";
          }

          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded"
                style={{
                  background: gradientId ? `url(#${gradientId})` : entry.color,
                  boxShadow: `0 0 4px ${entry.color}60`,
                }}
              />
              <span className="text-gray-300 font-medium">{entry.name}</span>
              <span className="text-white font-semibold">{formatINR(entry.value)}</span>
              <span className="text-gray-500">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface BarChartData {
  name: string;
  value?: number;
  principal?: number;
  interest?: number;
  color?: string;
  [key: string]: any;
}

interface AnimatedBarChartProps {
  data: BarChartData[];
  title?: string;
  delay?: number;
  stacked?: boolean;
}

export function AnimatedBarChart({
  data,
  title,
  delay = 0,
  stacked = false,
}: AnimatedBarChartProps) {
  return (
    <motion.div
      className="relative"
      style={{
        background: "rgba(31, 41, 55, 0.7)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        padding: "24px",
      }}
      {...fadeIn}
      transition={{ delay }}
    >
      {title && (
        <h3 className="text-white text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: 50, bottom: 30 }}
        >
          <defs>
            <linearGradient id="barGradientPrincipal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="barGradientInterest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fill: "#d1d5db", fontSize: 11 }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={{ stroke: "#4b5563" }}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={{ stroke: "#4b5563" }}
            tickFormatter={formatIndianCurrency}
            width={50}
          />
          {/* Grid Lines */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            strokeOpacity={0.5}
            horizontal={true}
            vertical={false}
          />
          <Tooltip 
            content={<CustomBarTooltip />} 
            cursor={false}
          />
          {stacked ? (
            <>
              <Bar
                dataKey="principal"
                stackId="stack"
                fill="url(#barGradientPrincipal)"
                stroke="none"
                radius={[0, 0, 0, 0]}
                animationBegin={delay * 1000}
                animationDuration={1200}
                animationEasing="ease-out"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))",
                }}
                activeBar={{
                  stroke: "none",
                  strokeWidth: 0,
                  fill: "url(#barGradientPrincipal)",
                  filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))",
                }}
              />
              <Bar
                dataKey="interest"
                stackId="stack"
                fill="url(#barGradientInterest)"
                stroke="none"
                radius={[8, 8, 0, 0]}
                animationBegin={delay * 1000 + 100}
                animationDuration={1200}
                animationEasing="ease-out"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))",
                }}
                activeBar={{
                  stroke: "none",
                  strokeWidth: 0,
                  fill: "url(#barGradientInterest)",
                  filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))",
                }}
              />
            </>
          ) : (
            <Bar
              dataKey="value"
              fill="url(#barGradientPrincipal)"
              stroke="none"
              radius={[8, 8, 0, 0]}
              animationBegin={delay * 1000}
              animationDuration={1200}
              animationEasing="ease-out"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))",
              }}
              activeBar={{
                stroke: "none",
                strokeWidth: 0,
                filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))",
              }}
            >
              {data.map((entry, index) => {
                let gradientId = "barGradientPrincipal";
                if (entry.color) {
                  if (entry.color.includes("#ef4444") || entry.color.includes("red")) {
                    gradientId = "barGradientInterest";
                  }
                }
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={gradientId === "barGradientInterest" ? "url(#barGradientInterest)" : "url(#barGradientPrincipal)"}
                    stroke="none"
                  />
                );
              })}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
