import { LearnPathProvider } from "@/contexts/LearnPathContext";
import { LearnPathChat } from "@/components/learnpath/LearnPathChat";
import { LearnPathContent } from "@/components/learnpath/LearnPathContent";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function LearnPath() {
  return (
    <LearnPathProvider>
      <div className="h-full flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={40} minSize={25} maxSize={55}>
            <LearnPathChat />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={35}>
            <LearnPathContent />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </LearnPathProvider>
  );
}
