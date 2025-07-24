import { getUserPlanInfo } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Crown, Zap, Target } from "lucide-react";

const PlanStatus = async () => {
  const planInfo = await getUserPlanInfo();

  if (!planInfo.isSubscribed) {
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

  const getPlanIcon = () => {
    switch (planInfo.plan) {
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
    switch (planInfo.plan) {
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

  return (
    <div
      className={`bg-gradient-to-br from-dark-200 to-dark-300 border border-white/10 rounded-2xl p-6`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
          {getPlanIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{getPlanName()}</h3>
          <p className="text-light-100 text-sm">
            {planInfo.interviewLimit} interviews • {planInfo.interviewTimeLimit}{" "}
            minutes
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Link href="/pricing">Manage Plan</Link>
        </Button>
      </div>
    </div>
  );
};

export default PlanStatus;
