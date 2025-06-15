import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatOsIcon from "./icons/ChatOsIcon";

interface WelcomeScreenProps {
  suggestedQuestions: string[];
  onQuestionSelect: (question: string) => void;
}

const WelcomeScreen = ({ suggestedQuestions, onQuestionSelect }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md p-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <ChatOsIcon className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground flex items-center justify-center gap-1">
          Chat
          <ChatOsIcon className="w-7 h-7 inline-block" />
          <span className="sr-only">OS</span>
        </h2>
        <p className="mb-6 text-muted-foreground">
          Start a new conversation by typing a message below or selecting a suggestion.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left justify-start h-auto p-3 transition-all bg-card hover:bg-accent text-card-foreground hover:text-accent-foreground border-border whitespace-normal"
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
