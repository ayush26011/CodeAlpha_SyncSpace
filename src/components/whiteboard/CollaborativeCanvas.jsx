import React, { useRef, useState, useEffect } from 'react';
import { getSocket } from '../../services/socketService';
import { Palette, Trash2 } from 'lucide-react';

export default function CollaborativeCanvas({ roomId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#7F543D'); // Coastal Retreat Highlight
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  const prevPosRef = useRef({ x: 0, y: 0 });
  const strokeBufferRef = useRef([]); // Store drawing strokes locally before batch saving to DB

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Fetch initial strokes from DB
    fetch(`http://localhost:5002/api/whiteboard/${roomId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('syncspace_token')}`
      }
    })
      .then(res => res.json())
      .then(session => {
        if (session && session.strokes) {
          session.strokes.forEach(stroke => {
            drawLineOnCanvas(stroke.prevX, stroke.prevY, stroke.currX, stroke.currY, stroke.color, stroke.size);
          });
        }
      })
      .catch(e => console.error("Error loading whiteboard history:", e));

    const socketCon = getSocket();
    if (socketCon) {
      socketCon.on('whiteboard_draw', (drawData) => {
        drawLineOnCanvas(
          drawData.prevX,
          drawData.prevY,
          drawData.currX,
          drawData.currY,
          drawData.color,
          drawData.size
        );
      });

      socketCon.on('whiteboard_clear', () => {
        clearCanvasLocal();
      });
    }

    return () => {
      if (socketCon) {
        socketCon.off('whiteboard_draw');
        socketCon.off('whiteboard_clear');
      }
    };
  }, [roomId]);

  // Periodic flush of strokes buffer to MongoDB Atlas
  useEffect(() => {
    const flushStrokes = () => {
      if (strokeBufferRef.current.length === 0) return;
      const strokesToSave = [...strokeBufferRef.current];
      strokeBufferRef.current = [];

      fetch(`http://localhost:5002/api/whiteboard/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('syncspace_token')}`
        },
        body: JSON.stringify({ strokes: strokesToSave })
      }).catch(e => console.error("Error saving whiteboard strokes:", e));
    };

    const interval = setInterval(flushStrokes, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const drawLineOnCanvas = (x1, y1, x2, y2, strokeColor, size) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStartDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    prevPosRef.current = { x, y };
    setIsDrawing(true);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const prevX = prevPosRef.current.x;
    const prevY = prevPosRef.current.y;
    const strokeColor = isEraser ? '#DBE2DC' : color;

    drawLineOnCanvas(prevX, prevY, x, y, strokeColor, brushSize);

    const stroke = { prevX, prevY, currX: x, currY: y, color: strokeColor, size: brushSize };
    strokeBufferRef.current.push(stroke);

    const socketCon = getSocket();
    if (socketCon) {
      socketCon.emit('whiteboard_draw', {
        roomId,
        drawData: stroke
      });
    }

    prevPosRef.current = { x, y };
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvasLocal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearBoard = () => {
    clearCanvasLocal();
    strokeBufferRef.current = [];

    // Clear session strokes in DB
    fetch(`http://localhost:5002/api/whiteboard/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('syncspace_token')}`
      }
    }).catch(e => console.error("Error clearing whiteboard session:", e));

    const socketCon = getSocket();
    if (socketCon) {
      socketCon.emit('whiteboard_clear', { roomId });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#DBE2DC', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      {/* Control bar */}
      <div className="flex-center" style={{ padding: '0.65rem 1rem', background: '#335765', color: '#FFFFFF', justifyContent: 'space-between', gap: '1rem' }}>
        <div className="flex-center" style={{ gap: '12px' }}>
          <Palette size={16} />
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsEraser(false);
            }}
            style={{ width: '32px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsEraser(!isEraser)}
            style={{ padding: '4px 8px', fontSize: '0.8rem', background: isEraser ? 'var(--highlight)' : 'rgba(255,255,255,0.1)' }}
          >
            {isEraser ? 'Drawing: Eraser' : 'Eraser Tool'}
          </button>
        </div>
        <div className="flex-center" style={{ gap: '10px' }}>
          <span style={{ fontSize: '0.8rem' }}>Brush Size:</span>
          <input
            type="range"
            min="2"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--secondary)' }}
          />
        </div>
        <button
          type="button"
          className="btn-primary flex-center"
          onClick={handleClearBoard}
          style={{ background: '#e63946', padding: '4px 10px', fontSize: '0.8rem', gap: '4px' }}
        >
          <Trash2 size={12} /> Clear Board
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={700}
        height={400}
        onMouseDown={handleStartDrawing}
        onMouseMove={handleDraw}
        onMouseUp={handleStopDrawing}
        onMouseLeave={handleStopDrawing}
        onTouchStart={handleStartDrawing}
        onTouchMove={handleDraw}
        onTouchEnd={handleStopDrawing}
        style={{ flex: 1, cursor: 'crosshair', display: 'block', touchAction: 'none' }}
      />
    </div>
  );
}
