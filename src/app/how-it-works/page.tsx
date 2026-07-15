import { permanentRedirect } from "next/navigation";

export default function HowItWorksPage() {
  permanentRedirect("/about#how-it-works");
}
