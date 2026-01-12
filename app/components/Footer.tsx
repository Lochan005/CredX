"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-800 border-t border-gray-700 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-3">
          {/* Left: Copyright */}
          <div className="text-xs text-gray-400 order-1 md:order-none">
            © 2026 Credx. All rights reserved.
          </div>

          {/* Center: Data Privacy Message */}
          <div className="text-xs text-gray-400 text-center order-2 md:order-none">
            Your data never leaves your device.
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-4 text-xs text-gray-400 order-3 md:order-none">
            <Link
              href="#"
              className="hover:text-green-400 transition-colors"
            >
              About
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="#"
              className="hover:text-green-400 transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Calculations are estimates only. Verify with your lender before making financial decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
