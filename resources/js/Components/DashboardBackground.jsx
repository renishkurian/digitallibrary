/**
 * Lightweight comic-print atmosphere: halftone + gradients only (no WebGL).
 * Respects prefers-reduced-motion (no CSS animation on the accent orb when reduced).
 */
export default function DashboardBackground() {
    return (
        <div
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            aria-hidden="true"
        >
            {/* Base depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06060c] via-[#05050a] to-[#030308]" />

            {/* Halftone — newsprint on dark */}
            <div
                className="absolute inset-0 opacity-[0.45] motion-reduce:opacity-30"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at center, rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '10px 10px',
                }}
            />

            {/* Diagonal ink stripes (subtle) */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.4) 12px, rgba(255,255,255,0.4) 13px)',
                }}
            />

            {/* Brand glow — pulse only if motion OK */}
            <div className="absolute -left-[20%] top-[15%] h-[55vmin] w-[55vmin] rounded-full bg-[#e8003d]/[0.12] blur-[120px] motion-safe:animate-pulse" />
            <div className="absolute -right-[10%] bottom-[5%] h-[40vmin] w-[40vmin] rounded-full bg-indigo-600/[0.07] blur-[100px]" />
            <div className="absolute left-1/2 top-0 h-[min(50vh,420px)] w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-[#e8003d]/[0.05] blur-[100px]" />
        </div>
    );
}
