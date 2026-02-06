import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, Stars, useGLTF, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Store } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

function BookMesh({ position, rotation, color, delay }: any) {
    const meshRef = useRef<THREE.Group>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            if (hovered) {
                meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
                meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.002;
            } else {
                meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
                meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + delay) * 0.1 + rotation[1];
            }
        }
    });

    return (
        <group
            ref={meshRef}
            position={position}
            rotation={rotation}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
        >
            {/* Book Cover */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.5, 2.2, 0.3]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Pages Side */}
            <mesh position={[0.76, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[0.25, 2.15]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
            {/* Pages Top */}
            <mesh position={[0, 1.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.4, 0.25]} />
                <meshStandardMaterial color="#f8fafc" />
            </mesh>
        </group>
    );
}

function Scene() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <pointLight position={[-10, -5, -10]} intensity={0.5} color="#d946ef" />
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="city" />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} floatingRange={[-0.5, 0.5]}>
                <PresentationControls global polar={[-0.2, 0.2]} azimuth={[-0.2, 0.2]}>
                    <group position={[0, 0, 0]}>
                        {/* Center */}
                        <BookMesh position={[3, 0.5, -2]} rotation={[0, -0.4, 0.1]} color="#db2777" delay={0} />
                        <BookMesh position={[-3.5, 1, -3]} rotation={[0, 0.4, -0.1]} color="#2563eb" delay={1} />
                        <BookMesh position={[-2.5, -2, -1]} rotation={[0.2, 0.2, 0.2]} color="#d97706" delay={2} />
                        <BookMesh position={[4, -1.5, -4]} rotation={[-0.1, -0.2, -0.1]} color="#16a34a" delay={3} />
                    </group>
                </PresentationControls>
            </Float>
        </>
    );
}

export function Hero3D() {
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useGSAP(() => {
        const tl = gsap.timeline();
        tl.from('.hero-text', {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: 'power4.out'
        });

        tl.from('.hero-badge', {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(1.7)'
        }, '-=0.5');

        tl.from('.hero-btn', {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out'
        }, '-=0.3');
    }, { scope: containerRef });

    return (
        <div className="relative w-full h-[85vh] overflow-hidden bg-slate-950" ref={containerRef}>
            {/* 3D Background */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows dpr={[1, 2]}>
                    <Scene />
                </Canvas>
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent z-10 pointer-events-none" />

            {/* Hero Content */}
            <div className="absolute inset-0 z-20 container mx-auto px-4 flex flex-col justify-center h-full">
                <div className="max-w-3xl">
                    <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-8 w-fit">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium">O maior marketplace de livros de Angola</span>
                    </div>

                    <h1 className="hero-text text-5xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight leading-[1.1] mb-6">
                        Conectando <br />
                        <span className="text-primary italic font-serif">Livrarias</span>
                    </h1>

                    <p className="hero-text text-xl md:text-2xl text-slate-300 font-light max-w-xl leading-relaxed mb-10">
                        Aproximando leitores. Encontre os seus livros favoritos das melhores livrarias de Angola num só lugar.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            size="lg"
                            className="hero-btn h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-5px_var(--primary)] transition-all hover:scale-105"
                            onClick={() => navigate('/livros')}
                        >
                            <BookOpen className="mr-2 h-5 w-5" />
                            Explorar Livros
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="hero-btn h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
                            onClick={() => navigate('/vendedor')}
                        >
                            <Store className="mr-2 h-5 w-5" />
                            Sou uma Livraria
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                <div className="w-8 h-12 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                    <div className="w-1 h-2 bg-white rounded-full" />
                </div>
            </div>
        </div>
    );
}
