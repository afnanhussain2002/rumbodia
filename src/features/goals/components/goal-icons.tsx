import {
  BookOpen,
  Brain,
  Briefcase,
  Code,
  Coffee,
  Dumbbell,
  Footprints,
  GraduationCap,
  Heart,
  Leaf,
  Moon,
  Music,
  Sprout,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { GoalIconName } from "@/lib/constants";

export const GOAL_ICON_COMPONENTS: Record<GoalIconName, LucideIcon> = {
  target: Target,
  dumbbell: Dumbbell,
  footprints: Footprints,
  briefcase: Briefcase,
  users: Users,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  brain: Brain,
  heart: Heart,
  moon: Moon,
  wallet: Wallet,
  code: Code,
  music: Music,
  leaf: Leaf,
  coffee: Coffee,
  sprout: Sprout,
};

export function GoalIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = GOAL_ICON_COMPONENTS[name as GoalIconName] ?? Target;
  return <Icon size={size} aria-hidden />;
}
