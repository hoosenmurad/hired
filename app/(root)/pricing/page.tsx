"use client";

import { PricingTable } from "@clerk/nextjs";

const Pricing = () => {
  return (
    <div className="min-h-screen pattern">
      {/* Header */}
      <div className="pt-24 pb-12 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary-100 to-primary-200 bg-clip-text text-transparent mb-4">
          Choose Your <span className="text-primary-200">Plan</span>
        </h1>
        <p className="text-xl text-light-100 max-w-2xl mx-auto">
          Invest in your career with professional AI interview training
        </p>
      </div>

      {/* Clerk Pricing Table */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
        <PricingTable
          appearance={{
            variables: {
              colorBackground: "#1a1527", // deep dark purple background
              colorText: "#ffffff", // main text white
              colorTextSecondary: "#d6c5e0", // light lavender secondary text
              colorPrimary: "#8b5cf6", // vibrant purple for primary
              colorSuccess: "#7c3aed", // purple success tone
              colorDanger: "#a855f7", // lighter purple-red
              borderRadius: "8px",
              spacingUnit: "1rem",
            },
            elements: {
              rootBox: "bg-transparent",

              // Billing toggle
              toggleGroup:
                "bg-black/50 border border-purple-700/40 rounded-lg p-1.5",
              toggleGroupItem:
                "text-white bg-transparent border border-transparent hover:bg-purple-900/40 hover:border-purple-600/40 px-4 py-2 rounded-md font-medium transition-all",
              toggleGroupItemActive:
                "bg-purple-600 text-white border-purple-500 shadow-sm",

              // Cards
              card: "bg-gradient-to-br from-purple-900/90 to-black/90 border border-purple-700/40 rounded-xl p-6 hover:scale-[1.01] hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20",
              cardPopular:
                "border-2 border-purple-400 ring-2 ring-purple-300/30 shadow-lg shadow-purple-500/25",

              // Card content
              cardHeader: "text-center mb-6",
              cardTitle: "text-white text-2xl font-bold mb-2",
              cardDescription: "text-purple-200 text-sm mb-4",
              cardPrice: "text-center mb-6",
              cardPriceText: "text-4xl font-bold text-purple-300",
              cardPriceSubtext: "text-purple-200 text-base",

              // Features
              cardFeatures: "space-y-3 mb-8",
              cardFeature: "flex items-center gap-3 text-purple-100",
              cardFeatureIcon: "text-purple-300 flex-shrink-0",

              // CTA Button
              cardCta: "w-full",
              cardCtaButton:
                "w-full px-6 py-3 rounded-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98]",
              cardCtaButtonPopular:
                "w-full px-6 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98]",

              // Footer
              cardFooter: "text-center mt-6",
              cardFooterText: "text-purple-300 text-sm",
            },
          }}
        />
      </div>

      {/* Additional Info */}
      <div className="max-w-4xl mx-auto px-6 mt-16 text-center">
        <div className="bg-gradient-to-r from-dark-200/50 to-dark-300/50 border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">Why Choose HiredAI?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-light-100">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary-200/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-200 text-xl">🎯</span>
              </div>
              <h4 className="font-semibold">Personalized Training</h4>
              <p className="text-sm">
                AI-powered questions tailored to your experience and target
                roles
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary-200/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-200 text-xl">🗣️</span>
              </div>
              <h4 className="font-semibold">Voice Interviews</h4>
              <p className="text-sm">
                Practice with realistic voice interactions, just like real
                interviews
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary-200/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-200 text-xl">📊</span>
              </div>
              <h4 className="font-semibold">Detailed Feedback</h4>
              <p className="text-sm">
                Comprehensive performance analysis to improve your interview
                skills
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
