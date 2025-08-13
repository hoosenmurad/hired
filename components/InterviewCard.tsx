import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";

import { cn } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";
import { Sparkles, Clock } from "lucide-react";

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  createdAt,
  isPersonalized,
  profileName,
  jobTargetTitle,
  jobTargetCompany,
  duration,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <div className="card-border w-full">
      <div className="card-interview">
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="flex-shrink-0">
            {/* Type Badge and Personalization Indicator */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div
                className={cn(
                  "inline-flex px-3 py-1 rounded-full text-xs sm:text-sm",
                  badgeColor
                )}
              >
                {normalizedType}
              </div>
              {isPersonalized && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-200/10 border border-primary-200/20">
                  <Sparkles className="w-3 h-3 text-primary-200" />
                  <span className="text-xs text-primary-200 font-medium">
                    Personalized
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 leading-tight">
              {role}
            </h3>

            {/* Date, Score & Duration */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex flex-row gap-2 items-center">
                <Image
                  src="/calendar.svg"
                  width={16}
                  height={16}
                  alt="calendar"
                  className="w-4 h-4"
                />
                <p className="text-xs sm:text-sm">{formattedDate}</p>
              </div>

              <div className="flex flex-row gap-2 items-center">
                <Image
                  src="/star.svg"
                  width={16}
                  height={16}
                  alt="star"
                  className="w-4 h-4"
                />
                <p className="text-xs sm:text-sm">
                  {feedback?.totalScore || "---"}/100
                </p>
              </div>

              {/* Show duration if interview was completed */}
              {duration && (
                <div className="flex flex-row gap-2 items-center">
                  <Clock className="w-4 h-4 text-primary-200" />
                  <p className="text-xs sm:text-sm">{duration}m</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Section - Flexible */}
          <div className="flex-1 flex flex-col">
            {/* Feedback or Placeholder Text */}
            <p className="text-xs sm:text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
              {feedback?.finalAssessment ||
                (isPersonalized
                  ? `Personalized interview${
                      profileName ? ` for ${profileName}` : ""
                    }${
                      jobTargetTitle && jobTargetCompany
                        ? ` targeting ${jobTargetTitle} at ${jobTargetCompany}`
                        : ""
                    }. Take it now to improve your skills.`
                  : "You haven't taken this interview yet. Take it now to improve your skills.")}
            </p>

            {/* Action Button - Always at bottom */}
            <div className="flex-shrink-0">
              <Button
                asChild
                className="w-full h-10 sm:h-11 text-xs sm:text-sm font-medium"
              >
                <Link href={`/interview/${interviewId}`}>
                  {feedback?.totalScore ? "View Results" : "Start Interview"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
