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

// 生成微妙波动的曲线路径
function generateWavyPath(nodes: TimelineNode[]): string {
  if (nodes.length === 0) return '';
  
  const centerX = 50;  // 百分比
  const amplitude = 0.5;  // 波动幅度（px），非常微妙
  const frequency = 0.015;
  
  let path = `M ${centerX},0 `;
  
  for (let i = 0; i < nodes.length - 1; i++) {
    const curr = nodes[i];
    const next = nodes[i + 1];
    
    // 计算波动偏移（正弦波）
    const waveOffset = Math.sin(curr.y * frequency) * amplitude;
    const x = centerX + waveOffset;
    
    // 使用三次贝塞尔曲线连接
    const controlY1 = curr.y + (next.y - curr.y) * 0.4;
    const controlY2 = curr.y + (next.y - curr.y) * 0.6;
    const nextX = centerX + Math.sin(next.y * frequency) * amplitude;
    
    path += `C ${x},${controlY1} ${x},${controlY2} ${nextX},${next.y} `;
  }
  
  return path;
}

// 生成五角星路径
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
        {/* 时间线渐变 */}
        <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        
        {/* Offer 金色渐变 */}
        <linearGradient id="offerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.75 0.15 85)" />
          <stop offset="50%" stopColor="oklch(0.70 0.18 75)" />
          <stop offset="100%" stopColor="oklch(0.78 0.14 95)" />
        </linearGradient>
        
        {/* Offer 发光效果 */}
        <radialGradient id="offerGlow">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* 曲线路径 */}
      {path && (
        <path
          d={path}
          stroke="url(#timelineGradient)"
          strokeWidth={1}
          fill="none"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.2))',
          }}
        />
      )}
      
      {/* 节点 */}
      {nodes.map((node, i) => (
        node.isOffer ? (
          // Offer 星形节点
          <g key={i}>
            {/* 发光背景 */}
            <circle
              cx={node.x}
              cy={node.y}
              r={14}
              fill="url(#offerGlow)"
            />
            {/* 星形 */}
            <path
              d={generateStarPath(node.x, node.y, node.isActive ? 10 : 8)}
              fill="url(#offerGradient)"
              stroke="oklch(0.99 0.008 350)"
              strokeWidth={2}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))',
              }}
            />
          </g>
        ) : (
          // 普通空心圆节点
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r={node.isActive ? 8 : 6}
            fill="oklch(0.99 0.008 350)"
            stroke={node.color}
            strokeWidth={node.isActive ? 2.5 : 2}
            style={{
              filter: node.isActive 
                ? `drop-shadow(0 0 0 3px ${node.color}33)` 
                : `drop-shadow(0 2px 4px ${node.color}44)`,
            }}
          />
        )
      ))}
    </svg>
  );
};

export default TimelineSVG;
