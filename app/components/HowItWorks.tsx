interface Step {
  number: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps?: Step[];
  title?: string;
  variant?: "dark" | "light";
}

const defaultSteps: Step[] = [
  { number: "1", title: "Inquiry", description: "Tell us about your event and requirements" },
  { number: "2", title: "Proposal", description: "Receive a custom menu and quote" },
  { number: "3", title: "Confirm", description: "Finalize details and secure your date" },
  { number: "4", title: "Event Day", description: "We deliver an unforgettable experience" },
];

export default function HowItWorks({
  steps = defaultSteps,
  title = "How It Works",
  variant = "dark",
}: HowItWorksProps) {
  const styles = {
    dark: {
      bg: "bg-[#3A2A24]",
      title: "text-white",
      subtitle: "text-[#C9653B]",
      stepTitle: "text-white",
      stepDesc: "text-white/70",
    },
    light: {
      bg: "bg-[#F1E7DA]",
      title: "text-[#1F1F1F]",
      subtitle: "text-[#C9653B]",
      stepTitle: "text-[#1F1F1F]",
      stepDesc: "text-[#4B4B4B]",
    },
  };

  const s = styles[variant];

  return (
    <section className={`section-padding ${s.bg}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className={`text-sm uppercase tracking-widest mb-4 ${s.subtitle}`}>Simple Process</p>
          <h2 className={`text-3xl md:text-4xl font-bold ${s.title}`}>{title}</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-[#C9653B] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">{step.number}</span>
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${s.stepTitle}`}>{step.title}</h3>
              <p className={s.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

