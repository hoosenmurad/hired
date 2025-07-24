import CreateForm from "@/components/CreateForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { getUserPlanInfo } from "@/lib/billing";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

const CreateInterview = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const planInfo = await getUserPlanInfo();

  if (!planInfo.isSubscribed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 pattern">
        <div className="max-w-md w-full bg-gradient-to-br from-dark-200 to-dark-300 border border-white/10 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-200/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary-200" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Subscription Required
          </h1>
          <p className="text-light-100 mb-6 leading-relaxed">
            To create AI-powered mock interviews, you need an active
            subscription plan. Choose from our flexible plans starting at just
            $27/month.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full btn-primary">
              <Link href="/pricing">
                <Crown className="w-4 h-4 mr-2" />
                View Pricing Plans
              </Link>
            </Button>

            <p className="text-xs text-light-100/70">
              All plans include detailed feedback and unlimited retakes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <CreateForm />;
};

export default CreateInterview;
