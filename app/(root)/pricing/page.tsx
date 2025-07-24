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

      {/* Pricing Table */}
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
              cardDescription: "text-light-100 text-sm leading-relaxed",
              cardPrice: "text-center mb-6",
              cardPriceText: "text-primary-200 text-4xl font-bold",
              cardPricePeriod: "text-light-100 text-base",

              // Features
              cardFeatureList: "space-y-3 mb-8",
              cardFeatureListItem:
                "text-light-100 text-sm flex items-center gap-3",
              cardFeatureListItemIcon: "text-primary-200 text-base",

              // Buttons
              cardButton:
                "bg-primary-200 text-dark-100 border-0 rounded-full py-3 px-6 font-bold text-base w-full hover:bg-primary-100 hover:scale-105 transition-all",

              // Badge
              cardBadge:
                "bg-primary-200 text-dark-100 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 inline-block",
            },
          }}
        />
      </div>
    </div>
  );
};

export default Pricing;
