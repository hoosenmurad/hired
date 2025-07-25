import { getUserMinutes } from "@/lib/billing";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

const TimeUsageCard = async () => {
  const availableMinutes = await getUserMinutes();

  if (availableMinutes === 0) {
    return null; // Don't show if no minutes available
  }

  const getStatusIcon = () => {
    if (availableMinutes <= 5)
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    if (availableMinutes <= 15)
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <CheckCircle className="w-5 h-5 text-green-400" />;
  };

  const getStatusText = () => {
    if (availableMinutes <= 5) return "Critical";
    if (availableMinutes <= 15) return "Low";
    return "Good";
  };

  const getStatusColor = () => {
    if (availableMinutes <= 5) return "border-red-500/30 bg-red-500/10";
    if (availableMinutes <= 15) return "border-yellow-500/30 bg-yellow-500/10";
    return "border-green-500/30 bg-green-500/10";
  };

  return (
    <div className={`border rounded-2xl p-6 ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-primary-200" />
        <h3 className="text-lg font-semibold text-white">Interview Minutes</h3>
        <div className="flex items-center gap-2 ml-auto">
          {getStatusIcon()}
          <span className="text-sm font-medium text-white">
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-light-100">Available in your account</span>
          <span className="text-white font-medium">
            {availableMinutes} minutes
          </span>
        </div>

        <div className="text-xs text-light-100/70">
          <p>• Each question uses approximately 2 minutes</p>
          <p>• Minutes are deducted after each interview</p>
          <p>• Purchase more minutes by upgrading your plan</p>
        </div>
      </div>
    </div>
  );
};

export default TimeUsageCard;
