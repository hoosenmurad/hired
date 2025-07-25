import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";

import Agent from "@/components/Agent";
import { Button } from "@/components/ui/button";
import { getRandomInterviewCover } from "@/lib/utils";
import {
  checkQuotaAvailability,
  getSessionTimeoutMinutes,
  getUserPlanInfo,
} from "@/lib/billing";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import { Clock, AlertTriangle } from "lucide-react";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  // Check if user can start interview based on session quota and timeout limits
  const questionCount = interview.questions?.length || 5;
  const { isSubscribed } = await getUserPlanInfo();

  if (!isSubscribed) {
    return (
      <>
        <div className="flex flex-row gap-4 justify-between">
          <div className="flex flex-row gap-4 items-center max-sm:flex-col">
            <div className="flex flex-row gap-4 items-center">
              <Image
                src={getRandomInterviewCover()}
                alt="cover-image"
                width={40}
                height={40}
                className="rounded-full object-cover size-[40px]"
              />
              <h3 className="capitalize">{interview.role} Interview</h3>
            </div>
            <DisplayTechIcons specialtySkills={interview.specialtySkills} />
          </div>
          <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
            {interview.type}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Subscription Required
          </h2>
          <p className="text-light-100 mb-6 leading-relaxed max-w-md mx-auto">
            Please subscribe to a plan to start interviews.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild className="btn-primary">
              <Link href="/pricing">Subscribe Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const sessionMinutesQuota = await checkQuotaAvailability(
    user.id,
    "sessionMinutes",
    questionCount * 3
  );
  const availableTimeout = await getSessionTimeoutMinutes(
    user.id,
    questionCount
  );
  const requiredMinutes = questionCount * 3;

  // If user doesn't have enough session minutes, show blocked state
  if (!sessionMinutesQuota.allowed || availableTimeout <= 0) {
    return (
      <>
        <div className="flex flex-row gap-4 justify-between">
          <div className="flex flex-row gap-4 items-center max-sm:flex-col">
            <div className="flex flex-row gap-4 items-center">
              <Image
                src={getRandomInterviewCover()}
                alt="cover-image"
                width={40}
                height={40}
                className="rounded-full object-cover size-[40px]"
              />
              <h3 className="capitalize">{interview.role} Interview</h3>
            </div>

            <DisplayTechIcons specialtySkills={interview.specialtySkills} />
          </div>

          <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
            {interview.type}
          </p>
        </div>

        {/* Insufficient minutes message */}
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Insufficient Session Minutes
          </h2>
          <p className="text-light-100 mb-6 leading-relaxed max-w-md mx-auto">
            You need {requiredMinutes} minutes for this interview but only have{" "}
            {sessionMinutesQuota.remaining} minutes remaining this month.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild className="btn-primary">
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Show warning if user is running low on minutes (less than 15 minute buffer)
  const showWarning =
    sessionMinutesQuota.remaining < requiredMinutes + 15 &&
    sessionMinutesQuota.remaining >= requiredMinutes;

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">{interview.role} Interview</h3>
          </div>

          <DisplayTechIcons specialtySkills={interview.specialtySkills} />
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
          {interview.type}
        </p>
      </div>

      {/* Low time warning */}
      {showWarning && (
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-200 font-medium">
                Low on session minutes
              </p>
              <p className="text-yellow-100/80 text-sm">
                You have {sessionMinutesQuota.remaining} minutes remaining this
                month. This interview needs {requiredMinutes} minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      <Agent
        userName={user.name}
        userId={user.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
        feedbackId={feedback?.id}
      />
    </>
  );
};

export default InterviewDetails;
