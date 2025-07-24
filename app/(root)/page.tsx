import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center ">
      <h1 className="text-5xl font-bold mb-8">Welcome to HiredAI</h1>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Create personalized interviews based on your profile and target
            roles. Get detailed feedback with per-question analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
            <Button asChild className="btn-primary flex-1 min-w-fit">
              <Link href="/onboarding/profile">Get Started</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 min-w-fit">
              <Link href="/create">Quick Interview</Link>
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>New:</strong> Upload your CV and job descriptions for
              AI-powered personalized interviews!
            </p>
          </div>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      {/* Features Section */}
      <section className="mt-16 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Profile</h3>
            <p className="text-gray-600">
              Upload your CV or manually create a profile with your skills,
              experience, and goals.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Add Job Targets</h3>
            <p className="text-gray-600">
              Upload job descriptions or manually add roles you&apos;re
              targeting.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Practice & Improve</h3>
            <p className="text-gray-600">
              Get personalized interview questions and detailed per-question
              feedback.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
