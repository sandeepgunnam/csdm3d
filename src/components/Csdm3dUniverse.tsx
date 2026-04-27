"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, RoundedBox, Stars } from "@react-three/drei";
import { Sparkles } from "lucide-react";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Stage = "foundation" | "crawl" | "walk" | "run" | "fly";
type Domain = "foundational" | "design" | "build" | "technical-services" | "sell-consume";

type DomainScore = {
  domain: Domain;
  label: string;
  score: number;
  stage: Stage;
  blockers: number;
  evidence: string;
};

type Analysis = {
  overallScore: number;
  globalStage: Stage;
  progressToNext: number;
  domains: DomainScore[];
  insights: Array<{ title: string; detail: string }>;
};

const stages: Stage[] = ["foundation", "crawl", "walk", "run", "fly"];

const stageLabels: Record<Stage, string> = {
  foundation: "Foundation",
  crawl: "Crawl",
  walk: "Walk",
  run: "Run",
  fly: "Fly",
};

const positions: Record<Domain, [number, number, number]> = {
  foundational: [-6.5, 0, 5.6],
  "technical-services": [-5.1, 0, -0.7],
  design: [5.4, 0, -1.1],
  build: [0, 0, -3.5],
  "sell-consume": [5.9, 0, 4.7],
};

const domainTheme: Record<Domain, { short: string; color: string; zone: string; frame: string }> = {
  foundational: {
    short: "Foundation",
    color: "#84cc16",
    zone: "#c8d3e8",
    frame: "#a8b1c3",
  },
  "technical-services": {
    short: "Technical Services",
    color: "#f59e0b",
    zone: "#fef08a",
    frame: "#b89f7b",
  },
  design: {
    short: "Design",
    color: "#60a5fa",
    zone: "#dbeafe",
    frame: "#a9b5ca",
  },
  build: {
    short: "Build",
    color: "#f97316",
    zone: "#ffedd5",
    frame: "#b88b72",
  },
  "sell-consume": {
    short: "Sell / Consume",
    color: "#22c55e",
    zone: "#c7f9db",
    frame: "#a1b4a8",
  },
};

const tableLabels: Record<Domain, string[]> = {
  foundational: ["cmdb_ci", "core_company", "cmn_location", "cmn_department", "cmdb_rel_ci", "cmdb_ci_class"],
  design: ["business_app", "app_owner", "portfolio", "capability", "lifecycle", "information_object"],
  build: ["app_service", "service_mapping", "discovery", "svc_ci_assoc", "app_relations", "deployment"],
  "technical-services": ["service_offering", "cmdb_ci_service", "tech_svc", "support_group", "sla", "incident_signal"],
  "sell-consume": ["business_service", "catalog", "subscription", "consumer", "offering", "value_stream"],
};

export function Csdm3dUniverse({ analysis }: { analysis: Analysis }) {
  const [selectedDomain, setSelectedDomain] = useState<Domain>("sell-consume");
  const selected = analysis.domains.find((domain) => domain.domain === selectedDomain) ?? analysis.domains[0];
  const sorted = [...analysis.domains].sort((a, b) => a.score - b.score);

  const headlineInsight = analysis.insights?.[0]?.detail ?? "";

  return (
    <div
      data-csdm3d-universe
      className="relative h-[440px] overflow-hidden rounded-lg border border-[var(--border)] bg-[#0a0a0c] sm:h-[520px] lg:h-[640px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(94,106,210,0.18),transparent_38%),radial-gradient(circle_at_78%_22%,rgba(38,181,138,0.10),transparent_40%),linear-gradient(180deg,#0a0a0c_0%,#070708_100%)]" />
      <Canvas camera={{ position: [0.8, 10.5, 16], fov: 42 }} shadows dpr={[1, 1.8]}>
        <Suspense fallback={null}>
          <Scene analysis={analysis} selectedDomain={selectedDomain} onSelectDomain={setSelectedDomain} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 p-3 md:p-4">
        {/* Top-left: compact stats */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 md:left-4 md:top-4">
          <HudChip label="Score" value={String(analysis.overallScore)} />
          <HudChip label="Stage" value={stageLabels[analysis.globalStage]} />
          <HudChip label="Next" value={`${analysis.progressToNext}%`} className="hidden sm:flex" />
        </div>

        {/* Top-right: narrative — hidden on small screens to keep the canvas clean */}
        {headlineInsight && (
          <div className="absolute right-3 top-3 hidden w-[300px] rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)]/92 p-2.5 text-[var(--text)] backdrop-blur md:right-4 md:top-4 md:block">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">Agent narrative</p>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-2)]">{headlineInsight}</p>
          </div>
        )}

        {/* Bottom: domain pills + selected detail */}
        <div className="absolute bottom-3 left-3 right-3 grid gap-2 md:bottom-4 md:left-4 md:right-4 lg:grid-cols-[1fr_320px]">
          <div className="pointer-events-auto rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)]/92 p-2 backdrop-blur">
            <div className="flex flex-wrap items-center gap-1.5">
              {analysis.domains.map((domain) => (
                <button
                  key={domain.domain}
                  type="button"
                  onClick={() => setSelectedDomain(domain.domain)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                    selectedDomain === domain.domain
                      ? "bg-[var(--accent)] text-white"
                      : "bg-transparent text-[var(--text-2)] hover:bg-[var(--bg-elev-2)] hover:text-[var(--text)]"
                  }`}
                >
                  {domain.label} <span className="ml-1 text-[10px] tabular-nums opacity-70">{domain.score}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)]/95 p-2.5 text-[var(--text)] backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-3)]">Selected</p>
                <p className="truncate text-[13px] font-semibold tracking-tight">{selected.label}</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-semibold leading-none tabular-nums" style={{ color: scoreColor(selected.score) }}>
                  {selected.score}
                </p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-3)]">{stageLabels[selected.stage]}</p>
              </div>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-[var(--text-2)]">{selected.evidence}</p>
          </div>
        </div>

        {/* Hidden ranked priorities marker — kept for compatibility with sorted memo */}
        <span className="hidden">{sorted.length}</span>
      </div>
    </div>
  );
}

function HudChip({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)]/92 px-2 py-1 backdrop-blur ${className}`}
    >
      <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-3)]">{label}</span>
      <span className="text-[12px] font-semibold tabular-nums text-[var(--text)]">{value}</span>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return "#26b58a";
  if (score >= 55) return "#f2c94c";
  return "#eb5757";
}

function Scene({
  analysis,
  selectedDomain,
  onSelectDomain,
}: {
  analysis: Analysis;
  selectedDomain: Domain;
  onSelectDomain: (domain: Domain) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const domainMap = useMemo(() => new Map(analysis.domains.map((domain) => [domain.domain, domain])), [analysis.domains]);
  const islandPositions = analysis.domains.map((domain) => positions[domain.domain]);
  const islandColors = analysis.domains.map((domain) => domainTheme[domain.domain].color);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.035;
  });

  return (
    <>
      <Stars radius={80} depth={35} count={1400} factor={2.6} saturation={0} fade speed={0.3} />
      <ambientLight intensity={0.55} color="#9aa3ad" />
      <directionalLight position={[10, 16, 10]} intensity={0.95} castShadow color="#e6e8ec" />
      <directionalLight position={[-8, 9, -5]} intensity={0.35} color="#a3aab8" />
      <pointLight position={[0, 10, 5]} intensity={0.4} color="#5e6ad2" distance={32} />
      <pointLight position={[-5.2, 5, -0.5]} intensity={0.5} color="#26b58a" distance={16} />
      <pointLight position={[5.4, 5, -1.1]} intensity={0.5} color="#5e6ad2" distance={16} />
      <fog attach="fog" args={["#0a0a0c", 28, 70]} />

      <group ref={groupRef}>
        <BoardFoundation />
        <DomainLinks domains={analysis.domains} />
        <DataFlowParticles islandPositions={islandPositions} colors={islandColors} healthScore={analysis.overallScore} />
        {analysis.domains.map((domain) => (
          <DomainPlatform
            key={domain.domain}
            domain={domain}
            position={positions[domain.domain]}
            selected={selectedDomain === domain.domain}
            onSelect={() => onSelectDomain(domain.domain)}
            globalStage={analysis.globalStage}
            maturity={domainMap.get(domain.domain)}
          />
        ))}
      </group>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.22}
        minPolarAngle={0.28}
        maxPolarAngle={1.42}
        minDistance={7}
        maxDistance={28}
        dampingFactor={0.06}
        enableDamping
      />
    </>
  );
}

function BoardFoundation() {
  return (
    <group>
      <RoundedBox args={[31, 0.3, 19.5]} position={[0, -0.62, 1.6]} radius={0.42} smoothness={4}>
        <meshStandardMaterial color="#101014" roughness={0.95} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[29.4, 0.08, 18.3]} position={[0, -0.42, 1.6]} radius={0.38} smoothness={4}>
        <meshStandardMaterial color="#16161a" transparent opacity={0.94} roughness={0.85} />
      </RoundedBox>
      {(Object.keys(positions) as Domain[]).map((domain) => (
        <RoundedBox key={domain} args={[8.8, 0.06, 6.2]} position={[positions[domain][0], -0.34, positions[domain][2]]} radius={0.28} smoothness={4}>
          <meshStandardMaterial color="#1c1c20" transparent opacity={0.85} emissive={domainTheme[domain].color} emissiveIntensity={0.04} />
        </RoundedBox>
      ))}
      <gridHelper args={[32, 32, "#2a2a30", "#1f1f23"]} position={[0, -0.31, 1.6]} />
    </group>
  );
}

function DomainPlatform({
  domain,
  position,
  selected,
  onSelect,
}: {
  domain: DomainScore;
  position: [number, number, number];
  selected: boolean;
  onSelect: () => void;
  globalStage: Stage;
  maturity?: DomainScore;
}) {
  const ref = useRef<THREE.Group>(null);
  const platformRef = useRef<THREE.Mesh>(null);
  const theme = domainTheme[domain.domain];
  const currentStageIndex = stages.indexOf(domain.stage);
  const nodes = tableLabels[domain.domain];
  const scoreColor = domain.score >= 75 ? "#22c55e" : domain.score >= 55 ? "#f59e0b" : "#ef4444";

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + (selected ? Math.sin(state.clock.elapsedTime * 0.85) * 0.08 + 0.12 : 0);
    }
    if (platformRef.current) {
      const mat = platformRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, selected ? 0.62 : 0.24, 0.08);
    }
  });

  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[8.4, 0.06, 5.9]} position={[0, -0.12, 0]} radius={0.22} smoothness={4}>
        <meshStandardMaterial color="#1c1c20" transparent opacity={0.85} roughness={0.96} />
      </RoundedBox>
      <RoundedBox
        ref={platformRef}
        args={[7.15, 0.28, 4.85]}
        position={[0, -0.17, 0]}
        radius={0.22}
        smoothness={4}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <meshStandardMaterial color="#22222a" emissive={theme.color} emissiveIntensity={0.18} roughness={0.85} metalness={0.25} />
      </RoundedBox>

      <StageRail stageIndex={currentStageIndex} color={theme.color} />

      {nodes.map((node, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = [-2.12, 0, 2.12][col];
        const z = [0.95, -0.55][row] ?? -1.82;
        const signal = Math.max(18, Math.min(98, domain.score - index * 4 + (index % 2) * 9));
        return <DataNode key={node} label={node} position={[x, 0.24, z]} color={theme.color} signal={signal} />;
      })}

      <Html position={[0, 1.25, -2.8]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div className="min-w-[200px] rounded-md border border-[#2a2a30] bg-[#0e0e10]/95 px-2.5 py-2 text-center text-white backdrop-blur">
          <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#8a8f98]">{stageLabels[domain.stage]}</div>
          <div className="mt-0.5 text-[12px] font-semibold tracking-tight">{theme.short}</div>
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <span className="text-[22px] font-semibold tabular-nums leading-none" style={{ color: scoreColor }}>
              {domain.score}
            </span>
            <span className="rounded bg-[#1c1c20] px-1.5 py-0.5 text-[9px] font-medium text-[#eb5757]">
              {domain.blockers} blockers
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

function StageRail({ stageIndex, color }: { stageIndex: number; color: string }) {
  return (
    <Html position={[0, 0.38, 2.72]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
      <div className="flex w-[230px] items-center gap-1 rounded-md border border-[#2a2a30] bg-[#0e0e10]/85 px-1.5 py-1.5 backdrop-blur">
        {stages.map((stage, index) => (
          <div key={stage} className="flex-1 text-center">
            <div
              className="h-1.5 rounded"
              style={{
                background: index <= stageIndex ? color : "#2a2a30",
                opacity: index <= stageIndex ? 1 : 0.5,
              }}
            />
            <p className="mt-1 text-[7px] font-medium uppercase tracking-tight text-[#8a8f98]">{stageLabels[stage]}</p>
          </div>
        ))}
      </div>
    </Html>
  );
}

function DataNode({ label, position, color, signal }: { label: string; position: [number, number, number]; color: string; signal: number }) {
  const ref = useRef<THREE.Group>(null);
  const rag = signal >= 75 ? "#22c55e" : signal >= 45 ? "#f59e0b" : "#ef4444";

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.9 + position[0]) * 0.025;
  });

  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[1.48, 0.15, 1.16]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color="#b0a9a1" emissive={rag} emissiveIntensity={0.12} roughness={0.92} metalness={0.16} />
      </RoundedBox>
      <RoundedBox args={[1.04, 0.08, 0.78]} position={[0, 0.13, -0.02]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color={rag} emissive={rag} emissiveIntensity={0.28} roughness={0.35} metalness={0.08} />
      </RoundedBox>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.44, 0.34, 0.28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2 + signal / 400} roughness={0.58} metalness={0.28} />
      </mesh>
      <mesh position={[0.18, 0.58, 0.16]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#eaffff" emissive={rag} emissiveIntensity={0.7} />
      </mesh>
      <Html position={[0, -0.04, 0.72]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div className="flex w-[140px] items-center gap-1 rounded border border-[#2a2a30] bg-[#0e0e10]/90 px-1.5 py-1 text-white backdrop-blur">
          <span className="flex-1 truncate text-center font-mono text-[8px] text-[#8a8f98]">{label}</span>
          <span className="rounded px-1 py-0.5 text-[8px] font-medium tabular-nums text-white" style={{ background: rag }}>
            {Math.round(signal)}
          </span>
        </div>
      </Html>
    </group>
  );
}

function DomainLinks({ domains }: { domains: DomainScore[] }) {
  const links = useMemo(() => {
    const edges: Array<{ from: [number, number, number]; mid: [number, number, number]; to: [number, number, number]; color: string }> = [];
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const fromDomain = domains[i];
        const toDomain = domains[j];
        const from = positions[fromDomain.domain];
        const to = positions[toDomain.domain];
        const avg = (fromDomain.score + toDomain.score) / 2;
        edges.push({
          from: [from[0], 0.22, from[2]],
          to: [to[0], 0.22, to[2]],
          mid: [(from[0] + to[0]) / 2, 1.25 + (100 - avg) / 95, (from[2] + to[2]) / 2],
          color: avg >= 74 ? "#22c55e" : avg >= 56 ? "#f59e0b" : "#f87171",
        });
      }
    }
    return edges;
  }, [domains]);

  return (
    <>
      {links.map((edge, index) => (
        <Line key={index} points={[edge.from, edge.mid, edge.to]} color={edge.color} lineWidth={1.2} transparent opacity={0.58} />
      ))}
    </>
  );
}

function DataFlowParticles({
  islandPositions,
  colors,
  healthScore,
}: {
  islandPositions: [number, number, number][];
  colors: string[];
  healthScore: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const paths = useMemo(() => {
    const result: Array<{ from: THREE.Vector3; to: THREE.Vector3; mid: THREE.Vector3 }> = [];
    for (let i = 0; i < islandPositions.length; i++) {
      for (let j = i + 1; j < islandPositions.length; j++) {
        const from = new THREE.Vector3(...islandPositions[i]);
        const to = new THREE.Vector3(...islandPositions[j]);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.y += 1.5;
        result.push({ from, to, mid });
      }
    }
    return result;
  }, [islandPositions]);

  const particles = useMemo(
    () =>
      Array.from({ length: 130 }, (_, index) => ({
        pathIndex: index % Math.max(paths.length, 1),
        t: seededUnit(index),
        speed: 0.13 + seededUnit(index + 41) * 0.22,
        color: new THREE.Color(colors[index % colors.length] ?? "#22c55e"),
      })),
    [colors, paths.length],
  );

  useFrame((_, delta) => {
    if (!meshRef.current || paths.length === 0) return;
    const speedMult = 0.5 + (healthScore / 100) * 0.8;
    particles.forEach((particle, index) => {
      particle.t += delta * particle.speed * speedMult;
      if (particle.t > 1) particle.t -= 1;
      const path = paths[particle.pathIndex % paths.length];
      const t = particle.t;
      const oneMinusT = 1 - t;
      dummy.position.set(
        oneMinusT * oneMinusT * path.from.x + 2 * oneMinusT * t * path.mid.x + t * t * path.to.x,
        oneMinusT * oneMinusT * path.from.y + 2 * oneMinusT * t * path.mid.y + t * t * path.to.y + 0.35,
        oneMinusT * oneMinusT * path.from.z + 2 * oneMinusT * t * path.mid.z + t * t * path.to.z,
      );
      const scale = 0.025 + Math.sin(t * Math.PI) * 0.035;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial transparent opacity={0.65} emissive="#5e6ad2" emissiveIntensity={0.55} color="#e6e8ec" />
    </instancedMesh>
  );
}

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

