'use client';

import React, { useMemo, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, Panel,
  Handle, Position, MarkerType, Node, Edge, NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BlueprintLane, BlueprintNode, BlueprintNote, FlowBlueprint, ServiceFlow, StaffUser } from '@/lib/types';
import { AccessData, laneRoleId } from '@/lib/rbac';
import { blueprintFor } from '@/lib/flow-blueprints';
import { cn } from '@/lib/utils';

/*
 * Draws a service flow the way the municipality's process PDFs do: title bar, lane labels on
 * the left, flow running left → right, numbered activities, decision diamonds, sub-process
 * hexagons, off-page connectors, and an explanatory-notes lane. Staff activities carry an
 * assignee select bound to the lane's service role.
 */

const LABEL_W = 110;
const COL_W = 178;
const NODE_W = 152;
const LANE_H = 176;
const STAFF_LANE_H = 196;
const TITLE_H = 58;
const NOTE_W = 300;
const NOTE_H = 132;
const NOTE_GAP = 16;

// PDF palette
const C = {
  title: '#1f6fb2',
  laneLabel: '#dce8f6',
  laneA: '#ffffff',
  laneB: '#f3f7fb',
  border: '#1e293b',
  badge: '#1f6fb2',
  line: '#111827',
  box: '#f4f4f5',
};

export interface BlueprintProps {
  isAr: boolean;
  flow: ServiceFlow;
  title: string;
  access: AccessData;
  /** Omit for a read-only diagram */
  onAssign?: (nodeId: string, userId: string | null) => void;
  /** Called when an assignee is picked who doesn't hold the lane's role yet */
  onGrantRole?: (userId: string, roleId: string, serviceId: string) => void;
  className?: string;
}

const Handles = () => {
  const style = { opacity: 0, width: 6, height: 6 };
  return (
    <>
      {([['top', Position.Top], ['bottom', Position.Bottom], ['left', Position.Left], ['right', Position.Right]] as const).map(([id, pos]) => (
        <React.Fragment key={id}>
          <Handle id={`s-${id}`} type="source" position={pos} style={style} />
          <Handle id={`t-${id}`} type="target" position={pos} style={style} />
        </React.Fragment>
      ))}
    </>
  );
};

const Badge = ({ num }: { num?: string }) => num ? (
  <span style={{ background: C.badge }} className="absolute -top-3 -start-3 min-w-6 h-6 px-1 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow ring-2 ring-white">{num}</span>
) : null;

// ─── Node renderers ───

const LaneNode = ({ data }: NodeProps) => {
  const d = data as { label: string; sub?: string; width: number; height: number; shade: boolean; dim?: boolean };
  return (
    <div style={{ width: d.width, height: d.height, background: d.shade ? C.laneB : C.laneA, borderBottom: `1.5px solid ${C.border}` }} className="flex" dir="ltr">
      <div style={{ width: LABEL_W, background: C.laneLabel, borderRight: `1.5px solid ${C.border}` }} className="h-full flex items-center justify-center">
        <div className="-rotate-90 whitespace-nowrap text-center" style={{ width: d.height - 12 }}>
          <p className={cn('font-black leading-tight text-[13px] whitespace-normal', d.dim ? 'text-slate-500' : 'text-slate-800')} dir="auto">{d.label}</p>
          {d.sub && <p className="text-[10px] font-bold text-slate-500">{d.sub}</p>}
        </div>
      </div>
    </div>
  );
};

const TitleNode = ({ data }: NodeProps) => {
  const d = data as { title: string; width: number };
  return (
    <div style={{ width: d.width, height: TITLE_H, background: C.title, borderBottom: `1.5px solid ${C.border}` }} dir="auto"
      className="flex items-center justify-center text-white font-black text-2xl px-6">{d.title}</div>
  );
};

const TerminalNode = ({ data }: NodeProps) => {
  const d = data as { label: string; kind: 'start' | 'end' };
  return (
    <div className={cn('w-[92px] h-10 rounded-full flex items-center justify-center font-black text-sm border-2 text-white shadow-sm',
      d.kind === 'start' ? 'bg-[#82b366] border-[#4d7a36]' : 'bg-[#d42a2a] border-[#8f1414]')}>
      <Handles />{d.label}
    </div>
  );
};

const DecisionNode = ({ data }: NodeProps) => {
  const d = data as { label: string; isAr: boolean; dimmed: boolean };
  return (
    <div className={cn('relative w-[118px] h-[104px] flex items-center justify-center transition-opacity', d.dimmed && 'opacity-30')}>
      <Handles />
      <svg viewBox="0 0 118 104" className="absolute inset-0"><polygon points="59,2 116,52 59,102 2,52" fill="#ffe6cc" stroke="#d79b00" strokeWidth="2" /></svg>
      <span className="relative text-[10.5px] font-bold text-slate-800 text-center leading-tight px-7" dir={d.isAr ? 'rtl' : 'ltr'}>{d.label}</span>
    </div>
  );
};

const SubprocessNode = ({ data }: NodeProps) => {
  const d = data as { label: string; num?: string; isAr: boolean; dimmed: boolean };
  return (
    <div className={cn('relative w-[152px] h-[66px] flex items-center justify-center transition-opacity', d.dimmed && 'opacity-30')}>
      <Handles />
      <svg viewBox="0 0 152 66" className="absolute inset-0"><polygon points="24,2 128,2 150,33 128,64 24,64 2,33" fill="#dae8fc" stroke="#6c8ebf" strokeWidth="2" /></svg>
      <Badge num={d.num} />
      <span className="relative text-[10.5px] font-bold text-slate-800 text-center leading-tight px-6" dir={d.isAr ? 'rtl' : 'ltr'}>{d.label}</span>
    </div>
  );
};

const ConnectorNode = ({ data }: NodeProps) => {
  const d = data as { label: string };
  return (
    <div className="size-[30px] rounded-full bg-[#dae8fc] border-2 border-[#6c8ebf] flex items-center justify-center text-[10px] font-black text-slate-700">
      <Handles />{d.label}
    </div>
  );
};

interface TaskData {
  node: BlueprintNode; isAr: boolean; staff: boolean; hasRole: boolean;
  holders: StaffUser[]; handlers: StaffUser[]; others: StaffUser[];
  dimmed: boolean; highlighted: boolean;
  onAssign?: BlueprintProps['onAssign']; onGrant?: (userId: string) => void;
}

const TaskNode = ({ data }: NodeProps) => {
  const d = data as unknown as TaskData;
  const { node, isAr } = d;
  const name = (u: StaffUser) => `${u.employeeNumber} · ${isAr ? u.nameAr : u.nameEn || u.nameAr}`;
  const named = d.handlers.length === 1 && node.assigneeUserId === d.handlers[0].id;
  return (
    <div style={{ width: NODE_W, background: C.box, borderColor: d.highlighted ? '#03CFCB' : '#52525b' }} dir={isAr ? 'rtl' : 'ltr'}
      className={cn('relative border-[1.5px] rounded-lg px-2.5 py-2 shadow-sm transition-opacity', d.dimmed && 'opacity-25', d.highlighted && 'ring-4 ring-[#03CFCB]/35')}>
      <Handles />
      <Badge num={node.num} />
      <p className="text-[10.5px] font-semibold text-slate-800 leading-snug text-center min-h-[44px] flex items-center justify-center">{isAr ? node.labelAr : node.labelEn}</p>
      {d.staff && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-300">
          {!d.hasRole ? (
            <p className="text-[9.5px] font-bold text-amber-600 text-center">{isAr ? 'المسار غير مربوط بدور' : 'Lane not linked to a role'}</p>
          ) : d.onAssign ? (
            <select
              className="nodrag nowheel w-full text-[9.5px] font-bold rounded border border-slate-300 bg-white px-1 py-0.5"
              value={named ? d.handlers[0].id : ''}
              onChange={ev => {
                const v = ev.target.value;
                if (v.startsWith('grant:')) { const id = v.slice(6); d.onGrant?.(id); d.onAssign!(node.id, id); }
                else d.onAssign!(node.id, v || null);
              }}
              aria-label={isAr ? 'المسند' : 'Assignee'}
            >
              <option value="">{d.holders.length ? (isAr ? `كل حاملي الدور (${d.holders.length})` : `Any role holder (${d.holders.length})`) : (isAr ? '— غير مسند —' : '— unassigned —')}</option>
              {d.holders.map(u => <option key={u.id} value={u.id}>{name(u)}</option>)}
              {d.others.length > 0 && (
                <optgroup label={isAr ? 'إسناد الدور لموظف آخر' : 'Give the role to…'}>
                  {d.others.map(u => <option key={u.id} value={`grant:${u.id}`}>+ {name(u)}</option>)}
                </optgroup>
              )}
            </select>
          ) : (
            <p className="text-[9.5px] font-bold text-slate-500 text-center truncate">{d.handlers.map(u => u.employeeNumber).join('، ') || (isAr ? 'غير مسند' : 'Unassigned')}</p>
          )}
        </div>
      )}
    </div>
  );
};

const NoteNode = ({ data }: NodeProps) => {
  const d = data as { note: BlueprintNote; isAr: boolean };
  return (
    <div style={{ width: NOTE_W, height: NOTE_H }} dir={d.isAr ? 'rtl' : 'ltr'}
      className="relative bg-[#fafaf7] border border-slate-400 rounded-md text-[10px] leading-relaxed text-slate-700">
      <span style={{ background: C.badge }} className="absolute -top-2.5 -end-2.5 z-10 size-6 rounded-full text-white text-[11px] font-black flex items-center justify-center ring-2 ring-white">{d.note.num}</span>
      <div className="h-full overflow-y-auto overflow-x-hidden nowheel p-3 pt-3.5">{d.isAr ? d.note.textAr : d.note.textEn}</div>
    </div>
  );
};

const nodeTypes = {
  lane: LaneNode, title: TitleNode, terminal: TerminalNode, decision: DecisionNode,
  subprocess: SubprocessNode, connector: ConnectorNode, task: TaskNode, note: NoteNode,
};

const NODE_H: Record<BlueprintNode['kind'], number> = { start: 40, end: 40, task: 76, decision: 104, subprocess: 66, connector: 30 };
const NODE_WIDTH: Record<BlueprintNode['kind'], number> = { start: 92, end: 92, task: NODE_W, decision: 118, subprocess: 152, connector: 30 };

/** Picks handles so arrows leave/enter like the PDF's orthogonal connectors */
function route(a: { col: number; lane: number }, b: { col: number; lane: number }) {
  const dc = b.col - a.col, dl = b.lane - a.lane;
  if (Math.abs(dc) < 0.6) return dl > 0 ? ['s-bottom', 't-top'] : ['s-top', 't-bottom'];
  if (dc > 0) return dl === 0 ? ['s-right', 't-left'] : dl > 0 ? ['s-bottom', 't-left'] : ['s-top', 't-left'];
  return dl === 0 ? ['s-top', 't-top'] : dl > 0 ? ['s-bottom', 't-top'] : ['s-top', 't-bottom'];
}

function BlueprintCanvas({ isAr, flow, title, access, onAssign, onGrantRole, className }: BlueprintProps) {
  const [focusUserId, setFocusUserId] = useState('');
  const bp: FlowBlueprint = useMemo(() => blueprintFor(flow), [flow]);

  const { nodes, edges, focusCount } = useMemo(() => {
    const maxCol = Math.max(1, ...bp.nodes.map(n => n.col));
    const width = LABEL_W + (maxCol + 1) * COL_W + 40;
    const contentW = width - LABEL_W - 40;
    const perRow = Math.max(1, Math.floor((contentW + NOTE_GAP) / (NOTE_W + NOTE_GAP)));
    const noteRows = Math.ceil(bp.notes.length / perRow);
    const notesH = bp.notes.length ? noteRows * (NOTE_H + NOTE_GAP) + 32 : 0;

    const laneH = (l: BlueprintLane) => (l.kind === 'staff' ? STAFF_LANE_H : LANE_H);
    const laneTop: Record<string, number> = {};
    let y = TITLE_H;
    bp.lanes.forEach(l => { laneTop[l.id] = y; y += laneH(l); });
    const notesTop = y;
    const laneIndex = Object.fromEntries(bp.lanes.map((l, i) => [l.id, i]));
    const laneById = Object.fromEntries(bp.lanes.map(l => [l.id, l]));

    // A lane links to its role explicitly, or by the same actor code the stages use
    const roleOf = (lane?: BlueprintLane) => {
      if (!lane || lane.kind !== 'staff') return undefined;
      const id = lane.roleId || laneRoleId(flow.serviceId, lane);
      return access.serviceRoles.find(r => r.id === id && r.isActive)?.id;
    };
    const holdersOf = (lane?: BlueprintLane) => {
      const rid = roleOf(lane);
      if (!rid) return [];
      const ids = new Set(access.roleAssignments.filter(a => a.roleId === rid).map(a => a.userId));
      return access.staffUsers.filter(u => u.isActive && ids.has(u.id));
    };

    const out: Node[] = [
      { id: '__title', type: 'title', position: { x: 0, y: 0 }, data: { title, width }, draggable: false, selectable: false, zIndex: -1 },
      ...bp.lanes.map((l, i) => {
        const holders = holdersOf(l);
        return {
          id: `__lane-${l.id}`, type: 'lane', position: { x: 0, y: laneTop[l.id] },
          data: {
            label: isAr ? l.labelAr : l.labelEn, width, height: laneH(l), shade: i % 2 === 1,
            sub: l.kind === 'staff' ? (holders.length ? `${holders.length} ${isAr ? 'موظف' : 'staff'}` : (isAr ? 'بلا موظف' : 'unstaffed')) : undefined,
          },
          draggable: false, selectable: false, focusable: false, zIndex: -1, style: { pointerEvents: 'none' as const },
        };
      }),
    ];
    if (bp.notes.length) {
      out.push({
        id: '__lane-notes', type: 'lane', position: { x: 0, y: notesTop },
        data: { label: isAr ? 'ملاحظات توضيحية' : 'Explanatory notes', width, height: notesH, shade: bp.lanes.length % 2 === 1, dim: true },
        draggable: false, selectable: false, focusable: false, zIndex: -1, style: { pointerEvents: 'none' as const },
      });
      [...bp.notes].sort((a, b) => a.num - b.num).forEach((note, i) => {
        const row = Math.floor(i / perRow), slot = i % perRow;
        // Arabic PDFs read the notes right → left, like the page
        const x = isAr ? width - 40 - (slot + 1) * NOTE_W - slot * NOTE_GAP : LABEL_W + 20 + slot * (NOTE_W + NOTE_GAP);
        out.push({ id: `__note-${note.num}`, type: 'note', position: { x, y: notesTop + 20 + row * (NOTE_H + NOTE_GAP) }, data: { note, isAr }, draggable: false });
      });
    }

    let focusCount = 0;
    bp.nodes.forEach(n => {
      const lane = laneById[n.lane];
      const h = NODE_H[n.kind] + (n.kind === 'task' && lane?.kind === 'staff' ? 32 : 0);
      const w = NODE_WIDTH[n.kind];
      const centerY = laneTop[n.lane] + laneH(lane) / 2 + (n.offset === 'top' ? -46 : n.offset === 'bottom' ? 46 : 0);
      const position = { x: LABEL_W + n.col * COL_W + (COL_W - w) / 2 + 10, y: centerY - h / 2 };
      const staff = lane?.kind === 'staff';
      const holders = staff ? holdersOf(lane) : [];
      const named = holders.find(u => u.id === n.assigneeUserId);
      const handlers = named ? [named] : holders;
      const highlighted = !!focusUserId && staff && handlers.some(u => u.id === focusUserId);
      if (highlighted) focusCount++;
      const dimmed = !!focusUserId && !highlighted && (n.kind === 'task' || n.kind === 'decision' || n.kind === 'subprocess');

      if (n.kind === 'start' || n.kind === 'end') out.push({ id: n.id, type: 'terminal', position, data: { kind: n.kind, label: isAr ? n.labelAr : n.labelEn } });
      else if (n.kind === 'decision') out.push({ id: n.id, type: 'decision', position, data: { label: isAr ? n.labelAr : n.labelEn, isAr, dimmed } });
      else if (n.kind === 'subprocess') out.push({ id: n.id, type: 'subprocess', position, data: { label: isAr ? n.labelAr : n.labelEn, num: n.num, isAr, dimmed } });
      else if (n.kind === 'connector') out.push({ id: n.id, type: 'connector', position, data: { label: n.labelAr } });
      else {
        const data: TaskData = {
          node: n, isAr, staff, hasRole: !!roleOf(lane), holders, handlers,
          others: access.staffUsers.filter(u => u.isActive && !holders.some(x => x.id === u.id)),
          dimmed: !!focusUserId && !highlighted, highlighted,
          onAssign, onGrant: roleOf(lane) && onGrantRole ? (uid: string) => onGrantRole(uid, roleOf(lane)!, flow.serviceId) : undefined,
        };
        out.push({ id: n.id, type: 'task', position, data: data as unknown as Record<string, unknown> });
      }
    });

    const pos = Object.fromEntries(bp.nodes.map(n => [n.id, { col: n.col, lane: laneIndex[n.lane] ?? 0 }]));
    const edges: Edge[] = bp.edges.filter(e => pos[e.from] && pos[e.to]).map((e, i) => {
      const [sourceHandle, targetHandle] = route(pos[e.from], pos[e.to]);
      const label = isAr ? e.labelAr : e.labelEn;
      const negative = /^(لا|رفض|مرفوض|فشل)/.test(e.labelAr || '');
      const stroke = e.dashed ? '#475569' : C.line;
      return {
        id: `e${i}`, source: e.from, target: e.to, sourceHandle, targetHandle, type: 'smoothstep',
        style: { stroke, strokeWidth: 1.6, ...(e.dashed ? { strokeDasharray: '7 5' } : {}) },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        ...(label ? {
          label, labelBgPadding: [5, 2] as [number, number], labelBgBorderRadius: 3,
          labelBgStyle: { fill: '#fff', stroke: '#334155', strokeWidth: 0.8 },
          labelStyle: { fontSize: 10, fontWeight: 800, fill: negative ? '#b91c1c' : '#111827' },
        } : {}),
      };
    });
    return { nodes: out, edges, focusCount };
  }, [bp, access, isAr, title, focusUserId, onAssign, onGrantRole, flow.serviceId]);

  const activeUsers = access.staffUsers.filter(u => u.isActive);

  return (
    <div className={cn('relative h-[780px] rounded-2xl overflow-hidden border bg-slate-100', className)} dir="ltr">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.08} nodesConnectable={false} proOptions={{ hideAttribution: true }}>
        <Background color="#cbd5e1" gap={40} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable style={{ width: 160, height: 90 }} nodeColor={n => (n.type === 'lane' || n.type === 'title' || n.type === 'note' ? 'transparent' : C.badge)} />
        <Panel position="top-left" className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-2.5">
          <div dir={isAr ? 'rtl' : 'ltr'} className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600">{isAr ? 'مراحل موظف:' : 'Stages of:'}</span>
            <select value={focusUserId} onChange={e => setFocusUserId(e.target.value)} className="text-xs font-bold rounded-md border border-slate-200 px-2 py-1" aria-label={isAr ? 'تصفية حسب الموظف' : 'Filter by employee'}>
              <option value="">{isAr ? 'الكل' : 'Everyone'}</option>
              {activeUsers.map(u => <option key={u.id} value={u.id}>{u.employeeNumber} · {isAr ? u.nameAr : u.nameEn || u.nameAr}</option>)}
            </select>
            {focusUserId && <span className="text-xs font-black text-[#0e7490]">{focusCount} {isAr ? 'مرحلة' : 'stages'}</span>}
          </div>
        </Panel>
        {bp.source && (
          <Panel position="top-right" className="bg-white/90 rounded-lg shadow px-2.5 py-1 text-[10px] font-bold text-slate-500" >
            <span dir="rtl">{isAr ? 'المصدر: ' : 'Source: '}{bp.source}</span>
          </Panel>
        )}
      </ReactFlow>
      {bp.nodes.length <= 3 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="bg-white rounded-xl shadow px-6 py-4 text-sm font-bold text-slate-500" dir={isAr ? 'rtl' : 'ltr'}>
            {isAr ? 'لا توجد مراحل معالجة لهذه الخدمة بعد' : 'No processing stages for this service yet'}
          </p>
        </div>
      )}
    </div>
  );
}

export function SwimlaneBlueprint(props: BlueprintProps) {
  return <ReactFlowProvider><BlueprintCanvas {...props} /></ReactFlowProvider>;
}
