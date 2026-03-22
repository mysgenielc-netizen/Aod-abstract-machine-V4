'use client';

import { AodProvider } from '@/lib/AodContext';
import Header from '@/components/Header';
import LeftPanel from '@/components/LeftPanel';
import CenterPanel from '@/components/CenterPanel';
import RightPanel from '@/components/RightPanel';
import BottomPanel from '@/components/BottomPanel';
import AnalysisStrip from '@/components/AnalysisStrip';

export default function Home() {
  return (
    <AodProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050505] text-[#E4E3E0] font-mono text-sm">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <LeftPanel />
          <div className="flex-1 flex flex-col relative border-x border-[#333]">
            <CenterPanel />
            <AnalysisStrip />
          </div>
          <RightPanel />
        </div>
        <BottomPanel />
      </div>
    </AodProvider>
  );
}
