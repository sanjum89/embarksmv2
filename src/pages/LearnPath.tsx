import { EmbarkProvider } from "@/contexts/LearnPathContext";
import { EmbarkChat } from "@/components/learnpath/LearnPathChat";
import { EmbarkContent } from "@/components/learnpath/LearnPathContent";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function EmbarkAI() {
  return (
    <EmbarkProvider>
      <div className="h-full flex flex-col" data-tour="embark-page">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={40} minSize={25} maxSize={55}>
            <div className="h-full" data-tour="embark-chat">
              <EmbarkChat />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={35}>
            <div className="h-full" data-tour="embark-journey">
              <EmbarkContent />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </EmbarkProvider>
  );
}
