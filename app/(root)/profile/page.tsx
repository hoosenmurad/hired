import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getProfileByUserId } from "@/lib/actions/profile.action";
import { User, Edit } from "lucide-react";

const ProfilePage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfileByUserId(user.id);

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold mb-4">No Profile Found</h1>
          <p className="text-gray-600 mb-6">
            You haven&apos;t created a profile yet. Create one to get
            personalized interview experiences.
          </p>
          <Button asChild>
            <Link href="/onboarding/profile">Create Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button asChild>
          <Link href="/profile/edit">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <p className="text-gray-900">{profile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Professional Summary</h2>
          <p className="text-gray-700">{profile.summary}</p>
        </div>

        {/* Career Goals */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Career Goals</h2>
          <p className="text-gray-700">{profile.goals}</p>
        </div>

        {/* Skills */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Education</h2>
          <div className="space-y-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                <p className="text-gray-600">{edu.institution}</p>
                <p className="text-sm text-gray-500">{edu.year}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Work Experience</h2>
          <div className="space-y-6">
            {profile.experience.map((exp, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">{exp.title}</h3>
                <p className="text-gray-600">{exp.company}</p>
                <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                <p className="text-gray-700">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500">Profile Created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {profile.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500">Last Updated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
