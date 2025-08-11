import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";
import { Sparkles, Clock } from "lucide-react";

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  specialtySkills,
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
    <div className="card-border w-[360px] max-sm:w-full">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg max-sm:px-3 max-sm:py-1.5",
              badgeColor
            )}
          >
            <p className="badge-text max-sm:text-sm">{normalizedType}</p>
          </div>

          {/* Personalization Badge - Only if personalized */}
          {isPersonalized && (
            <div className="absolute top-0 left-0 w-fit px-2 py-1 rounded-br-lg bg-primary-200 text-dark-100">
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5" />
                <span className="text-xs font-semibold max-sm:text-[10px]">
                  AI
                </span>
              </div>
            </div>
          )}

          {/* Interview Role */}
          <h3 className="mt-3 capitalize max-sm:text-lg">
            {role} Interview
            {/* Subtle personalization indicator in title */}
            {isPersonalized && (
              <span className="ml-2 text-primary-200 text-sm max-sm:text-xs">
                ✨
              </span>
            )}
          </h3>

          {/* Date, Score & Duration */}
          <div className="flex flex-wrap gap-4 mt-3 max-sm:gap-3">
            <div className="flex flex-row gap-2 items-center">
              <Image
                src="/calendar.svg"
                width={20}
                height={20}
                alt="calendar"
                className="max-sm:w-4 max-sm:h-4"
              />
              <p className="text-sm max-sm:text-xs">{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image
                src="/star.svg"
                width={20}
                height={20}
                alt="star"
                className="max-sm:w-4 max-sm:h-4"
              />
              <p className="text-sm max-sm:text-xs">
                {feedback?.totalScore || "---"}/100
              </p>
            </div>

            {/* Show duration if interview was completed */}
            {duration && (
              <div className="flex flex-row gap-2 items-center">
                <Clock className="w-5 h-5 text-primary-200 max-sm:w-4 max-sm:h-4" />
                <p className="text-sm max-sm:text-xs">{duration}m</p>
              </div>
            )}
          </div>

          {/* Feedback or Placeholder Text with optional personalization hint */}
          <p className="line-clamp-3 mt-4 text-sm max-sm:text-xs max-sm:line-clamp-2">
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
        </div>

        <div className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:justify-between sm:items-end">
          <DisplayTechIcons specialtySkills={specialtySkills} />

          <Button className="btn-primary w-full sm:w-auto max-sm:text-sm">
            <Link
              href={
                feedback
                  ? `/interview/${interviewId}/feedback`
                  : `/interview/${interviewId}`
              }
            >
              {feedback ? "Check Feedback" : "Take Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
