import { getUserPlanInfo, getCurrentUsage, PLAN_CONFIGS } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Crown, Zap, Target, Clock } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

const PlanStatus = async () => {
  const { userId } = await auth();
  const { isSubscribed, planType } = await getUserPlanInfo();

  if (!isSubscribed || !planType || !userId) {
    return (
      <div className="bg-gradient-to-br from-dark-200 to-dark-300 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">No Active Plan</h3>
            <p className="text-light-100 text-sm">
              Subscribe to start creating interviews
            </p>
          </div>
          <Button asChild className="btn-primary">
            <Link href="/pricing">Subscribe Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  const usage = await getCurrentUsage(userId);
  const planConfig = PLAN_CONFIGS[planType];

  const getPlanIcon = () => {
    switch (planType) {
      case "hired":
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case "prepped":
        return <Zap className="w-6 h-6 text-primary-200" />;
      case "hustle":
        return <Target className="w-6 h-6 text-blue-400" />;
      default:
        return <Target className="w-6 h-6 text-gray-400" />;
    }
  };

  const getPlanName = () => {
    switch (planType) {
      case "hired":
        return "Hired Plan";
      case "prepped":
        return "Prepped Plan";
      case "hustle":
        return "Hustle Plan";
      default:
        return "Unknown Plan";
    }
  };

  const remainingMinutes =
    planConfig.maxSessionMinutes - usage.sessionMinutesThisMonth;
  const remainingInterviews =
    planConfig.interviewsPerMonth - usage.interviewsThisMonth;

  const getMinutesColor = () => {
    if (remainingMinutes <= 5) return "text-red-400";
    if (remainingMinutes <= 15) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="bg-gradient-to-br from-dark-200 to-dark-300 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
          {getPlanIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{getPlanName()}</h3>
          <p className="text-light-100 text-sm">
            {remainingInterviews} of {planConfig.interviewsPerMonth} interviews
            remaining
          </p>
        </div>
      </div>

      {/* Session Minutes Display */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary-200" />
          <span className="text-sm font-medium text-white">
            Session Minutes This Month
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${getMinutesColor()}`}>
            {remainingMinutes} minutes remaining
          </span>
          <span className="text-light-100/70">
            {usage.sessionMinutesThisMonth}/{planConfig.maxSessionMinutes}
          </span>
        </div>
        <div className="w-full bg-dark-200/50 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              remainingMinutes <= 5
                ? "bg-red-400"
                : remainingMinutes <= 15
                ? "bg-yellow-400"
                : "bg-green-400"
            }`}
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  (usage.sessionMinutesThisMonth /
                    planConfig.maxSessionMinutes) *
                    100
                )
              )}%`,
            }}
          />
        </div>
        <p className="text-xs text-light-100/70 mt-2">
          Sessions timeout at 3 minutes per question
        </p>
      </div>
    </div>
  );
};

export default PlanStatus;
