//import Link from "next/link";
//import Image from "next/image";

//import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

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
    return <div>Please sign in to view your interviews.</div>;
  }

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);

  // Helper function to enrich interview data with personalization info
  const enrichInterviewData = async (interviews: Interview[]) => {
    return Promise.all(
      interviews.map(async (interview) => {
        let profileName = undefined;
        let jobTargetTitle = undefined;
        let jobTargetCompany = undefined;

        // Fetch profile and job target data if available
        if (interview.profileId) {
          const profile = await getProfileById(interview.profileId);
          profileName = profile?.name;
        }

        if (interview.jobTargetId) {
          const jobTarget = await getJobTargetById(interview.jobTargetId);
          jobTargetTitle = jobTarget?.title;
          jobTargetCompany = jobTarget?.company;
        }

        return {
          ...interview,
          profileName,
          jobTargetTitle,
          jobTargetCompany,
        };
      })
    );
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
