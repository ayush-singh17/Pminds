import { useState } from 'react';
import { type EdgeProps, getBezierPath, BaseEdge } from 'reactflow';

/**
 * Custom ReactFlow edge that shows connection strength as a pill label
 * and reveals the connection reason on hover.
 */
export default function ReasonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strength: number = data?.strength ?? 0;
  const reason: string = data?.reason ?? '';

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible wider hit area for easy hovering */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge */}
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />

      {/* Strength pill label */}
      <foreignObject
        x={labelX - 28}
        y={labelY - 12}
        width={56}
        height={24}
        requiredExtensions="http://www.w3.org/1999/xhtml"
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: 10,
            fontWeight: 600,
            color: '#06b6d4',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 9999,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {Math.round(strength * 100)}%
        </div>
      </foreignObject>

      {/* Reason tooltip – visible on hover */}
      {hovered && reason && (
        <foreignObject
          x={labelX - 120}
          y={labelY + 16}
          width={240}
          height={80}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'var(--surface, #111827)',
              color: 'var(--text-muted, #94A3B8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11,
              lineHeight: 1.4,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              maxWidth: 240,
              wordWrap: 'break-word',
            }}
          >
            {reason}
          </div>
        </foreignObject>
      )}
    </g>
  );
}
