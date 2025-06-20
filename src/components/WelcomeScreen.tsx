
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  suggestedQuestions: string[];
  onQuestionSelect: (question: string) => void;
}

const WelcomeScreen = ({ suggestedQuestions, onQuestionSelect }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center min-w-0">
      <div className="text-center max-w-xs sm:max-w-md p-2 sm:p-4 w-full">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
          Welcome to ChatOS
        </h2>
        <p className="mb-4 sm:mb-6 text-sm sm:text-base text-muted-foreground px-2">
          Start a new conversation by typing a message below or selecting a suggestion.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left justify-start h-auto p-2 sm:p-3 transition-all bg-card hover:bg-accent text-card-foreground hover:text-accent-foreground border-border whitespace-normal text-xs sm:text-sm break-words"
              onClick={() => onQuestionSelect(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
