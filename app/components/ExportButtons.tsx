"use client";

import React from "react";

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
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      {/* Download PDF Button */}
      <button
        type="button"
        onClick={onDownloadPDF}
        disabled={isGeneratingPDF}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingPDF ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
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
            <span>Download PDF</span>
          </>
        )}
      </button>

      {/* Share on WhatsApp Button */}
      <button
        type="button"
        onClick={onShareWhatsApp}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border-2 border-green-500 text-green-500 font-semibold rounded-lg hover:bg-green-500 hover:text-white transition-all"
      >
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
        <span>Share on WhatsApp</span>
      </button>
    </div>
  );
}
