import React, { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  Node,
  Edge,
  MarkerType,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Decision,
  Issue,
  Risk,
  Action,
  Person,
  Document,
  getDecisionStatusLabel,
} from '../../types';
import {
  Scale,
  AlertCircle,
  Flame,
  Zap,
  User,
  ExternalLink,
  Info,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

// ==========================================
// Custom Nodes with Strict Color Theming:
// Decision: 검정 (Black)
// Issue: 슬레이트 (Slate)
// Risk: 로즈 (Rose)
// Action: 엠버 (Amber)
// Person: 화이트 (White)
// ==========================================

const DecisionNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const dec = data.raw as Decision;
  return (
    <div
      className={`w-64 rounded-xl bg-black border-2 transition-all p-3 text-white shadow-2xl ${
        selected ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-500 !border-none" />
      <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-slate-800 pb-1.5">
        <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider text-slate-300">
          <Scale className="w-3.5 h-3.5 text-blue-400" />
          DECISION
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold text-slate-300">
          {getDecisionStatusLabel(dec.status)}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">{dec.title}</p>
      {dec.delayRisk && (
        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
          지연위험: {dec.delayRisk}
        </p>
      )}
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-blue-400 !border-none" />
    </div>
  );
};

const IssueNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const iss = data.raw as Issue;
  return (
    <div
      className={`w-60 rounded-xl bg-slate-800 border-2 transition-all p-3 text-slate-100 shadow-xl ${
        selected ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-slate-600 hover:border-slate-400'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-400 !border-none" />
      <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-slate-700 pb-1">
        <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider text-slate-300">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          ISSUE
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-600 font-bold text-slate-300">
          P{iss.priority} · {iss.status}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">{iss.title}</p>
      {iss.symptom && (
        <p className="text-[10px] text-slate-300 mt-1 line-clamp-1">
          현상: {iss.symptom}
        </p>
      )}
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-slate-400 !border-none" />
    </div>
  );
};

const RiskNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const rsk = data.raw as Risk;
  return (
    <div
      className={`w-60 rounded-xl bg-rose-950/95 border-2 transition-all p-3 text-rose-100 shadow-xl ${
        selected ? 'border-rose-300 ring-2 ring-rose-500/50' : 'border-rose-600 hover:border-rose-400'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-rose-500 !border-none" />
      <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-rose-800 pb-1">
        <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider text-rose-300">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          RISK
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900 border border-rose-700 font-bold text-rose-200">
          확률:{rsk.probability} / 영향:{rsk.impact}
        </span>
      </div>
      <p className="text-xs font-bold text-rose-100 line-clamp-2 leading-snug">{rsk.title}</p>
      {rsk.businessFailureImpact && (
        <p className="text-[10px] text-rose-300 mt-1 line-clamp-1">
          치명도: {rsk.businessFailureImpact}
        </p>
      )}
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-rose-400 !border-none" />
    </div>
  );
};

const ActionNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const act = data.raw as Action;
  return (
    <div
      className={`w-60 rounded-xl bg-amber-950/95 border-2 transition-all p-3 text-amber-100 shadow-xl ${
        selected ? 'border-amber-300 ring-2 ring-amber-500/50' : 'border-amber-600 hover:border-amber-400'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-amber-500 !border-none" />
      <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-amber-800 pb-1">
        <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          ACTION
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900 border border-amber-700 font-bold text-amber-200">
          진행 {act.progress}% · {act.status}
        </span>
      </div>
      <p className="text-xs font-bold text-amber-100 line-clamp-2 leading-snug">{act.title}</p>
      <p className="text-[10px] text-amber-300 mt-1 flex items-center justify-between">
        <span>담당: {act.owner}</span>
        <span>{act.deadline?.split(' ')[0]}</span>
      </p>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-amber-400 !border-none" />
    </div>
  );
};

const PersonNodeComponent: React.FC<NodeProps> = ({ data, selected }) => {
  const per = data.raw as Person;
  return (
    <div
      className={`w-56 rounded-xl bg-white border-2 transition-all p-3 text-slate-900 shadow-2xl ${
        selected ? 'border-blue-600 ring-2 ring-blue-500/50' : 'border-slate-300 hover:border-slate-500'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-700 !border-none" />
      <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-slate-200 pb-1">
        <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase tracking-wider text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-800" />
          PERSON
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-extrabold text-slate-800">
          신뢰도 {per.trust ?? 8}/10
        </span>
      </div>
      <p className="text-xs font-black text-black leading-snug">{per.name} {per.position || per.role}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">
        {per.organization || (per as any).department || '핵심 이해관계자'}
      </p>
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-slate-500 !border-none" />
    </div>
  );
};

const nodeTypes = {
  decision: DecisionNodeComponent,
  issue: IssueNodeComponent,
  risk: RiskNodeComponent,
  action: ActionNodeComponent,
  person: PersonNodeComponent,
};

interface DecisionGraphViewProps {
  decisions: Decision[];
  issues?: Issue[];
  risks?: Risk[];
  actions?: Action[];
  people?: Person[];
  documents?: Document[];
  onSelectDecision?: (decision: Decision) => void;
}

export const DecisionGraphView: React.FC<DecisionGraphViewProps> = ({
  decisions = [],
  issues = [],
  risks = [],
  actions = [],
  people = [],
  documents = [],
  onSelectDecision,
}) => {
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'decision' | 'issue' | 'risk' | 'action' | 'person';
    raw: any;
    targetDecision?: Decision;
  } | null>(null);

  // Build Graph Nodes & Edges
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // Columns X Coordinates
    const COL_DECISION_X = 40;
    const COL_ISSUE_X = 360;
    const COL_RISK_X = 680;
    const COL_ACTION_X = 1000;
    const COL_PERSON_X = 1320;

    const ROW_HEIGHT = 140;

    // 1. Decision Nodes (검정)
    decisions.forEach((dec, idx) => {
      generatedNodes.push({
        id: `node-dec-${dec.id}`,
        type: 'decision',
        position: { x: COL_DECISION_X, y: 80 + idx * ROW_HEIGHT },
        data: { title: dec.title, raw: dec },
      });
    });

    // 2. Issue Nodes (슬레이트)
    issues.forEach((iss, idx) => {
      generatedNodes.push({
        id: `node-iss-${iss.id}`,
        type: 'issue',
        position: { x: COL_ISSUE_X, y: 80 + idx * ROW_HEIGHT },
        data: { title: iss.title, raw: iss },
      });
    });

    // 3. Risk Nodes (로즈)
    risks.forEach((rsk, idx) => {
      generatedNodes.push({
        id: `node-rsk-${rsk.id}`,
        type: 'risk',
        position: { x: COL_RISK_X, y: 80 + idx * ROW_HEIGHT },
        data: { title: rsk.title, raw: rsk },
      });
    });

    // 4. Action Nodes (엠버)
    actions.forEach((act, idx) => {
      generatedNodes.push({
        id: `node-act-${act.id}`,
        type: 'action',
        position: { x: COL_ACTION_X, y: 80 + idx * ROW_HEIGHT },
        data: { title: act.title, raw: act },
      });
    });

    // 5. Person Nodes (화이트)
    people.forEach((per, idx) => {
      generatedNodes.push({
        id: `node-per-${per.id}`,
        type: 'person',
        position: { x: COL_PERSON_X, y: 80 + idx * ROW_HEIGHT },
        data: { title: per.name, raw: per },
      });
    });

    const edgeSet = new Set<string>();

    const addEdgeSafe = (source: string, target: string, color: string) => {
      const key = `${source}->${target}`;
      if (edgeSet.has(key)) return;
      edgeSet.add(key);

      generatedEdges.push({
        id: `edge-${key}`,
        source,
        target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 14,
          height: 14,
        },
      });
    };

    // Edge Generation 1: Decision → Issue
    decisions.forEach((dec) => {
      const decNodeId = `node-dec-${dec.id}`;
      issues.forEach((iss) => {
        const isLinked =
          iss.relatedDecision === dec.id ||
          (dec as any).relatedIssues?.includes(iss.id) ||
          dec.title.toLowerCase().includes('인력') && iss.title.toLowerCase().includes('공정') ||
          dec.title.toLowerCase().includes('전무') && iss.title.toLowerCase().includes('생산');

        if (isLinked) {
          addEdgeSafe(decNodeId, `node-iss-${iss.id}`, '#64748b'); // slate-500
        }
      });
    });

    // Fallback connect orphan issues to closest decision
    issues.forEach((iss, idx) => {
      const issNodeId = `node-iss-${iss.id}`;
      const hasIncoming = generatedEdges.some((e) => e.target === issNodeId);
      if (!hasIncoming && decisions.length > 0) {
        const dec = decisions[idx % decisions.length];
        addEdgeSafe(`node-dec-${dec.id}`, issNodeId, '#64748b');
      }
    });

    // Edge Generation 2: Issue → Risk & Decision → Risk & Risk.title matching
    risks.forEach((rsk) => {
      const rskNodeId = `node-rsk-${rsk.id}`;

      // Check linked issues
      issues.forEach((iss) => {
        const isLinked =
          iss.relatedRisks?.includes(rsk.id) ||
          (rsk.title && iss.title && (
            (rsk.title.includes('인력') && iss.title.includes('인력')) ||
            (rsk.title.includes('크레인') && iss.title.includes('공정')) ||
            (rsk.title.includes('지원금') && iss.title.includes('고용'))
          ));

        if (isLinked) {
          addEdgeSafe(`node-iss-${iss.id}`, rskNodeId, '#f43f5e'); // rose-500
        }
      });

      // Check linked decisions (Decision.relatedRisks or Risk.title matching)
      decisions.forEach((dec) => {
        const isLinkedDec =
          (dec as any).relatedRisks?.includes(rsk.id) ||
          (rsk.title && dec.title && (
            (rsk.title.includes('인력') && dec.title.includes('인력')) ||
            (rsk.title.includes('크레인') && dec.title.includes('박진태'))
          ));

        if (isLinkedDec) {
          addEdgeSafe(`node-dec-${dec.id}`, rskNodeId, '#f43f5e');
        }
      });
    });

    // Fallback connect orphan risks to first issue or decision
    risks.forEach((rsk, idx) => {
      const rskNodeId = `node-rsk-${rsk.id}`;
      const hasIncoming = generatedEdges.some((e) => e.target === rskNodeId);
      if (!hasIncoming) {
        if (issues.length > 0) {
          addEdgeSafe(`node-iss-${issues[idx % issues.length].id}`, rskNodeId, '#f43f5e');
        } else if (decisions.length > 0) {
          addEdgeSafe(`node-dec-${decisions[0].id}`, rskNodeId, '#f43f5e');
        }
      }
    });

    // Edge Generation 3: Risk → Action & Action.relatedDecision
    actions.forEach((act) => {
      const actNodeId = `node-act-${act.id}`;

      if (act.relatedDecision) {
        // Connect from Decision directly or via connected Risk
        decisions.forEach((dec) => {
          if (dec.id === act.relatedDecision) {
            addEdgeSafe(`node-dec-${dec.id}`, actNodeId, '#f59e0b'); // amber-500
          }
        });
      }

      // Connect from matching Risk
      risks.forEach((rsk) => {
        const isRiskActionMatch =
          (rsk.title.includes('인력') && act.title.includes('인력')) ||
          (rsk.title.includes('크레인') && act.title.includes('크레인')) ||
          (rsk.title.includes('지원금') && act.title.includes('지원')) ||
          (rsk.owner && act.owner && rsk.owner.split(' ')[0] === act.owner.split(' ')[0]);

        if (isRiskActionMatch) {
          addEdgeSafe(`node-rsk-${rsk.id}`, actNodeId, '#f59e0b');
        }
      });
    });

    // Fallback connect orphan actions
    actions.forEach((act, idx) => {
      const actNodeId = `node-act-${act.id}`;
      const hasIncoming = generatedEdges.some((e) => e.target === actNodeId);
      if (!hasIncoming && risks.length > 0) {
        addEdgeSafe(`node-rsk-${risks[idx % risks.length].id}`, actNodeId, '#f59e0b');
      }
    });

    // Edge Generation 4: Action → Person & Document.relatedPeople
    people.forEach((per) => {
      const perNodeId = `node-per-${per.id}`;

      // Check actions where owner matches person
      actions.forEach((act) => {
        const isMatch =
          act.owner.includes(per.name) ||
          (per.name.includes('박진태') && act.owner.includes('박진태')) ||
          (per.name.includes('이강원') && act.owner.includes('이강원')) ||
          (per.name.includes('정재훈') && act.owner.includes('정재훈'));

        if (isMatch) {
          addEdgeSafe(`node-act-${act.id}`, perNodeId, '#cbd5e1'); // slate-300
        }
      });

      // Check Document.relatedPeople criteria
      documents.forEach((doc) => {
        if (doc.relatedPeople?.includes(per.id) || doc.relatedPeople?.includes(per.name)) {
          // If doc has related decisions or actions, connect to person
          if (doc.relatedActions) {
            doc.relatedActions.forEach((actId) => {
              addEdgeSafe(`node-act-${actId}`, perNodeId, '#cbd5e1');
            });
          }
          if (doc.relatedDecisions && actions.length > 0) {
            addEdgeSafe(`node-act-${actions[0].id}`, perNodeId, '#cbd5e1');
          }
        }
      });

      // Check issue related people
      issues.forEach((iss) => {
        if (iss.relatedPeople?.includes(per.id) || iss.relatedPeople?.includes(per.name)) {
          // Connect via actions or directly
          if (actions.length > 0) {
            addEdgeSafe(`node-act-${actions[0].id}`, perNodeId, '#cbd5e1');
          }
        }
      });
    });

    // Fallback connect orphan people
    people.forEach((per, idx) => {
      const perNodeId = `node-per-${per.id}`;
      const hasIncoming = generatedEdges.some((e) => e.target === perNodeId);
      if (!hasIncoming && actions.length > 0) {
        addEdgeSafe(`node-act-${actions[idx % actions.length].id}`, perNodeId, '#cbd5e1');
      }
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [decisions, issues, risks, actions, people, documents]);

  // Find linked decision for any node
  const findLinkedDecision = useCallback(
    (type: string, raw: any): Decision | undefined => {
      if (type === 'decision') return raw as Decision;
      if (type === 'issue') {
        const iss = raw as Issue;
        return (
          decisions.find((d) => d.id === iss.relatedDecision) ||
          decisions.find((d) => d.title.includes('인력') && iss.title.includes('인력')) ||
          decisions[0]
        );
      }
      if (type === 'risk') {
        const rsk = raw as Risk;
        return (
          decisions.find((d) => d.title.includes('인력') && rsk.title.includes('인력')) ||
          decisions.find((d) => d.title.includes('박진태') && rsk.title.includes('크레인')) ||
          decisions[0]
        );
      }
      if (type === 'action') {
        const act = raw as Action;
        return (
          decisions.find((d) => d.id === act.relatedDecision) ||
          decisions.find((d) => d.title.includes('인력') && act.title.includes('인력')) ||
          decisions[0]
        );
      }
      if (type === 'person') {
        return decisions[0];
      }
      return decisions[0];
    },
    [decisions]
  );

  // Handle Node Click
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const raw = node.data.raw;
    const type = node.type as 'decision' | 'issue' | 'risk' | 'action' | 'person';
    const targetDecision = findLinkedDecision(type, raw);

    setSelectedEntity({ type, raw, targetDecision });

    // Directly call onSelectDecision if requested
    if (targetDecision && onSelectDecision) {
      onSelectDecision(targetDecision);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col shadow-2xl overflow-hidden">
      {/* Top Bar: Executive Legend & Controls */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-black text-white tracking-tight">
              임원 전략 인과 의존성 그래프 (Decision Dependency Graph)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Decision → Issue → Risk → Action → Person 5단계 파급효과 및 인과관계 시각화 (읽기 전용)
          </p>
        </div>

        {/* 5-Color Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black border border-slate-700 text-white font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            Decision (검정)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-600 text-slate-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Issue (슬레이트)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-600 text-rose-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Risk (로즈)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-500 text-amber-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Action (엠버)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-900 font-extrabold">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            Person (화이트)
          </span>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="w-full h-[650px] relative bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-slate-950"
        >
          <Background color="#334155" gap={24} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !rounded-lg !overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-800" />
          <MiniMap
            className="!bg-slate-900 !border !border-slate-800 !rounded-xl !overflow-hidden !shadow-2xl"
            nodeColor={(node) => {
              switch (node.type) {
                case 'decision':
                  return '#000000';
                case 'issue':
                  return '#475569';
                case 'risk':
                  return '#e11d48';
                case 'action':
                  return '#d97706';
                case 'person':
                  return '#ffffff';
                default:
                  return '#64748b';
              }
            }}
            maskColor="rgba(2, 6, 23, 0.75)"
          />
        </ReactFlow>

        {/* Selected Entity Quick Peek Banner */}
        {selectedEntity && (
          <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl backdrop-blur flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded text-xs font-mono font-black uppercase bg-blue-900/80 border border-blue-500 text-blue-200">
                선택: {selectedEntity.type.toUpperCase()}
              </span>
              <div>
                <h4 className="text-sm font-black text-white">
                  {selectedEntity.raw.title || selectedEntity.raw.name}
                </h4>
                {selectedEntity.targetDecision && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    연결된 핵심 의사결정: <strong className="text-slate-200">{selectedEntity.targetDecision.title}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedEntity.targetDecision && onSelectDecision && (
                <button
                  onClick={() => onSelectDecision(selectedEntity.targetDecision!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors cursor-pointer shadow-md"
                >
                  <span>해당 Decision 상세 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="닫기"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionGraphView;
