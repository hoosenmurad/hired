"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getProfileByUserId,
  updateProfile,
} from "@/lib/actions/profile.action";
import { User, Edit2, Save, X, Plus, Trash2, Loader } from "lucide-react";

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        redirect("/sign-in");
        return;
      }

      setUser(currentUser);
      const userProfile = await getProfileByUserId(currentUser.id);
      setProfile(userProfile);
      setEditedProfile(userProfile);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setEditedProfile({ ...profile! });
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedProfile({ ...profile! });
  };

  const handleSave = async () => {
    if (!editedProfile || !profile) return;

    setSaving(true);
    try {
      const result = await updateProfile(profile.id, {
        name: editedProfile.name,
        summary: editedProfile.summary,
        skills: editedProfile.skills,
        education: editedProfile.education,
        experience: editedProfile.experience,
        goals: editedProfile.goals,
      });

      if (result.success) {
        setProfile(editedProfile);
        setEditMode(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addEducation = () => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      education: [
        ...editedProfile.education,
        { degree: "", institution: "", year: "" },
      ],
    });
  };

  const removeEducation = (index: number) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      education: editedProfile.education.filter((_, i) => i !== index),
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    if (!editedProfile) return;
    const updatedEducation = [...editedProfile.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setEditedProfile({ ...editedProfile, education: updatedEducation });
  };

  const addExperience = () => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      experience: [
        ...editedProfile.experience,
        { title: "", company: "", duration: "", description: "" },
      ],
    });
  };

  const removeExperience = (index: number) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      experience: editedProfile.experience.filter((_, i) => i !== index),
    });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    if (!editedProfile) return;
    const updatedExperience = [...editedProfile.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setEditedProfile({ ...editedProfile, experience: updatedExperience });
  };

  const addSkill = (skill: string) => {
    if (
      !editedProfile ||
      !skill.trim() ||
      editedProfile.skills.includes(skill.trim())
    )
      return;
    setEditedProfile({
      ...editedProfile,
      skills: [...editedProfile.skills, skill.trim()],
    });
  };

  const removeSkill = (skillToRemove: string) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      skills: editedProfile.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader className="animate-spin h-6 w-6 text-primary-200" />
          <span className="text-white">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <User className="h-16 w-16 mx-auto text-light-400 mb-4" />
              <h1 className="text-3xl font-bold mb-4 text-white">
                No Profile Found
              </h1>
              <p className="text-light-100 mb-6">
                You haven&apos;t created a profile yet. Create one to get
                personalized interview experiences.
              </p>
              <Button asChild className="btn-primary">
                <a href="/onboarding/profile">Create Profile</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = editMode ? editedProfile! : profile;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Your Profile</h1>
          <div className="flex space-x-2">
            {editMode ? (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="bg-dark-200 text-light-100 hover:bg-dark-200/80 border-light-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit} className="btn-primary">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="bg-[#191b1f] rounded-2xl shadow-lg p-8 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-light-100 font-normal">Name</Label>
                {editMode ? (
                  <Input
                    value={currentProfile.name}
                    onChange={(e) =>
                      editedProfile &&
                      setEditedProfile({
                        ...editedProfile,
                        name: e.target.value,
                      })
                    }
                    className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-white bg-dark-200/50 rounded-full min-h-12 px-5 flex items-center">
                    {currentProfile.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-light-100 font-normal">Email</Label>
                <p className="text-white bg-dark-200/50 rounded-full min-h-12 px-5 flex items-center">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Professional Summary
            </h2>
            {editMode ? (
              <Textarea
                value={currentProfile.summary}
                onChange={(e) =>
                  editedProfile &&
                  setEditedProfile({
                    ...editedProfile,
                    summary: e.target.value,
                  })
                }
                className="bg-dark-200 rounded-lg min-h-24 px-5 py-3 border-none text-white resize-none"
                placeholder="Describe your professional background and expertise"
                rows={4}
              />
            ) : (
              <p className="text-light-100 bg-dark-200/50 rounded-lg min-h-24 px-5 py-3 leading-relaxed">
                {currentProfile.summary}
              </p>
            )}
          </div>

          {/* Career Goals */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Career Goals
            </h2>
            {editMode ? (
              <Textarea
                value={currentProfile.goals}
                onChange={(e) =>
                  editedProfile &&
                  setEditedProfile({ ...editedProfile, goals: e.target.value })
                }
                className="bg-dark-200 rounded-lg min-h-24 px-5 py-3 border-none text-white resize-none"
                placeholder="Describe your career aspirations and goals"
                rows={4}
              />
            ) : (
              <p className="text-light-100 bg-dark-200/50 rounded-lg min-h-24 px-5 py-3 leading-relaxed">
                {currentProfile.goals}
              </p>
            )}
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-white">Skills</h2>
            {editMode ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {currentProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-primary-200 text-dark-100 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:bg-primary-200/80 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill and press Enter"
                    className="bg-dark-200 rounded-full min-h-12 px-5 border-none text-white flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentProfile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-block bg-primary-200 text-dark-100 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Education</h2>
              {editMode && (
                <Button
                  onClick={addEducation}
                  variant="outline"
                  size="sm"
                  className="bg-dark-200 text-primary-200 hover:bg-dark-200/80 border-primary-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {currentProfile.education.map((edu, index) => (
                <div
                  key={index}
                  className="bg-dark-200/50 rounded-lg p-4 border-l-4 border-primary-200"
                >
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <Input
                            value={edu.degree}
                            onChange={(e) =>
                              updateEducation(index, "degree", e.target.value)
                            }
                            className="bg-dark-200 rounded-lg min-h-10 px-3 border-none text-white"
                            placeholder="Degree (e.g., Bachelor of Science in Computer Science)"
                          />
                          <Input
                            value={edu.institution}
                            onChange={(e) =>
                              updateEducation(
                                index,
                                "institution",
                                e.target.value
                              )
                            }
                            className="bg-dark-200 rounded-lg min-h-10 px-3 border-none text-white"
                            placeholder="Institution name"
                          />
                          <Input
                            value={edu.year}
                            onChange={(e) =>
                              updateEducation(index, "year", e.target.value)
                            }
                            className="bg-dark-200 rounded-lg min-h-10 px-3 border-none text-white"
                            placeholder="Year (e.g., 2020-2024)"
                          />
                        </div>
                        <Button
                          onClick={() => removeEducation(index)}
                          variant="outline"
                          size="sm"
                          className="ml-3 bg-destructive-100/20 text-destructive-100 hover:bg-destructive-100/30 border-destructive-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-white">{edu.degree}</h3>
                      <p className="text-light-100">{edu.institution}</p>
                      <p className="text-sm text-light-400">{edu.year}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Work Experience
              </h2>
              {editMode && (
                <Button
                  onClick={addExperience}
                  variant="outline"
                  size="sm"
                  className="bg-dark-200 text-primary-200 hover:bg-dark-200/80 border-primary-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              )}
            </div>
            <div className="space-y-6">
              {currentProfile.experience.map((exp, index) => (
                <div
                  key={index}
                  className="bg-dark-200/50 rounded-lg p-4 border-l-4 border-success-100"
                >
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <Input
                            value={exp.title}
                            onChange={(e) =>
                              updateExperience(index, "title", e.target.value)
                            }
                            className="bg-dark-200 rounded-lg min-h-10 px-3 border-none text-white"
                            placeholder="Job title"
                          />
                          <Input
                            value={exp.company}
                            onChange={(e) =>
                              updateExperience(index, "company", e.target.value)
                            }
                            className="bg-dark-200 rounded-lg min-h-10 px-3 border-none text-white"
                            placeholder="Company name"
                          />
                          <Input
                            value={exp.duration}
                            onChange={(e) =>
                              updateExperience(
                                index,
                                "duration",
                                e.target.value
                              )
                            }
                            className="bg-dark-200 rounded-lg min-h-10 px-3 border-none text-white"
                            placeholder="Duration (e.g., Jan 2020 - Present)"
                          />
                          <Textarea
                            value={exp.description}
                            onChange={(e) =>
                              updateExperience(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            className="bg-dark-200 rounded-lg min-h-20 px-3 py-2 border-none text-white resize-none"
                            placeholder="Describe your role and achievements"
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={() => removeExperience(index)}
                          variant="outline"
                          size="sm"
                          className="ml-3 bg-destructive-100/20 text-destructive-100 hover:bg-destructive-100/30 border-destructive-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-white">{exp.title}</h3>
                      <p className="text-light-100">{exp.company}</p>
                      <p className="text-sm text-light-400 mb-2">
                        {exp.duration}
                      </p>
                      <p className="text-light-100 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Profile Stats */}
          <div className="border-t border-light-600/30 pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-dark-200/30 rounded-lg p-4">
                <p className="text-2xl font-bold text-primary-200">
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm text-light-400">Profile Created</p>
              </div>
              <div className="bg-dark-200/30 rounded-lg p-4">
                <p className="text-2xl font-bold text-success-100">
                  {profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="text-sm text-light-400">Last Updated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
