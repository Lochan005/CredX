import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center px-4 py-12 md:py-16">
      {/* Hero Section */}
      <div className="w-full max-w-4xl mx-auto text-center mb-12 md:mb-16">
        <h1 className="text-6xl md:text-7xl font-extrabold text-green-400 mb-4 drop-shadow-sm tracking-tight">
          Credx
        </h1>
        <p className="text-2xl md:text-3xl font-medium text-gray-200 mb-6 tracking-tight">
          Smart Loan Prepayment Calculator
        </p>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Discover how much you can save on your loan by prepaying smartly
        </p>
      </div>

      {/* Scenario Selection Cards */}
      <div className="w-full max-w-6xl mx-auto mb-12">
        <h2 className="text-2xl font-semibold text-white mb-8 text-center">
          Choose your scenario:
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 - Lump Sum Prepayment */}
          <Link
            href="/lump-sum"
            className="group bg-gray-800 rounded-xl p-6 md:p-8 border-2 border-transparent hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 flex flex-col h-full"
          >
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-3">Lump Sum Prepayment</h3>
            <p className="text-gray-400 mb-6 flex-grow">
              Pay a one-time large amount to reduce your loan tenure or EMI
            </p>
            <div className="flex items-center text-green-400 font-semibold group-hover:gap-2 transition-all">
              <span>Get Started</span>
              <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 2 - Monthly Extra Payment */}
          <Link
            href="/monthly-extra"
            className="group bg-gray-800 rounded-xl p-6 md:p-8 border-2 border-transparent hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 flex flex-col h-full"
          >
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-white mb-3">Monthly Extra Payment</h3>
            <p className="text-gray-400 mb-6 flex-grow">
              Add extra amount to your EMI every month and become debt-free faster
            </p>
            <div className="flex items-center text-green-400 font-semibold group-hover:gap-2 transition-all">
              <span>Get Started</span>
              <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 3 - Refinance Comparison */}
          <Link
            href="/refinance"
            className="group bg-gray-800 rounded-xl p-6 md:p-8 border-2 border-transparent hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 flex flex-col h-full"
          >
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold text-white mb-3">Refinance Comparison</h3>
            <p className="text-gray-400 mb-6 flex-grow">
              Should you switch to a lower rate? Compare staying, prepaying, refinancing, or doing both
            </p>
            <div className="flex items-center text-green-400 font-semibold group-hover:gap-2 transition-all">
              <span>Get Started</span>
              <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 4 - Compare All (Coming Soon) */}
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 border-2 border-gray-700 opacity-60 flex flex-col h-full relative">
            <div className="absolute top-4 right-4">
              <span className="bg-gray-700 text-gray-400 text-xs font-semibold px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="text-4xl mb-4 opacity-50">📊</div>
            <h3 className="text-xl font-bold text-white mb-3 opacity-75">Compare All Scenarios</h3>
            <p className="text-gray-500 mb-6 flex-grow">
              Not sure which option? Compare all scenarios side by side
            </p>
            <div className="flex items-center text-gray-600 font-semibold">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm md:text-base">100% Free</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm md:text-base">No Sign-up Required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm md:text-base">Data Never Leaves Your Device</span>
          </div>
        </div>
      </div>
    </div>
  );
}
