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

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) redirect("/");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

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
              {strength}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8">
        <h3 className="text-white mb-4">Areas for Improvement</h3>
        <ul className="space-y-2">
          {feedback?.areasForImprovement?.map((area, index) => (
            <li
              key={index}
              className="text-light-100 leading-relaxed flex items-start"
            >
              <span className="text-primary-200 mr-2 mt-1">•</span>
              {area}
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
