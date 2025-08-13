//import Link from "next/link";
//import Image from "next/image";

//import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import PlanStatus from "@/components/PlanStatus";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";
import { getProfileById } from "@/lib/actions/profile.action";
import { getJobTargetById } from "@/lib/actions/job-target.action";

async function Dashboard() {
  const user = await getCurrentUser();

  if (!user?.id) {
    // Handle the case when the user is not logged in, e.g.:
    return <div>Please sign in to view your interviews.</div>;
  }

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);

  // Helper function to enrich interview data with personalization info and completion status
  const enrichInterviewData = async (interviews: Interview[]) => {
    const profileIds = [
      ...new Set(interviews.map((i) => i.profileId).filter(Boolean)),
    ];
    const jobTargetIds = [
      ...new Set(interviews.map((i) => i.jobTargetId).filter(Boolean)),
    ];

    const [profilesData, jobTargetsData] = await Promise.all([
      profileIds.length > 0
        ? Promise.all(profileIds.map((id) => getProfileById(id!)))
        : Promise.resolve([]),
      jobTargetIds.length > 0
        ? Promise.all(jobTargetIds.map((id) => getJobTargetById(id!)))
        : Promise.resolve([]),
    ]);

    const profilesMap = new Map(
      profilesData.filter(Boolean).map((p) => [p!.id, p])
    );
    const jobTargetsMap = new Map(
      jobTargetsData.filter(Boolean).map((jt) => [jt!.id, jt])
    );

    // Check feedback for each interview to determine completion status
    const enrichedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        const profile = interview.profileId
          ? profilesMap.get(interview.profileId)
          : undefined;
        const jobTarget = interview.jobTargetId
          ? jobTargetsMap.get(interview.jobTargetId)
          : undefined;

        // Check if interview has feedback (meaning it's been completed)
        const feedback = await getFeedbackByInterviewId({
          interviewId: interview.id,
          userId: user.id,
        });

        return {
          ...interview,
          profileName: profile?.name,
          jobTargetTitle: jobTarget?.title,
          jobTargetCompany: jobTarget?.company,
          hasBeenCompleted: !!feedback, // Mark as completed if feedback exists
        };
      })
    );

    return enrichedInterviews;
  };

  // Enrich both interview sets with personalization data and completion status
  const [enrichedUserInterviews, enrichedAllInterviews] = await Promise.all([
    userInterviews ? enrichInterviewData(userInterviews) : [],
    allInterview ? enrichInterviewData(allInterview) : [],
  ]);

  // Separate interviews based on completion status
  const readyToTakeInterviews = [
    ...(enrichedAllInterviews || []).filter(
      (interview) => !interview.hasBeenCompleted
    ),
    ...(enrichedUserInterviews || []).filter(
      (interview) => !interview.hasBeenCompleted
    ),
  ];

  const pastInterviews = [
    ...(enrichedUserInterviews || []).filter(
      (interview) => interview.hasBeenCompleted
    ),
    ...(enrichedAllInterviews || []).filter(
      (interview) => interview.hasBeenCompleted
    ),
  ];

  const hasReadyToTakeInterviews = readyToTakeInterviews.length > 0;
  const hasPastCompletedInterviews = pastInterviews.length > 0;

  return (
    <>
      {/* Plan Status Section */}
      <section className="mb-8 space-y-4">
        <PlanStatus />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Ready to Take</h2>

        <div className="interviews-grid">
          {hasReadyToTakeInterviews ? (
            readyToTakeInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                createdAt={interview.createdAt}
                isPersonalized={interview.isPersonalized}
                profileName={interview.profileName}
                jobTargetTitle={interview.jobTargetTitle}
                jobTargetCompany={interview.jobTargetCompany}
                duration={interview.duration}
              />
            ))
          ) : (
            <p>No interviews available to take</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Past Interviews</h2>

        <div className="interviews-grid">
          {hasPastCompletedInterviews ? (
            pastInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                createdAt={interview.createdAt}
                isPersonalized={interview.isPersonalized}
                profileName={interview.profileName}
                jobTargetTitle={interview.jobTargetTitle}
                jobTargetCompany={interview.jobTargetCompany}
                duration={interview.duration}
              />
            ))
          ) : (
            <p>You haven&apos;t completed any interviews yet</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
