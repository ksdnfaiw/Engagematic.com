import type { LucideIcon } from "lucide-react";
import { Briefcase, Megaphone, GraduationCap, PenTool } from "lucide-react";

export type PersonaSlug = "founders" | "sales" | "students" | "creators";

type PersonaPreset = {
  label: string;
  stat: string;
  lines: [string, string];
  icon: LucideIcon;
  profile: {
    jobTitle: string;
    industry: string;
    experience: string;
  };
  persona: {
    name: string;
    writingStyle: string;
    tone: string;
    expertise: string;
    targetAudience: string;
    goals: string;
    contentTypes: string[];
  };
};

export const PERSONA_PRESETS: Record<PersonaSlug, PersonaPreset> = {
  founders: {
    label: "Founders",
    stat: "5x warmer intros",
    lines: [
      "Package POVs, product drops, and customer wins without staring at a blank draft.",
      "Show up daily while Spark keeps your voice polished and on-message."
    ],
    icon: Briefcase,
    profile: {
      jobTitle: "Founder",
      industry: "Startups",
      experience: "executive"
    },
    persona: {
      name: "Founder Momentum Voice",
      writingStyle: "professional",
      tone: "confident",
      expertise: "Founder-led growth storytelling",
      targetAudience: "Investors, customers, and top talent",
      goals: "Thought leadership, product adoption, team recruiting",
      contentTypes: ["Product updates", "Team wins", "Founder POV"]
    }
  },
  sales: {
    label: "Sales Teams",
    stat: "+27% meetings booked",
    lines: [
      "Arm every rep with scroll-stopping narratives and deal teardowns buyers trust.",
      "Warm up sequences before the outreach lands in their inbox."
    ],
    icon: Megaphone,
    profile: {
      jobTitle: "Account Executive",
      industry: "Sales",
      experience: "mid"
    },
    persona: {
      name: "Revenue Storyteller",
      writingStyle: "conversational",
      tone: "enthusiastic",
      expertise: "Pipeline-building social selling",
      targetAudience: "Prospects, buying committees, and champions",
      goals: "Demand generation, relationship building, deal velocity",
      contentTypes: ["Deal teardowns", "Buyer insights", "Proof points"]
    }
  },
  students: {
    label: "Students & New Professionals",
    stat: "2x connection growth",
    lines: [
      "Turn uni achievements and projects into buzzworthy posts and carousels.",
      "Build reputation before your first job lands."
    ],
    icon: GraduationCap,
    profile: {
      jobTitle: "Student",
      industry: "Education",
      experience: "entry"
    },
    persona: {
      name: "Emerging Professional Voice",
      writingStyle: "storyteller",
      tone: "enthusiastic",
      expertise: "Early-career differentiation",
      targetAudience: "Recruiters, hiring managers, and alumni",
      goals: "Networking, interview pipeline, credibility",
      contentTypes: ["Project recaps", "Learning reflections", "Career aspirations"]
    }
  },
  creators: {
    label: "Aspiring Creators",
    stat: "+50% engagement per post",
    lines: [
      "Jumpstart your presence with scroll-stopping carousels and authentic comments.",
      "Stand out-without wasting hours or “faking it.”"
    ],
    icon: PenTool,
    profile: {
      jobTitle: "Content Creator",
      industry: "Media",
      experience: "mid"
    },
    persona: {
      name: "Magnetic Creator Voice",
      writingStyle: "conversational",
      tone: "friendly",
      expertise: "Audience building and storytelling",
      targetAudience: "Niche communities and collaborators",
      goals: "Follower growth, engagement, partnership opportunities",
      contentTypes: ["Carousel concepts", "Community takes", "Prompt-based riffs"]
    }
  }
} as const;

export const isPersonaSlug = (value: string | null): value is PersonaSlug => {
  return !!value && value in PERSONA_PRESETS;
};

