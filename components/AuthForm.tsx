"use client";

import { useState, useEffect, useRef } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Loader } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle navigation after successful auth
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsLoading(true);
      // Add a small delay for smooth transition
      setTimeout(() => {
        if (type === "sign-up") {
          router.push("/onboarding/profile");
        } else {
          router.push("/");
        }
      }, 500);
    }
  }, [isSignedIn, isLoaded, type, router]);

  // Monitor form submissions to trigger loading state
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFormSubmit = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "FORM" || target.closest("form")) {
        setIsLoading(true);
        // Reset loading state after 5 seconds if no redirect happens
        setTimeout(() => {
          if (!isSignedIn) {
            setIsLoading(false);
          }
        }, 5000);
      }
    };

    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest("button");
      if (
        button &&
        (button.type === "submit" || button.textContent?.includes("Sign"))
      ) {
        setIsLoading(true);
        setTimeout(() => {
          if (!isSignedIn) {
            setIsLoading(false);
          }
        }, 5000);
      }
    };

    container.addEventListener("submit", handleFormSubmit, true);
    container.addEventListener("click", handleButtonClick, true);

    return () => {
      container.removeEventListener("submit", handleFormSubmit, true);
      container.removeEventListener("click", handleButtonClick, true);
    };
  }, [isSignedIn]);

  const customAppearance = {
    baseTheme: dark,
    elements: {
      formButtonPrimary: {
        backgroundColor: "#cac5fe",
        color: "#020408",
        borderRadius: "9999px",
        fontWeight: "bold",
        fontSize: "16px",
        minHeight: "48px",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: "#b8b0fe",
        },
        "&:focus": {
          backgroundColor: "#b8b0fe",
        },
        "&:disabled": {
          backgroundColor: "#4f557d",
          cursor: "not-allowed",
        },
      },
      card: {
        borderRadius: "16px",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      },
      rootBox: {
        backgroundColor: "transparent",
      },
      formFieldInput: {
        backgroundColor: "#27282f",
        borderRadius: "9999px",
        minHeight: "48px",
        padding: "0 20px",
        border: "none",
        color: "#ffffff",
        "&::placeholder": {
          color: "#d6e0ff",
        },
        "&:focus": {
          backgroundColor: "#27282f",
          border: "2px solid #cac5fe",
          outline: "none",
        },
      },
      formFieldLabel: {
        color: "#d6e0ff",
        fontWeight: "normal",
      },
      dividerLine: {
        backgroundColor: "#4f557d",
      },
      dividerText: {
        color: "#d6e0ff",
      },
      socialButtonsBlockButton: {
        backgroundColor: "#27282f",
        border: "1px solid #4f557d",
        borderRadius: "9999px",
        color: "#ffffff",
        minHeight: "48px",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: "#3a3b43",
          borderColor: "#cac5fe",
        },
      },
      footerActionLink: {
        color: "#cac5fe",
        "&:hover": {
          color: "#b8b0fe",
        },
      },
      identityPreviewText: {
        color: "#d6e0ff",
      },
      identityPreviewEditButton: {
        color: "#cac5fe",
      },
      footerAction: {
        color: "#d6e0ff",
      },
      footerActionText: {
        color: "#d6e0ff",
      },
    },
  };

  return (
    <div className="card-border relative" ref={containerRef}>
      <div className="flex flex-col gap-6 card py-14 px-10 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-dark-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
            <div className="flex items-center space-x-3 bg-dark-200 px-8 py-6 rounded-2xl border border-primary-200/30 shadow-lg animate-pulse-gentle">
              <Loader className="animate-spin h-6 w-6 text-primary-200" />
              <span className="text-white font-medium text-lg">
                {type === "sign-in"
                  ? "Signing you in..."
                  : "Creating your account..."}
              </span>
            </div>
          </div>
        )}

        <div
          className={`transition-all duration-300 ${
            isLoading ? "opacity-30 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {type === "sign-in" ? (
            <SignIn appearance={customAppearance} routing="hash" />
          ) : (
            <SignUp appearance={customAppearance} routing="hash" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
