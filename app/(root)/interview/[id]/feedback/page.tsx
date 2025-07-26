import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Type definitions for enhanced feedback structure
type EnhancedStrength = {
  area: string;
  description: string;
};

type EnhancedAreaForImprovement = {
  area: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  actionableSteps: string[];
};

const Feedback = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) => {
  const { id } = await params;
  const user = await getCurrentUser();
  const { error } = await searchParams;
  const hasError = error === "generation_failed";

  if (!user) redirect("/");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  // If there's an error or no feedback, show error state
  if (hasError || !feedback) {
    return (
      <section className="section-feedback">
        <div className="flex flex-row justify-center">
          <h1 className="text-4xl font-semibold text-white text-center">
            Interview Completed -{" "}
            <span className="capitalize">{interview.role}</span> Interview
          </h1>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-red-500/20 border border-yellow-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Feedback Generation Issue
          </h2>
          <p className="text-light-100 mb-6 leading-relaxed">
            Your interview was completed successfully, but we encountered an
            issue generating your detailed feedback. This can happen with very
            short interviews or technical issues.
          </p>

          <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-white font-semibold mb-2">
              Interview Summary:
            </h3>
            <p className="text-light-100 text-sm mb-2">
              • Questions: {interview.questions?.length || 0} questions
            </p>
            <p className="text-light-100 text-sm mb-2">
              • Role: {interview.role}
            </p>
            <p className="text-light-100 text-sm">• Type: {interview.type}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild className="btn-primary">
              <Link href={`/interview/${id}`}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
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
      </section>
    );
  }

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold text-white text-center">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p className="text-light-100">
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p className="text-light-100">
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr className="border-light-600/20" />

      <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8">
        <p className="text-light-100 leading-relaxed">
          {feedback?.finalAssessment}
        </p>
      </div>

      {/* Per-Question Ratings */}
      {feedback?.questionRatings && feedback.questionRatings.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-white">Question-by-Question Analysis:</h2>
          <div className="space-y-4">
            {feedback.questionRatings.map((rating, index) => (
              <div
                key={index}
                className="bg-[#191b1f] rounded-2xl shadow-lg p-6 border border-light-600/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-white">
                    Question {index + 1}
                  </h3>
                  <span className="bg-primary-200 text-dark-100 px-3 py-1 rounded-full text-sm font-semibold">
                    {rating.rating}/100
                  </span>
                </div>
                <p className="font-medium mb-4 text-white leading-relaxed">
                  {rating.question}
                </p>
                <div className="mb-4 bg-dark-200/50 rounded-lg p-4">
                  <h4 className="font-medium text-primary-200 mb-2">
                    Your Response:
                  </h4>
                  <p className="text-light-100 italic leading-relaxed">
                    {rating.response}
                  </p>
                </div>
                <div className="bg-dark-200/50 rounded-lg p-4">
                  <h4 className="font-medium text-primary-200 mb-2">
                    Feedback:
                  </h4>
                  <p className="text-light-100 leading-relaxed">
                    {rating.feedback}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Breakdown */}
      <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8">
        <h2 className="text-white mb-6">Overall Performance Breakdown:</h2>
        <div className="space-y-4">
          {feedback?.categoryScores?.map((category, index) => (
            <div key={index} className="bg-dark-200/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-white">
                  {index + 1}. {category.name}
                </p>
                <span className="bg-primary-200 text-dark-100 px-3 py-1 rounded-full text-sm font-semibold">
                  {category.score}/100
                </span>
              </div>
              <p className="text-light-100 leading-relaxed">
                {category.comment}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8">
        <h3 className="text-white mb-4">Strengths</h3>
        <ul className="space-y-2">
          {feedback?.strengths?.map((strength, index) => (
            <li
              key={index}
              className="text-light-100 leading-relaxed flex items-start"
            >
              <span className="text-primary-200 mr-2 mt-1">•</span>
              <div>
                {typeof strength === "string" ? (
                  strength
                ) : (
                  <>
                    <strong className="text-white">
                      {(strength as EnhancedStrength).area}:
                    </strong>{" "}
                    {(strength as EnhancedStrength).description}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8">
        <h3 className="text-white mb-4">Areas for Improvement</h3>
        <ul className="space-y-4">
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index} className="text-light-100 leading-relaxed">
              {typeof area === "string" ? (
                <div>
                  <span className="text-primary-200 mr-2">•</span>
                  {area}
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <span className="text-primary-200 mr-2">•</span>
                    <strong className="text-white">
                      {(area as EnhancedAreaForImprovement).area}:
                    </strong>{" "}
                    {(area as EnhancedAreaForImprovement).description}
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs ${
                        (area as EnhancedAreaForImprovement).priority === "High"
                          ? "bg-red-500/20 text-red-300"
                          : (area as EnhancedAreaForImprovement).priority ===
                            "Medium"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      {(area as EnhancedAreaForImprovement).priority} Priority
                    </span>
                  </div>
                  {(area as EnhancedAreaForImprovement).actionableSteps &&
                    (area as EnhancedAreaForImprovement).actionableSteps
                      .length > 0 && (
                      <div className="ml-6 mt-2">
                        <p className="text-sm text-light-100/80 mb-1">
                          Action steps:
                        </p>
                        <ul className="space-y-1">
                          {(
                            area as EnhancedAreaForImprovement
                          ).actionableSteps.map(
                            (step: string, stepIndex: number) => (
                              <li
                                key={stepIndex}
                                className="text-sm text-light-100/90"
                              >
                                - {step}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/dashboard" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
