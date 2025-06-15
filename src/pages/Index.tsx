
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import AppSidebar from "@/components/AppSidebar";
import ChatView from "@/components/ChatView";
import { useChatPage, type Message } from "@/hooks/useChatPage";

export type { Message };

const Index = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    sidebarChats,
    folders,
    isLoadingFolders,
    activeChatId,
    handleNewChat,
    handleSelectChat,
    createFolder,
    updateFolder,
    deleteFolder,
    availableProviders,
    selectedProvider,
    switchProvider,
    availableModels,
    selectedModel,
    switchModel,
    isLoadingProviders,
    activeChat,
    handleAssignChatToFolder,
    tags,
    createTag,
    assignTagToChat,
    removeTagFromChat,
    messages,
    isLoading,
    isAiResponding,
    input,
    setInput,
    handleSubmit,
  } = useChatPage();

  return (
    <>
      <AppSidebar 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        chats={sidebarChats}
        folders={folders}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        createFolder={createFolder}
        updateFolder={updateFolder}
        deleteFolder={deleteFolder}
      />
      <SidebarInset>
        <div className="min-h-screen bg-background text-foreground h-screen flex flex-col">
          <header className="py-4">
            <div className="container mx-auto max-w-4xl flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
              <Header
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                availableProviders={availableProviders}
                selectedProvider={selectedProvider}
                onSelectProvider={switchProvider}
                availableModels={availableModels}
                selectedModel={selectedModel}
                onSelectModel={switchModel}
                isLoadingProviders={isLoadingProviders}
                folders={folders}
                isLoadingFolders={isLoadingFolders}
                activeChat={activeChat}
                onAssignChatToFolder={handleAssignChatToFolder}
                tags={tags}
                createTag={createTag}
                assignTagToChat={assignTagToChat}
                removeTagFromChat={removeTagFromChat}
              />
            </div>
          </header>

          <ChatView
            messages={messages}
            isLoading={isLoading}
            isAiResponding={isAiResponding}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            onNewChat={handleNewChat}
            activeChatId={activeChatId}
          />
        </div>
      </SidebarInset>
    </>
  );
};

export default Index;
