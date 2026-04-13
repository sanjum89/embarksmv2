import { EmbarkProvider } from "@/contexts/LearnPathContext";
import { EmbarkChat } from "@/components/learnpath/EmbarkChat";
import { EmbarkContent } from "@/components/learnpath/EmbarkContent";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function EmbarkAI() {
  return (
    <EmbarkProvider>
      <div className="h-full flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={40} minSize={25} maxSize={55}>
            <EmbarkChat />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={35}>
            <EmbarkContent />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </EmbarkProvider>
  );
}
