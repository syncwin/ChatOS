
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  isDarkMode: boolean;
  suggestedQuestions: string[];
  onQuestionSelect: (question: string) => void;
}

const WelcomeScreen = ({ isDarkMode, suggestedQuestions, onQuestionSelect }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Welcome to InsightSeeker AI
        </h2>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Your intelligent research companion. Ask me anything and I'll provide detailed, insightful answers.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className={`text-left justify-start h-auto p-3 transition-all ${isDarkMode 
                ? 'bg-gray-900 hover:bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-200 hover:text-white' 
                : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-gray-700 hover:text-gray-900'
              }`}
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
