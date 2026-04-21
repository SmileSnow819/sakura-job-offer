import React, { useMemo } from 'react';

interface TimelineNode {
  x: number;
  y: number;
  isOffer: boolean;
  isActive: boolean;
  color: string;
}

interface TimelineSVGProps {
  nodes: TimelineNode[];
  containerHeight: number;
}

function generateWavyPath(nodes: TimelineNode[]): string {
  if (nodes.length === 0) return '';
  
  const centerX = 50;
  const amplitude = 0.5;
  const frequency = 0.015;
  
  let path = `M ${centerX},0 `;
  
  for (let i = 0; i < nodes.length - 1; i++) {
    const curr = nodes[i];
    const next = nodes[i + 1];
    
    const waveOffset = Math.sin(curr.y * frequency) * amplitude;
    const x = centerX + waveOffset;
    
    const controlY1 = curr.y + (next.y - curr.y) * 0.4;
    const controlY2 = curr.y + (next.y - curr.y) * 0.6;
    const nextX = centerX + Math.sin(next.y * frequency) * amplitude;
    
    path += `C ${x},${controlY1} ${x},${controlY2} ${nextX},${next.y} `;
  }
  
  return path;
}

function generateStarPath(cx: number, cy: number, size: number): string {
  const points = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  let path = '';
  
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    path += `${i === 0 ? 'M' : 'L'} ${x},${y} `;
  }
  return path + 'Z';
}

export const TimelineSVG: React.FC<TimelineSVGProps> = ({ nodes, containerHeight }) => {
  const path = useMemo(() => generateWavyPath(nodes), [nodes]);
  
  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: containerHeight || '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      viewBox={`0 0 100 ${containerHeight || 100}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.65 0.18 350)" />
          <stop offset="50%" stopColor="oklch(0.60 0.14 330)" />
          <stop offset="100%" stopColor="oklch(0.58 0.16 10)" />
        </linearGradient>
        
        <linearGradient id="offerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.75 0.15 85)" />
          <stop offset="50%" stopColor="oklch(0.70 0.18 75)" />
          <stop offset="100%" stopColor="oklch(0.78 0.14 95)" />
        </linearGradient>
        
        <radialGradient id="offerGlow">
          <stop offset="0%" stopColor="oklch(0.75 0.15 85)" stopOpacity="0.25" />
          <stop offset="50%" stopColor="oklch(0.70 0.16 80)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="oklch(0.78 0.12 90)" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {path && (
        <path
          d={path}
          stroke="url(#timelineGradient)"
          strokeWidth={1}
          fill="none"
          style={{
            filter: 'drop-shadow(0 0 4px oklch(0.65 0.12 350 / 0.15))',
          }}
        />
      )}
      
      {nodes.map((node, i) => (
        node.isOffer ? (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={14}
              fill="url(#offerGlow)"
            />
            <path
              d={generateStarPath(node.x, node.y, node.isActive ? 10 : 8)}
              fill="url(#offerGradient)"
              stroke="oklch(0.99 0.005 350)"
              strokeWidth={2}
              style={{
                filter: 'drop-shadow(0 0 6px oklch(0.70 0.15 85 / 0.4))',
              }}
            />
          </g>
        ) : (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r={node.isActive ? 8 : 6}
            fill="oklch(0.99 0.005 350)"
            stroke={node.color}
            strokeWidth={node.isActive ? 2.5 : 2}
            style={{
              filter: node.isActive 
                ? `drop-shadow(0 0 0 3px ${node.color}25)` 
                : `drop-shadow(0 2px 4px ${node.color}33)`,
            }}
          />
        )
      ))}
    </svg>
  );
};

export default TimelineSVG;
