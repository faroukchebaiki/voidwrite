import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Voidwrite",
  description: "Reach out to the Voidwrite team with story ideas, feedback, or collaboration requests.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 md:py-20">
      <div className="mb-10 space-y-4 text-center">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Contact
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          We&apos;d love to hear from you
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Whether you have publishing questions, feedback about our stories, or you&apos;d like to collaborate with the Voidwrite team, drop us a note and we&apos;ll get back to you as soon as we can.
        </p>
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
          <CardDescription>
            Fill out the form below and our editors will reply to the email address you provide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </main>
  );
}
