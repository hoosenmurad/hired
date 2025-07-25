import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/actions/auth.action";
import {
  CheckCircle,
  Brain,
  Target,
  MessageSquare,
  FileText,
  Zap,
  Star,
  ArrowRight,
  Upload,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Award,
} from "lucide-react";

export default async function LandingPage() {
  // Redirect authenticated users to dashboard
  const isUserAuthenticated = await isAuthenticated();
  if (isUserAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen pattern">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200/10 rounded-full blur-3xl animate-pulse-gentle"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-100/5 rounded-full blur-3xl animate-pulse-gentle"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-col items-center gap-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-200/10 border border-primary-200/20 rounded-full px-4 py-2 text-sm text-primary-200">
              <Sparkles className="w-4 h-4" />
              <span>Professional AI Interview Training</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-primary-100 to-primary-200 bg-clip-text text-transparent leading-tight">
                Master Your
                <br />
                <span className="text-primary-200">Dream Job</span> Interview
              </h1>
              <p className="text-xl md:text-2xl text-light-100 max-w-3xl mx-auto leading-relaxed">
                Get personalized AI mock interviews, real-time feedback, and
                land your dream job with confidence. Practice with our advanced
                AI interviewer powered by voice technology.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-8">
              <Button
                asChild
                className="btn-primary px-6 py-3 rounded-full font-bold transition-colors group"
              >
                <Link
                  href="/onboarding/profile"
                  className="flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                className="btn-secondary px-6 py-3 rounded-full font-bold transition-colors"
              >
                <Link href="/create">Create interview</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 mt-12 text-light-100">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-200 to-primary-100"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-success-100 to-success-200"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                </div>
                <span className="text-sm">
                  Trusted by 10,000+ professionals
                </span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-600"></div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">4.9/5 success rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-primary-200">HiredAI</span>?
            </h2>
            <p className="text-xl text-light-100 max-w-3xl mx-auto">
              Advanced AI technology meets personalized career coaching to give
              you the ultimate interview preparation experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: Brain,
                title: "AI-Powered Interviews",
                description:
                  "Practice with our advanced AI interviewer that adapts to your responses and provides realistic interview scenarios.",
                color: "from-primary-200 to-primary-100",
              },
              {
                icon: FileText,
                title: "CV & Job Description Parsing",
                description:
                  "Upload your CV and target job descriptions for personalized questions tailored to your experience.",
                color: "from-success-100 to-success-200",
              },
              {
                icon: MessageSquare,
                title: "Real-Time Voice Feedback",
                description:
                  "Get instant feedback on your communication skills, confidence, and technical knowledge during live interviews.",
                color: "from-purple-400 to-pink-400",
              },
              {
                icon: Target,
                title: "Role-Specific Practice",
                description:
                  "Target specific positions with customized questions for different experience levels and industries.",
                color: "from-blue-400 to-cyan-400",
              },
              {
                icon: TrendingUp,
                title: "Performance Analytics",
                description:
                  "Track your improvement with detailed scoring across communication, technical skills, and cultural fit.",
                color: "from-orange-400 to-red-400",
              },
              {
                icon: Clock,
                title: "Flexible Scheduling",
                description:
                  "Practice interviews anytime, anywhere. No need to coordinate with human interviewers.",
                color: "from-green-400 to-emerald-400",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group card-interview hover:scale-105 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-light-100 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Features CTA */}
          <div className="text-center mt-12">
            <Button
              asChild
              className="btn-primary px-6 py-3 rounded-full font-bold transition-colors group"
            >
              <Link
                href="/onboarding/profile"
                className="flex items-center gap-2"
              >
                Start Your Interview Journey
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-light-100 max-w-2xl mx-auto">
              Get started in minutes and land your dream job in weeks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description:
                  "Upload your CV or manually input your experience, skills, and career goals. Our AI analyzes your background to create personalized interviews.",
                icon: Upload,
                color: "primary-200",
              },
              {
                step: "02",
                title: "Add Job Targets",
                description:
                  "Upload job descriptions or manually add target roles. Our system creates tailored questions based on specific requirements.",
                icon: Target,
                color: "success-100",
              },
              {
                step: "03",
                title: "Practice & Improve",
                description:
                  "Engage in realistic voice interviews with our AI. Get detailed feedback and improve your performance with each session.",
                icon: TrendingUp,
                color: "purple-400",
              },
            ].map((step, index) => (
              <div key={index} className="relative text-center group">
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-600 to-transparent -translate-x-1/2 z-0"></div>
                )}

                <div className="relative z-10">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-dark-200 to-dark-300 border-2 border-primary-200/30 mb-10 group-hover:border-primary-200 transition-colors">
                    <span className="text-2xl font-bold text-primary-200">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-light-100 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works CTA */}
          <div className="text-center mt-16">
            <Button
              asChild
              className="btn-primary px-8 py-3 rounded-full font-bold transition-colors group"
            >
              <Link
                href="/onboarding/profile"
                className="flex items-center gap-2"
              >
                Begin Your Profile Setup
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Transform Your
                  <span className="text-primary-200">
                    {" "}
                    Interview Performance
                  </span>
                </h2>
                <p className="text-xl text-light-100 leading-relaxed">
                  Our AI-powered platform provides personalized training that
                  adapts to your unique background and target roles.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: CheckCircle,
                    title: "95% Success Rate",
                    description:
                      "Job seekers using HiredAI are 3x more likely to receive job offers",
                  },
                  {
                    icon: Zap,
                    title: "Instant Feedback",
                    description:
                      "Get real-time analysis of your responses, tone, and confidence level",
                  },
                  {
                    icon: Shield,
                    title: "Private & Secure",
                    description:
                      "Your data is encrypted and secure. Practice confidentially without judgment",
                  },
                  {
                    icon: Award,
                    title: "Industry Expertise",
                    description:
                      "Questions crafted by industry experts across tech, finance, healthcare, and more",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-200/20 flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 text-primary-200" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">
                        {benefit.title}
                      </h4>
                      <p className="text-light-100">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className="btn-primary px-6 py-3 rounded-full font-bold transition-colors group"
              >
                <Link
                  href="/onboarding/profile"
                  className="flex items-center gap-2"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-light-100 max-w-2xl mx-auto">
              See how HiredAI helped professionals land their dream jobs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Software Engineer at Google",
                content:
                  "HiredAI helped me practice behavioral questions I never thought to prepare for. The AI feedback was incredibly detailed and helped me improve my storytelling.",
                rating: 5,
                image: "👩‍💻",
              },
              {
                name: "Marcus Rodriguez",
                role: "Product Manager at Meta",
                content:
                  "The personalized questions based on my CV and target job were spot-on. I felt completely prepared for my actual interviews.",
                rating: 5,
                image: "👨‍💼",
              },
              {
                name: "Emily Watson",
                role: "Data Scientist at Netflix",
                content:
                  "The real-time voice feedback helped me identify speech patterns I wasn't aware of. Game-changer for my interview confidence.",
                rating: 5,
                image: "👩‍🔬",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="card-interview group hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-200 to-primary-100 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-light-100">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-light-100 leading-relaxed italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Testimonials CTA */}
          <div className="text-center mt-12">
            <Button
              asChild
              className="btn-primary px-6 py-3 rounded-full font-bold transition-colors group"
            >
              <Link
                href="/onboarding/profile"
                className="flex items-center gap-2"
              >
                Join Our Success Stories
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your <span className="text-primary-200">Plan</span>
            </h2>
            <p className="text-xl text-light-100 max-w-2xl mx-auto">
              Invest in your career with professional AI interview training
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Hustle",
                price: "$27",
                period: "Month",
                description:
                  "Have an interview tomorrow and don't know what to do? This plan is for you.",
                features: [
                  "5 Custom Interviews",
                  "30 Minutes Interview Time",
                  "Detailed feedback",
                ],
                popular: false,
                buttonText: "Get Hustle",
              },
              {
                name: "Prepped",
                price: "$45",
                period: "Month",
                description:
                  "You have a few weeks to prep and get your interview game up to scratch, choose this plan.",
                features: [
                  "10 Custom Interviews",
                  "60 Minutes of Interview Time",
                  "Detailed feedback",
                ],
                popular: true,
                buttonText: "Get Prepped",
              },
              {
                name: "Hired",
                price: "$72",
                period: "Month",
                description:
                  "You are obsessed with perfection and fear rejection more than anything, choose hired.",
                features: [
                  "20 Custom Interviews",
                  "100 Minutes of Interview Time",
                  "Detailed feedback",
                ],
                popular: false,
                buttonText: "Get Hired",
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`card-interview group hover:scale-105 transition-all duration-300 relative ${
                  plan.popular ? "ring-2 ring-primary-200/50" : ""
                }`}
              >
                <div className="text-center mb-6">
                  {plan.popular && (
                    <div className="mb-4">
                      <div className="bg-primary-200 text-dark-100 px-4 py-1 rounded-full text-sm font-bold inline-block">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary-200">
                      {plan.price}
                    </span>
                    <span className="text-light-100">/{plan.period}</span>
                  </div>
                  <p className="text-light-100 mt-4 text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-200 flex-shrink-0 mt-0.5" />
                      <span className="text-light-100">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`w-full px-6 py-3 rounded-full font-bold transition-colors ${
                    plan.popular ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  <Link href="/onboarding/profile">{plan.buttonText}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Pricing CTA */}
          <div className="text-center mt-16">
            <Button
              asChild
              className="btn-primary px-8 py-3 rounded-full font-bold transition-colors group"
            >
              <Link
                href="/onboarding/profile"
                className="flex items-center gap-2"
              >
                Start Your Training Today
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Ready to Ace Your
              <br />
              <span className="text-primary-200">Next Interview?</span>
            </h2>

            <p className="text-xl text-light-100 max-w-2xl mx-auto">
              Join thousands of successful job seekers who transformed their
              careers with HiredAI. Start your professional interview training
              today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                asChild
                className="btn-primary px-8 py-3 rounded-full font-bold transition-colors group"
              >
                <Link
                  href="/onboarding/profile"
                  className="flex items-center gap-3"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                className="btn-secondary px-6 py-3 rounded-full font-bold transition-colors"
              >
                <Link href="/create">Try Demo Interview</Link>
              </Button>
            </div>

            <div className="text-sm text-light-100 flex items-center justify-center gap-4 pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-100" />
                <span>Professional training platform</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-100" />
                <span>Personalized AI coaching</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
