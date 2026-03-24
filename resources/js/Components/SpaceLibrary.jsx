import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
    OrbitControls, 
    PerspectiveCamera, 
    Environment, 
    Float, 
    Text, 
    Html, 
    Stars, 
    ContactShadows,
    useTexture,
    RoundedBox,
    MeshDistortMaterial,
    SpotLight
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// --- STABILITY & DETECTION ---

const isWebGLAvailable = () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!(window.WebGLRenderingContext && gl);
    } catch (e) {
        return false;
    }
};

/**
 * Top-level Error Boundary to catch total component/WebGL failures.
 */
class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) {
        console.error("FATAL ARCHIVE ERROR:", error, errorInfo);
        if (this.props.onCrash) this.props.onCrash(error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[200] bg-[#050508] flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-16 h-16 mb-8 text-accent opacity-50">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="font-['Bebas_Neue'] text-3xl tracking-[8px] text-white mb-4 uppercase text-accent">Internal Archive Crash</h2>
                    <p className="max-w-md text-white/40 text-[12px] leading-relaxed mb-10 font-light italic">
                        The 3D environment collapsed. This usually happens when the GPU runs out of memory or the browser's hardware acceleration is disabled.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">Retry</button>
                        <button onClick={this.props.onExit} className="px-8 py-3 bg-accent text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_50px_rgba(232,0,61,0.3)]">Classic Grid</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

class ErrorBoundary3D extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error, errorInfo) {
        console.error("3D Component Error caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) return null; 
        return this.props.children;
    }
}

// --- CONFIGURATION ---
const ROOM_RADIUS = 12;
const SHELF_HEIGHT = 8;
const NUM_WALLS = 12;

const COLORS = {
    wood: '#3d2b1f',
    stone: '#1a1a1a',
    gold: '#c9943a',
    teal: '#00d4aa',
    accent: '#e8003d',
    warmGlow: '#ffd666'
};

// --- SUBSIDIARY COMPONENTS ---

function SpotlightFixture({ isOn }) {
    return (
        <group position={[0, 3.6, 0.6]}>
            <mesh rotation={[0, 0, 0]}>
                <circleGeometry args={[0.2, 32]} />
                <meshStandardMaterial color={COLORS.gold} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, -0.1, 0.05]} rotation={[0.4, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
                <meshStandardMaterial color={COLORS.gold} metalness={0.9} />
            </mesh>
            <group position={[0, -0.25, 0.15]} rotation={[-0.8, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.08, 0.15, 0.3, 16]} />
                    <meshStandardMaterial color={COLORS.gold} metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, -0.1, 0]}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshStandardMaterial color={isOn ? COLORS.warmGlow : '#111'} emissive={isOn ? COLORS.warmGlow : '#000'} emissiveIntensity={isOn ? 5 : 0} />
                </mesh>
                {isOn && (
                    <SpotLight
                        position={[0, -0.1, 0]}
                        distance={8}
                        angle={0.4}
                        attenuation={5}
                        anglePower={5}
                        intensity={10}
                        color={COLORS.warmGlow}
                    />
                )}
            </group>
        </group>
    );
}

function Book({ comic, position, rotation, onSelect, lightOn }) {
    const [hovered, setHovered] = useState(false);
    
    const coverColor = useMemo(() => {
        const colors = ['#3d2b1f', '#4a1a1a', '#1a3a3a', '#1a1a4a', '#3a1a4a', '#1a4a1a', '#4a3a1a', '#2c3e50', '#7f8c8d'];
        const seed = String(comic.id || comic.title || "book");
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index] || colors[0];
    }, [comic.id, comic.title]);

    const spineTex = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(0.5, coverColor);
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 400);
        ctx.fillStyle = COLORS.gold + 'bb';
        ctx.fillRect(0, 20, 64, 3);
        ctx.fillRect(0, 377, 64, 3);
        ctx.fillStyle = '#fff9f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px serif';
        ctx.save();
        ctx.translate(32, 200);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText((comic.title || "Untitled").substring(0, 18).toUpperCase(), 0, 0);
        ctx.restore();
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 16;
        return tex;
    }, [comic.title, coverColor]);

    useEffect(() => {
        return () => { if (spineTex) spineTex.dispose(); };
    }, [spineTex]);

    const spineRibs = [-1.0, -0.5, 0, 0.5, 1.0];

    return (
        <group position={position} rotation={rotation}>
            <ErrorBoundary3D>
                <group 
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onClick={(e) => { e.stopPropagation(); onSelect(comic); }}
                >
                    <mesh castShadow>
                        <boxGeometry args={[0.3, 2.8, 1.2]} />
                        <meshStandardMaterial color={hovered ? COLORS.accent : coverColor} metalness={0.15} roughness={0.6} />
                    </mesh>
                    <mesh position={[0.02, 0, 0.05]}>
                        <boxGeometry args={[0.24, 2.7, 1.15]} />
                        <meshStandardMaterial color="#fff9f0" roughness={1} />
                    </mesh>
                    <mesh position={[-0.151, 0, 0]}>
                        <planeGeometry args={[1.2, 2.8]} />
                        <meshStandardMaterial map={spineTex} rotation={[0, 0, Math.PI / 2]} transparent />
                    </mesh>
                    {spineRibs.map((y, i) => (
                        <mesh key={i} position={[-0.155, y, 0]}>
                            <boxGeometry args={[0.02, 0.08, 1.22]} />
                            <meshStandardMaterial color={COLORS.gold} metalness={0.8} roughness={0.2} />
                        </mesh>
                    ))}

                    <ErrorBoundary3D>
                        <React.Suspense fallback={<mesh position={[0, 0, 0.601]}><planeGeometry args={[0.3, 2.8]} /><meshStandardMaterial color={coverColor} /></mesh>}>
                            <BookCoverTexture 
                                url={comic.thumbnail ? `/thumbs/${comic.thumbnail}` : '/img/no-thumb.jpg'} 
                                lightOn={lightOn} 
                            />
                        </React.Suspense>
                    </ErrorBoundary3D>

                    <SpotlightFixture isOn={lightOn} />

                    {hovered && (
                        <Html distanceFactor={2} position={[-3, 1.5, 0.5]} zIndexRange={[100, 200]}>
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8, x: -50 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className="bg-[#050510]/99 backdrop-blur-[50px] p-10 rounded-[3rem] border-2 border-teal-500/50 shadow-[0_0_200px_rgba(0,0,0,1)] w-[45rem] pointer-events-none"
                            >
                                <img 
                                    src={comic.thumbnail ? `/thumbs/${comic.thumbnail}` : '/img/no-thumb.jpg'} 
                                    onError={(e) => { e.target.src = '/img/no-thumb.jpg'; }}
                                    className="w-full aspect-[3/4] object-cover rounded-[2rem] mb-6 border-2 border-white/10 shadow-2xl" 
                                    alt="" 
                                />
                                <div className="text-[20px] text-white font-black uppercase tracking-[6px] text-center leading-tight mb-4">
                                    {comic.title}
                                </div>
                            </motion.div>
                        </Html>
                    )}
                </group>
            </ErrorBoundary3D>
        </group>
    );
}

function BookCoverTexture({ url, lightOn }) {
    const tex = useTexture(url);
    tex.anisotropy = 16;
    return (
        <mesh position={[0, 0, 0.601]}>
            <planeGeometry args={[0.3, 2.8]} />
            <meshStandardMaterial 
                map={tex} 
                emissive={lightOn ? COLORS.warmGlow : '#000'} 
                emissiveIntensity={lightOn ? 0.2 : 0} 
            />
        </mesh>
    );
}

function WallSection({ angle, comics, onSelectBook, sectionLights, onToggleLight }) {
    const x = Math.cos(angle) * ROOM_RADIUS;
    const z = Math.sin(angle) * ROOM_RADIUS;
    
    return (
        <group position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh position={[0, SHELF_HEIGHT / 2 - 2, 0.5]} receiveShadow>
                <boxGeometry args={[6.5, SHELF_HEIGHT, 1]} />
                <meshStandardMaterial color={COLORS.stone} roughness={0.9} metalness={0.1} />
            </mesh>
            {[0, 1, 2].map((idx) => {
                const h = [0, 3.5, 7.0][idx];
                const isOn = sectionLights[idx];
                return (
                    <group key={h} position={[0, h - 3, 0]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[6, 0.15, 1.5]} />
                            <meshStandardMaterial color={COLORS.wood} roughness={0.3} metalness={0.5} />
                        </mesh>
                        <mesh position={[0, 2.95, 0]}>
                            <boxGeometry args={[6, 0.1, 1.5]} />
                            <meshStandardMaterial color={COLORS.wood} roughness={0.5} />
                        </mesh>
                        <group 
                            position={[2.8, 1.4, 0.55]} 
                            onClick={(e) => { e.stopPropagation(); onToggleLight(idx); }}
                            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                        >
                            <mesh>
                                <boxGeometry args={[0.5, 0.7, 0.02]} />
                                <meshStandardMaterial color={COLORS.gold} metalness={0.8} roughness={0.2} />
                            </mesh>
                            <React.Suspense fallback={null}>
                                <Text position={[0, 0.25, 0.02]} fontSize={0.08} color="#222">SHELF {idx + 1}</Text>
                            </React.Suspense>
                            <mesh position={[0, 0, 0.02]}>
                                <sphereGeometry args={[0.04, 16, 16]} />
                                <meshStandardMaterial color={isOn ? COLORS.teal : '#800'} emissive={isOn ? COLORS.teal : '#f00'} emissiveIntensity={isOn ? 5 : 0.5} />
                            </mesh>
                            <mesh position={[0, -0.2, 0.05]} rotation={[isOn ? -0.5 : 0.5, 0, 0]}>
                                <boxGeometry args={[0.02, 0.15, 0.02]} />
                                <meshStandardMaterial color="#111" />
                            </mesh>
                            <pointLight position={[0, 0, 0.2]} intensity={isOn ? 0.5 : 0.1} color={isOn ? COLORS.teal : '#f00'} distance={1} />
                        </group>
                        {comics.slice(idx * 5, (idx + 1) * 5).map((comic, i) => (
                            <Book 
                                key={comic.id} 
                                comic={comic} 
                                position={[i * 1.15 - 2.3, 1.4, 0]} 
                                rotation={[0, 0, 0]} 
                                onSelect={onSelectBook}
                                lightOn={isOn}
                            />
                        ))}
                    </group>
                );
            })}
            <mesh position={[-3.25, SHELF_HEIGHT / 2 - 2, 0.2]}>
                <boxGeometry args={[0.5, SHELF_HEIGHT, 1.5]} />
                <meshStandardMaterial color={COLORS.wood} />
            </mesh>
        </group>
    );
}

function ExitDoor({ onExit }) {
    const [hovered, setHovered] = useState(false);
    return (
        <group position={[0, -2, -ROOM_RADIUS + 0.5]}>
            <group 
                onClick={onExit}
                onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
            >
                <mesh position={[0, 2.5, -0.2]}>
                    <boxGeometry args={[3.4, 5.4, 0.2]} />
                    <meshStandardMaterial color={COLORS.teal} emissive={COLORS.teal} emissiveIntensity={hovered ? 2 : 0.5} />
                </mesh>
                <mesh position={[0, 2.5, 0]}>
                    <boxGeometry args={[3.2, 5.2, 0.4]} />
                    <meshStandardMaterial color={COLORS.stone} />
                </mesh>
                <mesh position={[0, 2.5, 0.1]}>
                    <boxGeometry args={[2.8, 4.8, 0.2]} />
                    <meshStandardMaterial color={hovered ? COLORS.accent : COLORS.wood} roughness={0.3} metalness={0.2} />
                </mesh>
                <mesh position={[1, 2.5, 0.25]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color={COLORS.gold} emissive={COLORS.gold} emissiveIntensity={1} metalness={1} />
                </mesh>
                <group position={[0, 5.3, 0.2]}>
                    <mesh><boxGeometry args={[1, 0.4, 0.1]} /><meshStandardMaterial color="#b91c1c" emissive="#b91c1c" emissiveIntensity={2} /></mesh>
                    <React.Suspense fallback={null}>
                        <Text position={[0, 0, 0.06]} fontSize={0.2} color="white">EXIT</Text>
                    </React.Suspense>
                </group>
            </group>
            <pointLight position={[0, 3, 2]} intensity={hovered ? 2 : 0.5} color={COLORS.teal} distance={10} />
        </group>
    );
}

function LibraryHub({ rooms, onEnterRoom, onExit }) {
    return (
        <group>
            <ExitDoor onExit={onExit} />
            {rooms.map((room, i) => {
                const angle = (i / rooms.length) * Math.PI * 2;
                const radius = 8;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                return (
                    <group key={room.name} position={[x, -2, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
                        <group 
                            onClick={() => onEnterRoom(room.name)}
                            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                        >
                            <mesh position={[0, 2.5, 0]}>
                                <boxGeometry args={[3.2, 5.2, 0.4]} />
                                <meshStandardMaterial color={COLORS.stone} />
                            </mesh>
                            <React.Suspense fallback={null}>
                                <Text position={[0, 5.8, 0.2]} fontSize={0.35} color="white">{room.name.toUpperCase()}</Text>
                                <Text position={[0, 5.4, 0.2]} fontSize={0.12} color={COLORS.teal}>{room.items.length} ARCHIVAL VOLUMES</Text>
                            </React.Suspense>
                        </group>
                    </group>
                );
            })}
        </group>
    );
}

function VaultRoom({ category, comics, onSelectBook, roomLights, onToggleLight, onBackToHub }) {
    const sections = useMemo(() => {
        const result = [];
        const perWall = 15;
        for (let i = 0; i < NUM_WALLS; i++) {
            result.push(comics.slice(i * perWall, (i + 1) * perWall));
        }
        return result;
    }, [comics]);

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <circleGeometry args={[ROOM_RADIUS + 2, 32]} />
                <meshStandardMaterial color={COLORS.wood} roughness={0.2} metalness={0.6} />
            </mesh>
            <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <sphereGeometry args={[ROOM_RADIUS + 5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#050510" side={THREE.BackSide} />
            </mesh>
            <Stars radius={50} depth={20} count={2000} factor={4} saturation={0} fade speed={1} />
            <pointLight position={[0, 7, 0]} intensity={0.5} color={COLORS.warmGlow} />
            {sections.map((section, i) => (
                <WallSection key={i} angle={(i / NUM_WALLS) * Math.PI * 2} comics={section} onSelectBook={onSelectBook} sectionLights={roomLights} onToggleLight={onToggleLight} />
            ))}
            <group position={[0, -2, -ROOM_RADIUS + 0.5]}>
                <group onClick={onBackToHub} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
                    <mesh position={[0, 2.5, 0]}><boxGeometry args={[3.2, 5.2, 0.4]} /><meshStandardMaterial color={COLORS.stone} /></mesh>
                    <group position={[0, 5.3, 0.2]}>
                        <mesh><boxGeometry args={[1, 0.4, 0.1]} /><meshStandardMaterial color="#b91c1c" emissive="#b91c1c" emissiveIntensity={2} /></mesh>
                        <React.Suspense fallback={null}><Text position={[0, 0, 0.06]} fontSize={0.2} color="white">RETURN TO HALL</Text></React.Suspense>
                    </group>
                </group>
            </group>
            <CentralPedestal label={`${category} Archive`} />
        </group>
    );
}

function CentralPedestal({ label }) {
    return (
        <group position={[0, -1.9, 0]}>
            <mesh castShadow><cylinderGeometry args={[1.2, 1.5, 1.5, 8]} /><meshStandardMaterial color={COLORS.stone} roughness={0.8} /></mesh>
            <mesh position={[0, 0.8, 0]}><boxGeometry args={[1, 0.2, 1]} /><meshStandardMaterial color={COLORS.wood} /></mesh>
            <React.Suspense fallback={null}>
                <Text position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color={COLORS.gold}>{label}</Text>
                <Float speed={2} rotationIntensity={0.5}>
                    <mesh position={[0, 2, 0]}><octahedronGeometry args={[0.3]} /><MeshDistortMaterial color={COLORS.teal} distort={0.2} speed={1.5} emissive={COLORS.teal} emissiveIntensity={1} /></mesh>
                </Float>
            </React.Suspense>
            <pointLight position={[0, 2, 0]} intensity={1.5} color={COLORS.teal} distance={15} />
        </group>
    );
}

function SpaceLibraryContent({ comics, onExit, onInitSuccess }) {
    const [view, setView] = useState({ roomId: 'hub', category: 'All' });
    const [selectedComic, setSelectedComic] = useState(null);
    const [roomLights, setRoomLights] = useState([true, true, true]);

    const rooms = useMemo(() => {
        if (!Array.isArray(comics)) return [];
        const groups = {};
        comics.forEach(c => {
            if (!c) return;
            const cat = c.category?.name || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(c);
        });
        return Object.entries(groups).map(([name, items]) => ({ name, items }));
    }, [comics]);

    const activeRoomData = useMemo(() => {
        if (view.roomId === 'hub') return null;
        return rooms.find(r => r.name === view.category) || rooms[0];
    }, [view, rooms]);

    const toggleLight = (shelfIdx) => {
        const newState = [...roomLights];
        newState[shelfIdx] = !newState[shelfIdx];
        setRoomLights(newState);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#050508]">
            <Canvas 
                shadows 
                dpr={[1, 1.2]} 
                gl={{ 
                    antialias: false, 
                    powerPreference: "high-performance",
                    alpha: false,
                    stencil: false,
                    depth: true,
                    failIfMajorPerformanceCaveat: false 
                }}
                onCreated={onInitSuccess}
            >
                <PerspectiveCamera makeDefault fov={50} position={[0, 1.5, 5]} />
                <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 1.5} />
                <color attach="background" args={['#050508']} />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 10, 5]} intensity={1.5} color={COLORS.warmGlow} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow><circleGeometry args={[30, 64]} /><meshStandardMaterial color="#050508" roughness={0.1} /></mesh>
                <gridHelper args={[40, 40, '#111', '#222']} position={[0, -1.99, 0]} />
                <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
                {view.roomId === 'hub' && <CentralPedestal label="GRAND ARCHIVE HUB" />}
                <React.Suspense fallback={null}>
                    <Environment preset="lobby" />
                    <ErrorBoundary3D>
                        {view.roomId === 'hub' ? (
                            <LibraryHub rooms={rooms} onEnterRoom={(cat) => setView({ roomId: 'room', category: cat })} onExit={onExit} />
                        ) : (
                            <VaultRoom category={view.category} comics={activeRoomData?.items || []} onSelectBook={setSelectedComic} roomLights={roomLights} onToggleLight={toggleLight} onBackToHub={() => setView({ roomId: 'hub', category: 'All' })} />
                        )}
                    </ErrorBoundary3D>
                </React.Suspense>
            </Canvas>

            {/* HUD / UI Overlay */}
            <div className="absolute top-24 left-8 right-8 flex justify-between items-start pointer-events-none">
                <h1 className="font-['Bebas_Neue'] text-3xl tracking-[10px] text-white/40 uppercase">{view.roomId === 'hub' ? 'Grand Hallway' : `${view.category} Vault`}</h1>
                <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 pointer-events-auto">
                    <span className="text-[10px] text-white/30 uppercase font-black tracking-widest block mb-1">Navigation</span>
                    <span className="text-[11px] text-white/60 font-bold block">{rooms.length === 0 ? 'No Archives Found' : (view.roomId === 'hub' ? 'Select a vault to enter' : 'Use the switches to light up shelves')}</span>
                </div>
            </div>

            <AnimatePresence>
                {selectedComic && (
                    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="absolute right-10 top-1/2 -translate-y-1/2 w-80 bg-[#0a0a1a]/90 backdrop-blur-3xl border border-teal-500/30 rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] pointer-events-auto text-white">
                        <button onClick={() => setSelectedComic(null)} className="absolute top-6 right-6 text-white/30 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                        <div className="aspect-[3/4] rounded-xl overflow-hidden mb-6 border border-white/10 shadow-2xl"><img src={selectedComic.thumbnail ? `/thumbs/${selectedComic.thumbnail}` : '/img/no-thumb.jpg'} className="w-full h-full object-cover" alt="" /></div>
                        <h2 className="text-2xl font-bold mb-2 leading-tight">{selectedComic.title}</h2>
                        <a href={`/comics/${selectedComic.id}`} className="flex items-center justify-center gap-3 w-full py-4 bg-teal-500 text-black rounded-xl font-black text-[13px] uppercase tracking-widest hover:scale-105 transition-all">Open Archive</a>
                    </motion.div>
                )}
            </AnimatePresence>
            <LoadingScreen />
        </div>
    );
}

export default function SpaceLibrary({ comics, onExit }) {
    const [webglError, setWebglError] = useState(!isWebGLAvailable());
    const [initFailed, setInitFailed] = useState(false);
    const [forceTry, setForceTry] = useState(false);

    useEffect(() => {
        const originalStyle = document.createElement('style');
        originalStyle.innerHTML = `header, .site-header, nav, [role="navigation"] { display: none !important; opacity: 0 !important; visibility: hidden !important; height: 0 !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important; } main { margin-top: 0 !important; padding-top: 0 !important; height: 100vh !important; }`;
        document.head.appendChild(originalStyle);
        return () => { if (document.head.contains(originalStyle)) document.head.removeChild(originalStyle); };
    }, []);

    // Deep detection: If Canvas fails to notify "onCreated" within 4 seconds, it's a context crash.
    useEffect(() => {
        if (forceTry && !initFailed) {
            const timer = setTimeout(() => {
                const hasGl = !!document.querySelector('canvas')?.getContext('webgl') || !!document.querySelector('canvas')?.getContext('experimental-webgl');
                if (!hasGl) {
                    console.error("Deep Detection: WebGL Canvas found but no context available.");
                    setInitFailed(true);
                }
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [forceTry, initFailed]);

    const handleInitSuccess = () => {
        console.log("Archive 3D Engine Initiated Successfully.");
        setInitFailed(false);
        setWebglError(false);
    };

    if ((webglError && !forceTry) || initFailed) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 mb-8 text-accent opacity-50">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="font-['Bebas_Neue'] text-4xl tracking-[8px] text-white mb-4 uppercase">Archive inaccessible</h2>
                <div className="max-w-md bg-white/5 border border-white/10 p-6 rounded-2xl mb-10">
                    <p className="text-white/60 text-[13px] leading-relaxed mb-4 font-light">
                        {initFailed ? "The 3D engine failed to initialize hardware acceleration. Your GPU or browser flags are blocking the render sequence." : "Your browser has disabled hardware acceleration."}
                    </p>
                    <div className="text-left text-[11px] text-accent/80 font-mono space-y-1">
                        <p className="font-bold underline mb-2">Linux FIX / Chrome Flags:</p>
                        <p>1. Open <span className="text-teal-400">chrome://settings/system</span></p>
                        <p>2. Enable "Use hardware acceleration when available"</p>
                        <p>3. If still failing, check <span className="text-teal-400">chrome://gpu</span> for "Disabled" status</p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all pointer-events-auto"
                        >
                            Try Refresh
                        </button>
                        <button 
                            onClick={onExit} 
                            className="px-10 py-3 bg-accent text-white rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all pointer-events-auto"
                        >
                            Go Back to Grid
                        </button>
                    </div>
                    {!initFailed && (
                        <button 
                            onClick={() => setForceTry(true)}
                            className="text-[10px] text-teal-500 font-bold uppercase tracking-[4px] opacity-40 hover:opacity-100 transition-opacity pointer-events-auto"
                        >
                            Ignore Safety & Force Try
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <GlobalErrorBoundary onExit={onExit} onCrash={() => setInitFailed(true)}>
            <SpaceLibraryContent comics={comics} onExit={onExit} onInitSuccess={handleInitSuccess} />
        </GlobalErrorBoundary>
    );
}

function LoadingScreen() {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 2500);
        return () => clearTimeout(timer);
    }, []);
    return (
        <AnimatePresence>
            {visible && (
                <motion.div exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 z-[200] bg-[#020818] flex flex-col items-center justify-center pointer-events-none">
                    <div className="relative w-24 h-24 mb-6"><div className="absolute inset-0 border-4 border-teal-500/10 rounded-full"></div><div className="absolute inset-0 border-4 border-t-teal-500 rounded-full animate-spin"></div></div>
                    <h2 className="font-['Bebas_Neue'] text-4xl tracking-[12px] text-white">CONSTRUCTING <span className="text-[#e8003d]">VAULT</span></h2>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
