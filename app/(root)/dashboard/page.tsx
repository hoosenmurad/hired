//import Link from "next/link";
//import Image from "next/image";

//import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import PlanStatus from "@/components/PlanStatus";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
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

  // Helper function to enrich interview data with personalization info
  const enrichInterviewData = async (interviews: Interview[]) => {
    const profileIds = [...new Set(interviews.map(i => i.profileId).filter(Boolean))];
    const jobTargetIds = [...new Set(interviews.map(i => i.jobTargetId).filter(Boolean))];

    const [profilesData, jobTargetsData] = await Promise.all([
      profileIds.length > 0 
        ? Promise.all(profileIds.map(id => getProfileById(id!)))
        : Promise.resolve([]),
      jobTargetIds.length > 0
        ? Promise.all(jobTargetIds.map(id => getJobTargetById(id!)))
        : Promise.resolve([])
    ]);

    const profilesMap = new Map(profilesData.filter(Boolean).map(p => [p!.id, p]));
    const jobTargetsMap = new Map(jobTargetsData.filter(Boolean).map(jt => [jt!.id, jt]));

    return interviews.map((interview) => {
      const profile = interview.profileId ? profilesMap.get(interview.profileId) : undefined;
      const jobTarget = interview.jobTargetId ? jobTargetsMap.get(interview.jobTargetId) : undefined;

      return {
        ...interview,
        profileName: profile?.name,
        jobTargetTitle: jobTarget?.title,
        jobTargetCompany: jobTarget?.company,
      };
    });
  };

  // Enrich both interview sets with personalization data
  const [enrichedUserInterviews, enrichedAllInterviews] = await Promise.all([
    userInterviews ? enrichInterviewData(userInterviews) : [],
    allInterview ? enrichInterviewData(allInterview) : [],
  ]);

  const hasPastInterviews = (enrichedUserInterviews?.length ?? 0) > 0;
  const hasUpcomingInterviews = (enrichedAllInterviews?.length ?? 0) > 0;

  return (
    <>
      {/* Plan Status Section */}
      <section className="mb-8">
        <PlanStatus />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            enrichedUserInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                specialtySkills={interview.specialtySkills}
                createdAt={interview.createdAt}
                isPersonalized={interview.isPersonalized}
                profileName={interview.profileName}
                jobTargetTitle={interview.jobTargetTitle}
                jobTargetCompany={interview.jobTargetCompany}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Generated Interviews</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            enrichedAllInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                specialtySkills={interview.specialtySkills}
                createdAt={interview.createdAt}
                isPersonalized={interview.isPersonalized}
                profileName={interview.profileName}
                jobTargetTitle={interview.jobTargetTitle}
                jobTargetCompany={interview.jobTargetCompany}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
