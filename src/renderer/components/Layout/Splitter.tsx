/**
 * Splitter Component (T042)
 * Resizable panel divider with drag-to-resize functionality
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './Splitter.css';

interface SplitterProps {
  /** Direction of the splitter */
  direction: 'horizontal' | 'vertical';
  /** Minimum size of the first panel in pixels */
  minFirst?: number;
  /** Minimum size of the second panel in pixels */
  minSecond?: number;
  /** Maximum size of the first panel in pixels */
  maxFirst?: number;
  /** Maximum size of the second panel in pixels */
  maxSecond?: number;
  /** Initial size of the first panel in pixels */
  initialSize?: number;
  /** Callback when size changes */
  onResize?: (firstSize: number) => void;
  /** First panel content */
  first: React.ReactNode;
  /** Second panel content */
  second: React.ReactNode;
  /** CSS class for the container */
  className?: string;
  /** Whether the splitter is collapsible */
  collapsible?: boolean;
  /** Collapsed state (controlled) */
  collapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapse?: (collapsed: boolean) => void;
}

export function Splitter({
  direction,
  minFirst = 100,
  minSecond = 100,
  maxFirst,
  maxSecond,
  initialSize,
  onResize,
  first,
  second,
  className = '',
  collapsible = false,
  collapsed: controlledCollapsed,
  onCollapse
}: SplitterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [firstSize, setFirstSize] = useState(initialSize || 280);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;

  const isHorizontal = direction === 'horizontal';

  // Handle mouse down on splitter bar
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = isHorizontal ? rect.width : rect.height;
      const mousePos = isHorizontal
        ? e.clientX - rect.left
        : e.clientY - rect.top;

      // Calculate new first panel size
      let newSize = mousePos;

      // Apply constraints
      newSize = Math.max(newSize, minFirst);
      newSize = Math.min(newSize, containerSize - minSecond - 6); // 6px for splitter bar

      if (maxFirst !== undefined) {
        newSize = Math.min(newSize, maxFirst);
      }
      if (maxSecond !== undefined) {
        newSize = Math.max(newSize, containerSize - maxSecond - 6);
      }

      setFirstSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isHorizontal, minFirst, minSecond, maxFirst, maxSecond, onResize]);

  // Handle double click to collapse/expand
  const handleDoubleClick = useCallback(() => {
    if (!collapsible) return;

    const newCollapsed = !collapsed;
    if (onCollapse) {
      onCollapse(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  }, [collapsible, collapsed, onCollapse]);

  // Get style for first panel
  const firstStyle: React.CSSProperties = {
    [isHorizontal ? 'width' : 'height']: collapsed ? 0 : firstSize,
    [isHorizontal ? 'minWidth' : 'minHeight']: collapsed ? 0 : undefined,
    overflow: 'hidden',
    flexShrink: 0,
    transition: isDragging ? 'none' : 'all 150ms ease'
  };

  // Get style for second panel
  const secondStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 0
  };

  return (
    <div
      ref={containerRef}
      className={`splitter-container splitter-${direction} ${className} ${isDragging ? 'splitter-dragging' : ''}`}
    >
      <div className="splitter-panel splitter-first" style={firstStyle}>
        {first}
      </div>

      <div
        className={`splitter-bar ${collapsed ? 'splitter-collapsed' : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={firstSize}
        aria-valuemin={minFirst}
        aria-valuemax={maxFirst}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 50 : 10;
          if (isHorizontal) {
            if (e.key === 'ArrowLeft') {
              setFirstSize(s => Math.max(minFirst, s - step));
            } else if (e.key === 'ArrowRight') {
              setFirstSize(s => Math.min(maxFirst ?? Infinity, s + step));
            }
          } else {
            if (e.key === 'ArrowUp') {
              setFirstSize(s => Math.max(minFirst, s - step));
            } else if (e.key === 'ArrowDown') {
              setFirstSize(s => Math.min(maxFirst ?? Infinity, s + step));
            }
          }
        }}
      >
        <div className="splitter-handle" />
      </div>

      <div className="splitter-panel splitter-second" style={secondStyle}>
        {second}
      </div>
    </div>
  );
}

export default Splitter;
