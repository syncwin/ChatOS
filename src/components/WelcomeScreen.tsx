
import { Bot, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  suggestedQuestions: string[];
  onQuestionSelect: (question: string) => void;
}

const WelcomeScreen = ({ suggestedQuestions, onQuestionSelect }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-lg w-full">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-foreground">
          Welcome to InsightSeeker AI
        </h2>
        <p className="mb-8 text-muted-foreground">
          Your intelligent research companion. Start a conversation below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left justify-start h-auto p-4 transition-all hover:bg-accent/80 group"
              onClick={() => onQuestionSelect(question)}
            >
              <div className="flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm text-foreground">{question}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
