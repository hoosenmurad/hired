import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
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
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              badgeColor
            )}
          >
            <p className="badge-text">{normalizedType}</p>
          </div>

          {/* Personalization Badge - Only if personalized */}
          {isPersonalized && (
            <div className="absolute top-0 left-0 w-fit px-2 py-1 rounded-br-lg bg-primary-200 text-dark-100">
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span className="text-xs font-semibold">AI</span>
              </div>
            </div>
          )}

          {/* Cover Image */}
          <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={90}
            height={90}
            className="rounded-full object-fit size-[90px]"
          />

          {/* Interview Role */}
          <h3 className="mt-5 capitalize">
            {role} Interview
            {/* Subtle personalization indicator in title */}
            {isPersonalized && (
              <span className="ml-2 text-primary-200 text-sm">✨</span>
            )}
          </h3>

          {/* Date, Score & Duration */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image
                src="/calendar.svg"
                width={22}
                height={22}
                alt="calendar"
              />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p>{feedback?.totalScore || "---"}/100</p>
            </div>

            {/* Show duration if interview was completed */}
            {duration && (
              <div className="flex flex-row gap-2 items-center">
                <Clock className="w-[22px] h-[22px] text-primary-200" />
                <p>{duration}m</p>
              </div>
            )}
          </div>

          {/* Feedback or Placeholder Text with optional personalization hint */}
          <p className="line-clamp-2 mt-5">
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

        <div className="flex flex-row justify-between">
          <DisplayTechIcons specialtySkills={specialtySkills} />

          <Button className="btn-primary">
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
