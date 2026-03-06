"use client";

import { Presentation } from "../types";
import { PresentationViewer } from "../components/PresentationViewer";

const DEMO_PRESENTATION: Presentation = {
  id: "demo-1",
  title: "Ring x Netflix Boxing Sponsorship",
  createdAt: new Date().toISOString(),
  brief: "Sponsorship opportunity for Ring x Netflix Boxing",
  brand: {
    primaryColor: "#6366f1",
    secondaryColor: "#1e293b",
    accentColor: "#f59e0b",
    backgroundColor: "#09090b",
    textColor: "#f8fafc",
    fontStyle: "sans-serif",
    tone: "bold and professional",
  },
  slides: [
    {
      type: "hero",
      title: "Ring x Netflix Boxing",
      subtitle: "Sponsorship Opportunity",
      body: "Partner with the most exciting live sports event on streaming. Reach millions of engaged viewers worldwide.",
      backgroundVariant: "gradient",
    },
    {
      type: "stats",
      title: "The Opportunity",
      stats: [
        { value: "$7-10M", label: "Availability", description: "Tier 1 sponsorship", icon: "dollar-sign" },
        { value: "50M+", label: "Global Viewers", description: "Per event", icon: "users" },
        { value: "85%", label: "Engagement Rate", description: "Social mentions", icon: "heart" },
        { value: "#1", label: "Trending", description: "On event night", icon: "trending-up" },
      ],
      backgroundVariant: "dark",
    },
    {
      type: "content",
      title: "Why Partner With Us",
      body: "Netflix Boxing combines the prestige of premium streaming with the raw energy of live combat sports.",
      bullets: [
        "Pre & Post roll advertising across all broadcasts",
        "Prime positioning on ring canvas and venue branding",
        "Exclusive branded content series on Netflix platform",
        "Smart TV operating system takeover on event nights",
        "Commercial breaks with guaranteed viewership",
      ],
      backgroundVariant: "dark",
    },
    {
      type: "features",
      title: "Sponsorship Packages",
      features: [
        { title: "Title Sponsor", description: "Full ring branding, broadcast integration, and exclusive content series. Brought to you by messaging.", icon: "crown" },
        { title: "Ring Canvas", description: "Prime floor positioning visible in every camera angle. Maximum brand exposure during all bouts.", icon: "layout-grid" },
        { title: "Digital Integration", description: "Smart TV overlays, social media activations, and Netflix platform branded content.", icon: "tv" },
        { title: "Commercial Breaks", description: "Premium ad slots during broadcast breaks with guaranteed minimum viewership.", icon: "play" },
        { title: "Venue Branding", description: "Physical presence at the venue with signage, activation areas, and VIP hospitality.", icon: "map-pin" },
        { title: "Content Series", description: "Behind-the-scenes branded content series leading up to the main event.", icon: "film" },
      ],
      backgroundVariant: "dark",
    },
    {
      type: "section-break",
      title: "Partnership Tiers",
      subtitle: "Choose the right level of engagement for your brand",
      backgroundVariant: "gradient",
    },
    {
      type: "comparison",
      title: "Tier Comparison",
      columns: [
        {
          title: "Silver",
          items: [
            "Ring canvas placement",
            "25% overall coverage",
            "Standard commercial slots",
            "Social media mentions",
          ],
        },
        {
          title: "Gold",
          items: [
            "Ring canvas + LED boards",
            "50% overall coverage",
            "Premium commercial slots",
            "Branded content series",
            "VIP hospitality package",
          ],
        },
        {
          title: "Platinum",
          items: [
            "Full title sponsorship",
            "85% overall coverage",
            "All commercial inventory",
            "Exclusive content series",
            "Smart TV integration",
            "Venue activation rights",
          ],
        },
      ],
      backgroundVariant: "dark",
    },
    {
      type: "timeline",
      title: "Campaign Timeline",
      timelineItems: [
        { label: "8 Weeks Out", description: "Brand announcement and teaser campaign launch" },
        { label: "4 Weeks Out", description: "Content series premiere on Netflix" },
        { label: "2 Weeks Out", description: "Social media activation ramp-up" },
        { label: "Fight Week", description: "Full venue branding and press events" },
        { label: "Event Night", description: "Live broadcast integration and activations" },
        { label: "Post Event", description: "Highlight reels and recap content" },
      ],
      backgroundVariant: "dark",
    },
    {
      type: "quote",
      quote: {
        text: "This partnership represents the future of sports entertainment sponsorship. The engagement numbers are unlike anything we've seen.",
        attribution: "Head of Partnerships, Netflix Sports",
      },
      backgroundVariant: "primary",
    },
    {
      type: "stats",
      title: "Proven Results",
      stats: [
        { value: "340%", label: "ROI", description: "Average sponsor return", icon: "trending-up" },
        { value: "12.5M", label: "Social Impressions", description: "Per event average", icon: "share-2" },
        { value: "4.2M", label: "New Subscribers", description: "Event-driven signups", icon: "user-check" },
      ],
      backgroundVariant: "dark",
    },
    {
      type: "cta",
      title: "Let's Build Something Big",
      subtitle: "Ready to reach millions of engaged viewers?",
      body: "partnerships@ringxnetflix.com | ringxnetflix.com",
      backgroundVariant: "gradient",
    },
  ],
};

export default function DemoPage() {
  return (
    <PresentationViewer
      presentation={DEMO_PRESENTATION}
      onBack={() => (window.location.href = "/")}
      onUpdatePresentation={() => {}}
    />
  );
}
