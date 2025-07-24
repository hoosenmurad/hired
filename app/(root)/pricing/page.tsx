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
            baseTheme: undefined,
            variables: {
              colorBackground: "transparent",
              colorText: "#ffffff",
              colorTextSecondary: "#f0f4ff",
              colorPrimary: "#cac5fe",
              colorSuccess: "#cac5fe",
              borderRadius: "16px",
              fontFamily: '"Mona Sans", sans-serif',
            },
            elements: {
              // Main container
              rootBox: {
                background: "transparent",
              },

              // Billing toggle container
              pricingToggle: {
                background: "rgba(26, 28, 32, 0.8)",
                border: "1px solid rgba(202, 197, 254, 0.3)",
                borderRadius: "12px",
                padding: "8px",
                marginBottom: "32px",
              },

              // Billing toggle buttons (inactive state)
              pricingToggleButton: {
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.15)",
                  borderColor: "rgba(202, 197, 254, 0.4)",
                  color: "#ffffff",
                },
              },

              // Active billing toggle button
              pricingToggleButtonActive: {
                background: "#cac5fe",
                color: "#020408",
                border: "1px solid #cac5fe",
                fontWeight: "700",
                "&:hover": {
                  background: "#b8b0fe",
                  color: "#020408",
                  borderColor: "#b8b0fe",
                },
              },

              // Pricing cards
              pricingCard: {
                background: "linear-gradient(135deg, #1a1c20 0%, #08090d 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "32px 24px",
                margin: "8px",
                color: "#ffffff",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  borderColor: "rgba(202, 197, 254, 0.3)",
                },
              },

              // Popular card highlighting
              pricingCardPopular: {
                border: "2px solid rgba(202, 197, 254, 0.5)",
                boxShadow:
                  "0 0 0 1px rgba(202, 197, 254, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              },

              // Card headers
              pricingCardHeader: {
                textAlign: "center",
                marginBottom: "24px",
              },

              // Plan titles
              pricingCardTitle: {
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "700",
                marginBottom: "8px",
              },

              // Plan descriptions
              pricingCardDescription: {
                color: "#f0f4ff",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "16px",
                fontWeight: "400",
              },

              // Pricing display
              pricingCardPrice: {
                textAlign: "center",
                marginBottom: "24px",
              },

              pricingCardPriceText: {
                color: "#cac5fe",
                fontSize: "36px",
                fontWeight: "800",
              },

              // Features list
              pricingCardFeatureList: {
                listStyle: "none",
                padding: "0",
                margin: "16px 0 24px 0",
              },

              pricingCardFeatureListItem: {
                color: "#f0f4ff",
                fontSize: "15px",
                margin: "12px 0",
                paddingLeft: "24px",
                position: "relative",
                lineHeight: "1.5",
                fontWeight: "500",
                "&::before": {
                  content: "'✓'",
                  position: "absolute",
                  left: "0",
                  color: "#cac5fe",
                  fontWeight: "bold",
                  fontSize: "16px",
                },
              },

              // Buttons - using dark text for better contrast on purple background
              pricingCardButton: {
                background: "#cac5fe",
                color: "#1a1c20",
                border: "none",
                borderRadius: "25px",
                padding: "14px 28px",
                fontSize: "16px",
                fontWeight: "700",
                width: "100%",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "#b8b0fe",
                  color: "#1a1c20",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(202, 197, 254, 0.3)",
                },
              },

              // Popular badge
              pricingCardBadge: {
                background: "#cac5fe",
                color: "#1a1c20",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "16px",
                display: "inline-block",
              },

              // Period text (e.g., "/month")
              pricingCardPricePeriod: {
                color: "#f0f4ff",
                fontSize: "16px",
                fontWeight: "500",
              },

              // Additional text elements for better contrast
              pricingCardText: {
                color: "#f0f4ff",
                fontWeight: "500",
              },

              // Savings badge/text
              pricingCardSavings: {
                color: "#4ade80",
                fontWeight: "600",
                fontSize: "14px",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Pricing;
