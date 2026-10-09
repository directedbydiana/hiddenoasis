// Decorative cards slipped between the real ones so the file looks full and
// layered. Pure decoration: hidden from assistive tech, never interactive.

export const FILLER_KINDS = ["blank", "ticket", "receipt", "hanger", "lined"] as const;
export type FillerKind = (typeof FILLER_KINDS)[number];

const FRAME = "border-2 border-[#1f1a17] shadow-[5px_5px_0_#1f1a17]";

export default function FillerCard({ kind, className = "" }: { kind: FillerKind; className?: string }) {
  switch (kind) {
    case "blank":
      return (
        <div aria-hidden className={`${FRAME} rounded-xl bg-[#f1efe6] ${className}`}>
          <div className="h-8 border-b-2 border-[#c94f4f]/60 mx-4" />
        </div>
      );
    case "lined":
      return (
        <div
          aria-hidden
          className={`${FRAME} rounded-xl bg-[#f6efe3] ${className}`}
          style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 27px, rgba(31,26,23,0.18) 27px 28px)", backgroundPosition: "0 44px" }}
        >
          <div className="absolute left-10 top-0 bottom-0 w-px bg-[#c94f4f]/50" />
        </div>
      );
    case "ticket":
      return (
        <div aria-hidden className={`${FRAME} rounded-lg bg-[#e8a24a] text-[#1f1a17] flex overflow-hidden ${className}`}>
          <div className="flex-1 p-4 flex flex-col justify-between border-r-2 border-dashed border-[#1f1a17]/60">
            <div className="font-sign text-xl leading-none">DRIVE-IN</div>
            <div className="font-type text-[10px] tracking-[0.25em] uppercase">Shaded Oasis · Screen 1</div>
            <div className="font-sign text-3xl leading-none">ADMIT ONE</div>
          </div>
          <div className="w-20 p-3 flex flex-col items-center justify-center gap-1 bg-[#f2c27a]">
            <div className="font-type text-[9px] tracking-widest uppercase">No.</div>
            <div className="font-sign text-xl">0421</div>
          </div>
        </div>
      );
    case "receipt":
      return (
        <div aria-hidden className={`${FRAME} rounded-sm bg-white text-[#1f1a17] font-type text-[10px] leading-relaxed p-4 overflow-hidden ${className}`} style={{ clipPath: "polygon(0 0, 100% 0, 100% 96%, 95% 100%, 90% 96%, 85% 100%, 80% 96%, 75% 100%, 70% 96%, 65% 100%, 60% 96%, 55% 100%, 50% 96%, 45% 100%, 40% 96%, 35% 100%, 30% 96%, 25% 100%, 20% 96%, 15% 100%, 10% 96%, 5% 100%, 0 96%)" }}>
          <div className="text-center font-sign text-base leading-none mb-2">SHADED OASIS MOTEL</div>
          <div className="text-center uppercase tracking-widest mb-2">Front desk</div>
          <div className="flex justify-between"><span>Room, 1 night</span><span>49.00</span></div>
          <div className="flex justify-between"><span>Ice bucket</span><span>0.00</span></div>
          <div className="flex justify-between"><span>Pool towel</span><span>2.00</span></div>
          <div className="flex justify-between border-t border-dashed border-[#1f1a17] mt-1 pt-1 font-bold"><span>Total</span><span>51.00</span></div>
          <div className="text-center mt-3 uppercase tracking-widest">Thank you · Come again</div>
        </div>
      );
    case "hanger":
      return (
        <div aria-hidden className={`${FRAME} rounded-2xl bg-[#2d6e6a] text-[#f6efe3] flex flex-col items-center justify-center gap-2 p-4 ${className}`}>
          <div className="w-10 h-10 rounded-full border-2 border-[#1f1a17] bg-[#f6efe3]/20" />
          <div className="font-sign text-2xl leading-tight text-center">DO NOT DISTURB</div>
          <div className="font-type text-[10px] tracking-[0.3em] uppercase">Networking in progress</div>
        </div>
      );
  }
}
