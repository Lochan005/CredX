"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../lib/animation";
import AnimatedButton from "./AnimatedButton";

interface ExportButtonsProps {
  onDownloadPDF: () => void;
  onShareWhatsApp: () => void;
  isGeneratingPDF?: boolean;
}

export default function ExportButtons({
  onDownloadPDF,
  onShareWhatsApp,
  isGeneratingPDF = false,
}: ExportButtonsProps) {
  const downloadIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );

  const shareIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );

  return (
    <motion.div
      className="mt-6 flex flex-col sm:flex-row gap-3"
      {...fadeIn}
      transition={{ delay: 0.2 }}
    >
      {/* Download PDF Button */}
      <AnimatedButton
        variant="outline"
        onClick={onDownloadPDF}
        isLoading={isGeneratingPDF}
        icon={downloadIcon}
        className="flex-1"
      >
        Download PDF
      </AnimatedButton>

      {/* Share on WhatsApp Button */}
      <AnimatedButton
        variant="outline"
        onClick={onShareWhatsApp}
        icon={shareIcon}
        className="flex-1"
      >
        Share on WhatsApp
      </AnimatedButton>
    </motion.div>
  );
}
