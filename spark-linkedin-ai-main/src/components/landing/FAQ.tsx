import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Engagematic help me grow my LinkedIn presence?",
    answer: "Engagematic uses AI to create authentic, engaging content that sounds like you. Our Persona Engine learns your unique voice, while the Viral Hook Selector ensures your posts stop the scroll. Users typically see a 6x increase in engagement within the first month."
  },
  {
    question: "Will the content sound like it was written by AI?",
    answer: "No! That's the magic of Engagematic. Our advanced Persona Engine analyzes your writing style, tone, and preferences to create content that authentically represents you. Plus, you can edit and refine every post before sharing."
  },
  {
    question: "How many posts and comments can I generate?",
    answer: "It depends on your plan. The free Starter plan includes 5 AI posts and 10 AI comments per month. Pro users get unlimited posts and comments, plus access to advanced features like the full viral hook library and analytics dashboard."
  },
  {
    question: "Can I try Engagematic before upgrading to Pro?",
    answer: "Absolutely! Start with our free Starter plan to experience the power of AI-generated LinkedIn content. When you're ready for unlimited content and advanced features, upgrade to Pro with a 7-day free trial-no credit card required."
  },
  {
    question: "How quickly can I start creating content?",
    answer: "You can start creating content in under 2 minutes! Sign up, complete our quick onboarding wizard, and you'll be generating viral-worthy LinkedIn posts immediately. No complicated setup required."
  },
  {
    question: "What makes Engagematic different from other AI tools?",
    answer: "Engagematic is specifically trained on 50,000+ viral LinkedIn posts, making it purpose-built for professional networking. Unlike generic AI tools, we understand LinkedIn's algorithm, B2B marketing dynamics, and what drives engagement on the platform. Our Persona Engine ensures every post sounds authentically like you."
  }
];

export const FAQ = () => {
  return (
    <section id="faq" className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold px-4">
            Frequently Asked{" "}
            <span className="text-gradient-premium-world-class">Questions</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground px-4">
            Everything you need to know about Engagematic
          </p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card/50 backdrop-blur-sm border shadow-card rounded-xl px-6"
            >
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
