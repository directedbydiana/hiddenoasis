import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Link as LinkIcon_,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import type { LinkKind } from "@/lib/types";

const ICONS: Record<LinkKind, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  other: LinkIcon_,
};

export default function LinkIcon({ kind, className }: { kind: LinkKind; className?: string }) {
  const Icon = ICONS[kind] ?? LinkIcon_;
  return <Icon className={className} />;
}
