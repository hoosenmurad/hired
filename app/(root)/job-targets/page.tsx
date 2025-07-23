"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobTargetsByUserId } from "@/lib/actions/job-target.action";
import { Plus, Briefcase, Building, Target, Edit, Loader } from "lucide-react";
import { useRouter } from "next/navigation";

const JobTargetsPage = () => {
  const [jobTargets, setJobTargets] = useState<JobTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        redirect("/sign-in");
        return;
      }

      const userJobTargets = await getJobTargetsByUserId(currentUser.id);
      setJobTargets(userJobTargets);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="animate-spin h-6 w-6 text-primary-200" />
          <span className="text-white">Loading job targets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Your Job Targets</h1>
          <Button asChild className="btn-primary">
            <Link href="/job-targets/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Job Target
            </Link>
          </Button>
        </div>

        {jobTargets.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <Target className="h-16 w-16 mx-auto text-light-400 mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-white">
                No Job Targets Yet
              </h2>
              <p className="text-light-100 mb-6">
                Add job targets to get personalized interview questions tailored
                to specific roles.
              </p>
              <Button asChild className="btn-primary">
                <Link href="/job-targets/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Job Target
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobTargets.map((jobTarget) => (
              <div
                key={jobTarget.id}
                className="bg-[#191b1f] rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-light-600/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-primary-200" />
                    <h3 className="font-semibold text-lg truncate text-white">
                      {jobTarget.title}
                    </h3>
                  </div>
                  <span className="text-xs text-light-400 bg-dark-200/50 px-2 py-1 rounded-full">
                    {new Date(jobTarget.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <Building className="h-4 w-4 text-light-400" />
                  <p className="text-light-100 font-medium">
                    {jobTarget.company}
                  </p>
                </div>

                <p className="text-light-100 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {jobTarget.description}
                </p>

                {/* Required Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Key Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {jobTarget.requiredSkills
                      .slice(0, 3)
                      .map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block bg-primary-200 text-dark-100 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    {jobTarget.requiredSkills.length > 3 && (
                      <span className="inline-block bg-dark-200/50 text-light-100 px-2 py-1 rounded-full text-xs">
                        +{jobTarget.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Key Responsibilities
                  </h4>
                  <ul className="text-sm text-light-100 space-y-1">
                    {jobTarget.responsibilities
                      .slice(0, 2)
                      .map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary-200 mr-2">•</span>
                          <span className="line-clamp-1">{responsibility}</span>
                        </li>
                      ))}
                    {jobTarget.responsibilities.length > 2 && (
                      <li className="text-xs text-light-400">
                        +{jobTarget.responsibilities.length - 2} more
                        responsibilities
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 bg-dark-200 text-light-100 hover:bg-dark-200/80 border-light-600"
                  >
                    <Link href={`/job-targets/${jobTarget.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  <Button
                    onClick={() =>
                      handleNavigate(
                        `/onboarding/setup-interview?jobTargetId=${jobTarget.id}`
                      )
                    }
                    disabled={
                      navigatingTo ===
                      `/onboarding/setup-interview?jobTargetId=${jobTarget.id}`
                    }
                    className="flex-1 btn-primary"
                  >
                    {navigatingTo ===
                    `/onboarding/setup-interview?jobTargetId=${jobTarget.id}` ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Create Interview"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {jobTargets.length > 0 && (
          <div className="mt-12 bg-[#191b1f] rounded-2xl shadow-lg p-8 border border-light-600/10">
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Quick Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center bg-dark-200/30 rounded-lg p-4">
                <p className="text-3xl font-bold text-primary-200">
                  {jobTargets.length}
                </p>
                <p className="text-sm text-light-400">Total Job Targets</p>
              </div>
              <div className="text-center bg-dark-200/30 rounded-lg p-4">
                <p className="text-3xl font-bold text-success-100">
                  {[...new Set(jobTargets.map((jt) => jt.company))].length}
                </p>
                <p className="text-sm text-light-400">Companies Targeted</p>
              </div>
              <div className="text-center bg-dark-200/30 rounded-lg p-4">
                <p className="text-3xl font-bold text-destructive-100">
                  {
                    [...new Set(jobTargets.flatMap((jt) => jt.requiredSkills))]
                      .length
                  }
                </p>
                <p className="text-sm text-light-400">Unique Skills</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTargetsPage;
