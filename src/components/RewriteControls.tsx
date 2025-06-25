import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, X, RotateCcw, AlertCircle } from 'lucide-react';

export interface RewriteControlsProps {
  messageId: string;
  isRewriting: boolean;
  rewriteError: string | null;
  rewritingMessageId: string | null;
  timeoutError?: boolean;
  canCancel?: boolean;
  canRewrite?: boolean;
  onRewrite: (messageId: string) => void;
  onClearError: () => void;
  onCancel?: () => void;
  onRetry?: (messageId: string) => void;
}

export const RewriteControls = ({
  messageId,
  isRewriting,
  rewriteError,
  rewritingMessageId,
  timeoutError = false,
  canCancel = false,
  canRewrite = true,
  onRewrite,
  onClearError,
  onCancel,
  onRetry
}: RewriteControlsProps) => {
  const isCurrentlyRewriting = rewritingMessageId === messageId;
  const showError = rewriteError && isCurrentlyRewriting;
  const showTimeout = timeoutError && isCurrentlyRewriting;

  const handleRewrite = () => {
    if (rewriteError) {
      onClearError();
    }
    onRewrite(messageId);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry(messageId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Rewrite Icon */}
      {!isCurrentlyRewriting && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-colors opacity-80 hover:opacity-100"
                onClick={handleRewrite}
                disabled={!canRewrite || isRewriting}
                aria-label="Rewrite response"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!canRewrite 
                  ? 'Rewrite not available' 
                  : 'Generate a new version of this response'
                }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

      {/* Cancel button during rewriting */}
      {isCurrentlyRewriting && canCancel && onCancel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-80 hover:opacity-100"
                onClick={handleCancel}
                aria-label="Cancel rewrite"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel rewrite</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Retry button for errors */}
      {(showError || showTimeout) && onRetry && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-colors opacity-80 hover:opacity-100"
                onClick={handleRetry}
                aria-label="Retry rewrite"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Retry the rewrite operation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Error Display */}
      {showError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm flex items-center justify-between">
            <span>{rewriteError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="h-6 w-6 p-0 ml-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Timeout Display */}
      {showTimeout && !showError && (
        <Alert variant="default" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Rewriting is taking longer than expected. You can wait or try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};