import { Flame } from 'lucide-react';

export default function FullScreenLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer spinning circles */}
        <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-b-4 border-orange-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        
        {/* Inner Logo */}
        <div className="absolute w-12 h-12 bg-gradient-to-br from-primary to-orange-500 rounded-full flex items-center justify-center text-foreground shadow-[0_0_20px_rgba(255,122,0,0.6)]">
          <Flame className="w-6 h-6 fill-current" />
        </div>
      </div>
      <p className="mt-6 text-xs font-black tracking-[0.2em] uppercase text-foreground/70 animate-pulse">{text}</p>
    </div>
  );
}
