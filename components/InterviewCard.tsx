import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";
import { Sparkles, User, Briefcase } from "lucide-react";

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

          {/* Personalization Badge */}
          {isPersonalized && (
            <div className="absolute top-0 left-0 w-fit px-3 py-1 rounded-br-lg bg-primary-200 text-dark-100">
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span className="text-xs font-semibold">Personalized</span>
              </div>
            </div>
          )}

          {/* Cover Image */}
          <div className="relative w-full h-32 rounded-lg overflow-hidden mb-4">
            <Image
              src={getRandomInterviewCover()}
              alt="Interview cover"
              fill
              className="object-cover"
            />
          </div>

          {/* Interview Title */}
          <h3 className="text-xl font-bold text-white mb-2">{role}</h3>

          {/* Personalization Details */}
          {isPersonalized &&
            (profileName || (jobTargetTitle && jobTargetCompany)) && (
              <div className="mb-4 space-y-2">
                {profileName && (
                  <div className="flex items-center space-x-2 text-sm text-light-100">
                    <User className="h-4 w-4 text-primary-200" />
                    <span>Profile: {profileName}</span>
                  </div>
                )}
                {jobTargetTitle && jobTargetCompany && (
                  <div className="flex items-center space-x-2 text-sm text-light-100">
                    <Briefcase className="h-4 w-4 text-primary-200" />
                    <span>
                      Target: {jobTargetTitle} at {jobTargetCompany}
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Tech Stack */}
          <DisplayTechIcons specialtySkills={specialtySkills} />

          {/* Date */}
          <p className="text-light-100 text-sm mt-4">{formattedDate}</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          {feedback ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-light-100">Interview Score:</span>
                <span className="text-lg font-bold text-primary-200">
                  {feedback.totalScore}/100
                </span>
              </div>
              <div className="flex space-x-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/interview/${interviewId}/feedback`}>
                    View Feedback
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href={`/interview/${interviewId}`}>Retake</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Button asChild className="w-full">
              <Link href={`/interview/${interviewId}`}>Start Interview</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
