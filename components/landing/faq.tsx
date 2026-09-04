import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const items = [
  {
    value: "browsers",
    trigger: "What browsers does Morph support?",
    content:
      "Morph is built for Chromium-based browsers, so it works on Brave, Chrome, and other browsers that use Chromium.",
  },
  {
    value: "revert",
    trigger: "Can I change my profile back?",
    content:
      "Yep. You can switch back to a normal profile picture or banner whenever you want.",
  },
  {
    value: "gif",
    trigger: "Can I use any GIF?",
    content:
      "You can use supported animated images as long as they meet the required file and size limits.",
  },
  {
    value: "storage",
    trigger: "Does Morph store my images?",
    content:
      "No. Your images don't need to be uploaded to a server just to use Morph.",
  },
  {
    value: "uninstall",
    trigger: "What happens if I uninstall Morph?",
    content:
      "Morph will stop working in your browser, but it won't affect your X account or other profile settings.",
  },
  {
    value: "feedback",
    trigger: "Can I suggest something for Morph?",
    content:
      "Absolutely. If there's something you'd like to see in Morph, I'd love to hear it.",
  },
];

export const FaqSection = () => {
  return (
    <section id="faq" className="w-full mt-36">
      <Accordion multiple defaultValue={["browsers"]}>
        {items.map((item) => (
          <AccordionItem className="mb-2" key={item.value} value={item.value}>
            <AccordionTrigger className="text-md">
              {item.trigger}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/80">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
