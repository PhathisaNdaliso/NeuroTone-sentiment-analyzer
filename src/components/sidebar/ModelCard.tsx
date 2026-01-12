import { Bot, AlertTriangle, Shield, FileText, MessageSquareWarning, Ruler } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function ModelCard() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">System Status</h3>
      </div>
      
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-muted-foreground">Model Active</span>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="limitations" className="border-none">
          <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>Known Limitations</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <MessageSquareWarning className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sarcasm</p>
                  <p className="text-muted-foreground">May misinterpret sarcastic statements as literal sentiment.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Ruler className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Length</p>
                  <p className="text-muted-foreground">Very short texts (&lt;10 words) may have lower accuracy.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Context</p>
                  <p className="text-muted-foreground">Lacks domain-specific context; industry jargon may confuse results.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Data Privacy</p>
                  <p className="text-muted-foreground">Data is processed via external AI APIs. Not suitable for sensitive data (PII, credit cards, confidential docs).</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
