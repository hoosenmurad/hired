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
              colorBackground: "transparent",
              colorText: "#ffffff",
              colorTextSecondary: "#f0f4ff",
              colorPrimary: "#cac5fe",
              colorSuccess: "#cac5fe",
              colorDanger: "#ef4444",
              borderRadius: "16px",
              spacingUnit: "1rem",
            },
            elements: {
              rootBox: "bg-transparent",

              // Billing toggle
              toggleGroup:
                "bg-dark-200/80 border border-primary-200/30 rounded-xl p-2",
              toggleGroupItem:
                "text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:border-primary-200/40",
              toggleGroupItemActive:
                "bg-primary-200 text-dark-100 border-primary-200",

              // Cards
              card: "bg-gradient-to-br from-dark-200 to-dark-300 border border-white/10 rounded-2xl p-8 hover:scale-[1.02] hover:border-primary-200/30 transition-all",
              cardPopular:
                "border-2 border-primary-200/50 ring-1 ring-primary-200/20",

              // Card content
              cardHeader: "text-center mb-6",
              cardTitle: "text-white text-2xl font-bold mb-2",
              cardDescription: "text-light-100 text-sm mb-4",
              cardPrice: "text-center mb-6",
              cardPriceText: "text-4xl font-bold text-primary-200",
              cardPriceSubtext: "text-light-100 text-base",

              // Features
              cardFeatures: "space-y-3 mb-8",
              cardFeature: "flex items-center gap-3 text-light-100",
              cardFeatureIcon: "text-primary-200 flex-shrink-0",

              // CTA Button
              cardCta: "w-full",
              cardCtaButton:
                "w-full px-6 py-3 rounded-full font-bold transition-colors bg-primary-200 text-dark-100 hover:bg-primary-100",
              cardCtaButtonPopular:
                "w-full px-6 py-3 rounded-full font-bold transition-colors bg-primary-200 text-dark-100 hover:bg-primary-100",

              // Footer
              cardFooter: "text-center mt-6",
              cardFooterText: "text-light-100 text-sm",
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
