import React from "react";

import { AuroraBackground } from "@/components/aurora-background";
import { FooterSection } from "@/components/landing/footer-section";
import { Header } from "@/components/ui/navbar";
import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { XIcon, Linkedin } from "@/components/icon";

const team = [
  {
    name: "Emmanuel Odii",
    role: "Founder & CEO",
    bio: "Building the future of payments on Stellar. Passionate about empowering developers with seamless blockchain tools.",
    image: "/images/founder.jpeg",
    socials: { linkedin: "https://www.linkedin.com/in/emmanuelodii/", twitter: "https://x.com/devodii_",  github: "https://github.com/devodii" },
  },
  {
    name: "Prince Ajuzie",
    role: "Software Engineer",
    bio: "Architecting scalable and secure decentralized infrastructure to power the next generation of commerce.",
    image: "/images/engineer.jpg",
    socials: { github: "https://github.com/princeajuzie7", linkedin: "https://www.linkedin.com/in/princeajuzie/", twitter: "https://x.com/princeajuzie7" },
  },
  {
    name: "Sam",
    role: "Head of Marketing",
    bio: "Growing the ecosystem and connecting with builders globally to bring our vision to the world.",
    image: "/images/founder.jpeg",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    name: "Sam",
    role: "Head of Marketing",
    bio: "Growing the ecosystem and connecting with builders globally to bring our vision to the world.",
    image: "/images/founder.jpeg",
    socials: { twitter: "#", linkedin: "#" },
  },
];

export default function TeamPage() {
  return (
    <AuroraBackground className=" min-h-screen scroll-smooth">
      <Header />
      <div className="relative z-10 h-full w-full">
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
            <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Meet the Team
            </h1>
            <p className="text-muted-foreground text-lg">
              We are a passionate group of builders, engineers, and creatives working to make blockchain transactions
              seamless for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-card text-card-foreground border-border flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md"
              >
                <div className="bg-muted relative aspect-square w-full">
                  <Image src={member.image} alt={member.name} fill className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2">
                    <h3 className="text-xl font-bold tracking-tight">{member.name}</h3>
                    <p className="text-foreground/80 text-sm font-medium">{member.role}</p>
                  </div>
                  <p className="text-muted-foreground mb-6 flex-1 text-sm leading-relaxed">{member.bio}</p>
                  <div className="text-muted-foreground flex items-center gap-4">
                    {member.socials.twitter && (
                      <Link href={member.socials.twitter} className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                        <XIcon className="h-5 w-5" />
                      </Link>
                    )}
                    {member.socials.github && (
                      <Link href={member.socials.github} className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                        <Github className="h-5 w-5" />
                      </Link>
                    )}
                    {member.socials.linkedin && (
                      <Link href={member.socials.linkedin} className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
      <FooterSection />
    </AuroraBackground>
  );
}
