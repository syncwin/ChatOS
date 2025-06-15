
import ChatOsIcon from "./icons/ChatOsIcon";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  suggestedQuestions: string[];
  onQuestionSelect: (question: string) => void;
}

const WelcomeScreen = ({ suggestedQuestions, onQuestionSelect }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md p-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <ChatOsIcon className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground flex justify-center items-center gap-2">
          <span>Chat</span>
          <span className="font-bold text-primary-foreground bg-primary rounded px-2 ml-1">OS</span>
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
