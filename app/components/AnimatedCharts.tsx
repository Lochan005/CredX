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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { fadeIn } from "../lib/animation";

// Format currency for Y-axis
function formatCurrencyYAxis(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

// Format currency for tooltip
function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLabels(true);
    }, delay * 1000 + 1500); // After chart animation completes
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <motion.div
      className="bg-gray-800 rounded-xl p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      {title && (
        <h3 className="text-white text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? undefined : false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            animationBegin={delay * 1000}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #4b5563",
              borderRadius: "8px",
              color: "#f3f4f6",
            }}
            formatter={(value: number | undefined, name: string | undefined) => [
              formatINR(value ?? 0),
              name ?? "",
            ]}
          />
          <Legend
            wrapperStyle={{ color: "#d1d5db", fontSize: "11px" }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
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
      className="bg-gray-800 rounded-xl p-4"
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
          <XAxis
            dataKey="name"
            tick={{ fill: "#d1d5db", fontSize: 11 }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={{ stroke: "#4b5563" }}
          />
          <YAxis
            tick={{ fill: "#d1d5db", fontSize: 10 }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={{ stroke: "#4b5563" }}
            tickFormatter={formatCurrencyYAxis}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #4b5563",
              borderRadius: "8px",
              color: "#f3f4f6",
            }}
            formatter={(value: number | undefined, name: string | undefined) => [
              formatINR(value ?? 0),
              name === "Principal"
                ? "Principal"
                : name === "Interest"
                ? "Interest"
                : name ?? "",
            ]}
            labelFormatter={(label) => `${label}:`}
          />
          {stacked ? (
            <>
              <Bar
                dataKey="principal"
                stackId="stack"
                fill="#3b82f6"
                radius={[0, 0, 0, 0]}
                animationBegin={delay * 1000}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="interest"
                stackId="stack"
                fill="#ef4444"
                radius={[8, 8, 0, 0]}
                animationBegin={delay * 1000 + 100}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </>
          ) : (
            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              animationBegin={delay * 1000}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
