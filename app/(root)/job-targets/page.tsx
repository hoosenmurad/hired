"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getJobTargetsByUserId } from "@/lib/actions/job-target.action";
import {
  Plus,
  Briefcase,
  Building,
  Target,
  Loader,
  Eye,
  Edit,
} from "lucide-react";
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex items-center space-x-2">
          <Loader className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-primary-200" />
          <span className="text-white text-sm sm:text-base">
            Loading job targets...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Job Targets
              </h1>
              <p className="text-light-100 mt-1 text-sm sm:text-base">
                Manage your target roles and companies
              </p>
            </div>
            <Button
              onClick={() => handleNavigate("/job-targets/create")}
              disabled={navigatingTo === "/job-targets/create"}
              className="w-full sm:w-auto bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-4 sm:px-6 h-12 text-sm sm:text-base disabled:opacity-70"
            >
              {navigatingTo === "/job-targets/create" ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Job Target
            </Button>
          </div>
        </div>

        {/* Job Targets Grid or Empty State */}
        {jobTargets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-dark-200/50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-light-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
              No Job Targets Yet
            </h2>
            <p className="text-light-100 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed px-4">
              Create your first job target to get personalized interview
              questions tailored to specific roles and companies.
            </p>
            <Button
              onClick={() => handleNavigate("/job-targets/create")}
              disabled={navigatingTo === "/job-targets/create"}
              className="bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-bold px-6 sm:px-8 h-12 text-sm sm:text-base disabled:opacity-70"
            >
              {navigatingTo === "/job-targets/create" ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Your First Job Target
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {jobTargets.map((jobTarget) => (
              <div
                key={jobTarget.id}
                className="bg-[#191b1f] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-200 border border-light-600/10 hover:border-primary-200/20"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary-200 flex-shrink-0" />
                    <h3 className="font-semibold text-base sm:text-lg truncate text-white">
                      {jobTarget.title}
                    </h3>
                  </div>
                  <span className="text-xs text-light-400 bg-dark-200/50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    {new Date(jobTarget.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Company */}
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 text-light-400 flex-shrink-0" />
                  <p className="text-light-100 font-medium text-sm sm:text-base truncate">
                    {jobTarget.company}
                  </p>
                </div>

                {/* Description */}
                <p className="text-light-100 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                  {jobTarget.description}
                </p>

                {/* Required Skills */}
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium text-light-400 mb-2">
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-1 sm:gap-2 max-h-16 overflow-hidden">
                    {jobTarget.requiredSkills
                      .slice(0, 6)
                      .map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded-full bg-primary-200/10 text-primary-200 border border-primary-200/20 truncate"
                        >
                          {skill}
                        </span>
                      ))}
                    {jobTarget.requiredSkills.length > 6 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-dark-200/50 text-light-400">
                        +{jobTarget.requiredSkills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
                    className="flex-1 bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full font-medium px-3 sm:px-4 h-10 text-xs sm:text-sm disabled:opacity-70"
                  >
                    {navigatingTo ===
                    `/onboarding/setup-interview?jobTargetId=${jobTarget.id}` ? (
                      <Loader className="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    ) : (
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    )}
                    Practice Interview
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none bg-dark-200 text-light-100 hover:bg-dark-200/80 border-light-600/20 rounded-full h-10 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none bg-dark-200 text-light-100 hover:bg-dark-200/80 border-light-600/20 rounded-full h-10 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sm:hidden">Edit</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {jobTargets.length > 0 && (
          <div className="mt-8 sm:mt-12 bg-[#191b1f] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-light-600/10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-white">
              Quick Stats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center bg-dark-200/30 rounded-lg p-4 sm:p-6">
                <p className="text-2xl sm:text-3xl font-bold text-primary-200 mb-1">
                  {jobTargets.length}
                </p>
                <p className="text-xs sm:text-sm text-light-400">
                  Total Job Targets
                </p>
              </div>
              <div className="text-center bg-dark-200/30 rounded-lg p-4 sm:p-6">
                <p className="text-2xl sm:text-3xl font-bold text-success-100 mb-1">
                  {[...new Set(jobTargets.map((jt) => jt.company))].length}
                </p>
                <p className="text-xs sm:text-sm text-light-400">
                  Companies Targeted
                </p>
              </div>
              <div className="text-center bg-dark-200/30 rounded-lg p-4 sm:p-6">
                <p className="text-2xl sm:text-3xl font-bold text-destructive-100 mb-1">
                  {
                    [...new Set(jobTargets.flatMap((jt) => jt.requiredSkills))]
                      .length
                  }
                </p>
                <p className="text-xs sm:text-sm text-light-400">
                  Unique Skills
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobTargetsPage;
