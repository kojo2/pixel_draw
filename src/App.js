import { useEffect, useRef, useState } from 'react';
import { SketchPicker } from 'react-color';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import './App.css';
import { previousStates } from './previousStates';

let stateIndex = 0;
let manualChange = false;
let lowestDiffHolder;
let tries;

const colorPickerX = '85vh';

function App() {
  const width = 265;
  const height = 475;
  const [bmap, setBmap] = useState([{ x: 0, y: 0, w: width, h: height, c: 'white' }]);
  const [hover, setHover] = useState(false);
  const [currentColor, setCurrentColor] = useState({ hex: '#FFFFFF' });
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 1000 });
  const [draggingColorPicker, setDraggingColorPicker] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [merging, setMerging] = useState(false);
  const [toBeMerged, setToBeMerged] = useState([]);
  const [scale, setScale] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [cutting, setCutting] = useState(false);
  const [hoverCut, setHoverCut] = useState(false);
  const l = useRef();

  useEffect(() => {
    if (manualChange) {
      manualChange = false;
      return;
    }
    previousStates.push([...bmap]);
    stateIndex++;
  }, [bmap]);

  const BreakApart = (slices = 0, cut = false) => {
    let _bmap = [...bmap];
    let p = _bmap[hover];
    let newPs = [];
    if (slices) {
      let longestSide = 'w';
      // work out if hover square is taller than it is wide or vice versa
      let diffX = p.x + p.w - p.x;
      let diffY = p.y + p.h - p.y;
      if (diffY > diffX) {
        longestSide = 'h';
      }
      if (slices === 2) {
        if (cut) {
          let typeOfCut = hoverCut.cutType;
          if (typeOfCut === 'horizontal') {
            newPs = [
              { x: p.x, y: p.y, w: p.w, h: hoverCut.startY, c: p.c },
              { x: p.x, y: p.y + hoverCut.startY, w: p.w, h: p.h - hoverCut.startY, c: p.c },
            ];
          } else {
            newPs = [
              { x: p.x, y: p.y, w: hoverCut.startX, h: p.h, c: p.c },
              { x: p.x + hoverCut.startX, y: p.y, w: p.w - hoverCut.startX, h: p.h, c: p.c },
            ];
          }
        } else {
          if (longestSide === 'h') {
            newPs = [
              { x: p.x, y: p.y, w: p.w, h: Math.ceil(p.h / 2), c: p.c },
              { x: p.x, y: p.y + Math.ceil(p.h / 2), w: p.w, h: Math.ceil(p.h / 2), c: p.c },
            ];
          } else {
            newPs = [
              { x: p.x, y: p.y, w: Math.ceil(p.w / 2), h: p.h, c: p.c },
              { x: p.x + Math.ceil(p.w / 2), y: p.y, w: Math.ceil(p.w / 2), h: p.h, c: p.c },
            ];
          }
        }
      } else if (slices === 3) {
        if (longestSide === 'h') {
          newPs = [
            { x: p.x, y: p.y, w: p.w, h: Math.ceil(p.h / 3), c: p.c },
            { x: p.x, y: p.y + Math.ceil(p.h / 3), w: p.w, h: Math.ceil(p.h / 3), c: p.c },
            { x: p.x, y: p.y + Math.ceil(p.h / 3) * 2, w: p.w, h: Math.ceil(p.h / 3), c: p.c },
          ];
        } else {
          newPs = [
            { x: p.x, y: p.y, w: Math.ceil(p.w / 3), h: p.h, c: p.c },
            { x: p.x + Math.ceil(p.w / 3), y: p.y, w: Math.ceil(p.w / 3), h: p.h, c: p.c },
            { x: p.x + Math.ceil(p.w / 3) * 2, y: p.y, w: Math.ceil(p.w / 3), h: p.h, c: p.c },
          ];
        }
      }
    } else {
      newPs = [
        { x: p.x, y: p.y, w: Math.ceil(p.w / 2), h: Math.ceil(p.h / 2), c: p.c },
        { x: p.x + Math.ceil(p.w / 2), y: p.y, w: Math.ceil(p.w / 2), h: Math.ceil(p.h / 2), c: p.c },
        { x: p.x, y: p.y + Math.ceil(p.h / 2), w: Math.ceil(p.w / 2), h: Math.ceil(p.h / 2), c: p.c },
        {
          x: p.x + Math.ceil(p.w / 2),
          y: p.y + Math.ceil(p.h / 2),
          w: Math.ceil(p.w / 2),
          h: Math.ceil(p.h / 2),
          c: p.c,
        },
      ];
    }

    _bmap.splice(hover, 1, ...newPs);
    setBmap([..._bmap]);
    setHover(false);
  };

  const Undo = () => {
    stateIndex--;
    let _state = previousStates[stateIndex];
    manualChange = true;
    setBmap([..._state]);
  };

  const Redo = () => {
    stateIndex++;
    let _state = previousStates[stateIndex];
    manualChange = true;
    setBmap([..._state]);
  };

  const submitLoad = (e) => {
    e.preventDefault();
    let v = l.current.value;
    previousStates.push(JSON.parse(v));
    stateIndex = previousStates.length - 1;
    let _state = previousStates[stateIndex];
    manualChange = true;
    setBmap([..._state]);
    setLoadingFile(false);
  };

  const ZoomIn = () => {
    setScale(scale + scale / 10);
  };

  const ZoomOut = () => {
    setScale(scale - scale / 10);
  };

  const Merge = () => {
    let ml = 10000;
    let mr = -10000;
    let mt = 10000;
    let mb = -10000;
    toBeMerged.forEach((m) => {
      if (m.x < ml) ml = m.x;
      if (m.x + m.w > mr) mr = m.x + m.w;
      if (m.y < mt) mt = m.y;
      if (m.y + m.h > mb) mb = m.y + m.h;
    });
    // replace all the tbms with one square covering min to max of x and y
    let _bmap = [...bmap];
    // first remove all the ones to be merged
    let fs = { minX: ml, maxX: mr, minY: mt, maxY: mb };
    _bmap = _bmap.filter(({ x, y }) => !(x > fs.minX && x < fs.maxY && y > fs.minY && y < fs.maxY));
    // then add on a new square with the right stuff
    let n = { x: ml, y: mt, w: mr - ml, h: mb - mt, c: currentColor.hex };
    _bmap.push(n);
    setBmap([..._bmap]);
    setToBeMerged([]);
  };

  console.log(JSON.stringify(lowestDiffHolder));
  console.log(JSON.stringify(tries));

  return (
    <div className="App">
      <header className="App-header">
        <div
          tabIndex={0}
          onMouseUp={() => {
            if (hoverCut) {
              BreakApart(2, true);
              setHoverCut(false);
              setCutting(false);
            }
          }}
          onMouseMove={(e) => {
            if (panning) {
              setPan({ x: pan.x + e.movementX, y: pan.y + e.movementY });
            } else if (cutting) {
              let clientX = e.clientX;
              let clientY = e.clientY;
              let hov = bmap[hover];
              if (!hov) return;
              // find whether the mouse is near the highlighted square
              let diffX = clientX + (hov.x + hov.w / 2);
              let diffY = clientY + (hov.y + hov.h / 2);
              let diffH = Math.sqrt(diffX ^ (2 + diffY) ^ 2);
              if (diffH < 200) {
                // find out if the mouse is nearest the top,right,bottom or left edge of the hover
                let leftEdgeDist = Math.abs(clientX - hov.x);
                let rightEdgeDist = Math.abs(clientX - (hov.x + hov.w));
                let topEdgeDist = Math.abs(clientY - hov.y);
                let bottomEdgeDist = Math.abs(clientY - (hov.y + hov.h));
                // find the lowest distance out of all 4
                let lowestDiff;
                tries = {
                  leftEdgeDist,
                  rightEdgeDist,
                  topEdgeDist,
                  bottomEdgeDist,
                };
                lowestDiff = Object.values(tries).reduce((p, c) => (p ? (c < p ? c : p) : c));
                lowestDiffHolder = Object.keys(tries)[Object.values(tries).findIndex((x) => x === lowestDiff)];
                if (lowestDiffHolder === 'topEdgeDist' || lowestDiffHolder === 'bottomEdgeDist') {
                  // vertical cut if nearest the top or the bottom then cut
                  setHoverCut({
                    startX: clientX - hov.x,
                    startY: hov.y,
                    endX: clientX - hov.x,
                    endY: hov.y + hov.h,
                    cutType: 'vertical',
                  });
                } else {
                  // else cut horizontal
                  setHoverCut({
                    startX: hov.x,
                    startY: clientY - hov.y,
                    endX: hov.x + hov.w,
                    endY: clientY - hov.y,
                    cutType: 'horizontal',
                  });
                }
              } else {
                setHoverCut(false);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.code === 'KeyF') {
              BreakApart();
            } else if (e.code === 'KeyG') {
              setShowGrid(!showGrid);
            } else if (e.code === 'KeyZ') {
              Undo();
            } else if (e.code === 'KeyX') {
              Redo();
            } else if (e.code === 'KeyI') {
              setCurrentColor({ hex: bmap[hover].c });
            } else if (e.code === 'Digit0') {
              stateIndex = 0;
              let _state = previousStates[stateIndex];
              manualChange = true;
              setBmap([..._state]);
            } else if (e.code === 'KeyS') {
              document.write(JSON.stringify(bmap));
            } else if (e.code === 'KeyL') {
              setLoadingFile(true);
            } else if (e.code === 'KeyM') {
              setToBeMerged([]);
              setMerging(!merging);
            } else if (e.code === 'KeyK') {
              if (merging) {
                Merge();
                setMerging(false);
              }
            } else if (e.code === 'Equal') {
              ZoomIn();
            } else if (e.code === 'Minus') {
              ZoomOut();
            } else if (e.code === 'KeyP') {
              setPanning(!panning);
            } else if (e.code === 'KeyE') {
              setPan({ x: 0, y: 0 });
              setScale(1);
            } else if (e.code === 'KeyC') {
              if (cutting) {
                setCutting(false);
              } else {
                setCutting(true);
              }
            } else if (e.code === 'Digit2') {
              BreakApart(2);
            } else if (e.code === 'Digit3') {
              BreakApart(3);
            }
          }}
        >
          <Stage
            width={Math.floor(window.innerWidth)}
            height={Math.floor(window.innerHeight)}
            scaleX={scale}
            scaleY={scale}
            x={pan.x}
            y={pan.y}
          >
            <Layer>
              {bmap.map(({ x, y, w, h, c }, i) => (
                <Group
                  key={JSON.stringify({ x, y, w, h, c, i })}
                  onMouseEnter={() => {
                    setHover(i);
                  }}
                  onMouseLeave={() => {
                    setHover(false);
                    setHoverCut(false);
                  }}
                  onClick={() => {
                    if (merging) {
                      let tbm = [...toBeMerged];
                      tbm.push({ ...bmap[i], i });
                      setToBeMerged([...tbm]);
                    } else {
                      let _bmap = [...bmap];
                      _bmap[hover].c = currentColor.hex;
                      setBmap([..._bmap]);
                    }
                  }}
                >
                  <Rect x={x} y={y} fill={c} width={w} height={h} />
                  {i === hover ? <Rect x={x} y={y} stroke="yellow" width={w - 1} height={h - 1} /> : null}
                  {toBeMerged.find((x) => x.i === i) ? (
                    <Rect x={x + 1} y={y + 1} stroke="blue" width={w - 4} height={h - 4} />
                  ) : null}
                  {showGrid ? (
                    <Rect x={x - 1} y={y - 1} stroke="#797979" width={w + 1} height={h + 1} strokeWidth={1} />
                  ) : null}
                  {i === hover ? (
                    <Line
                      points={[hoverCut.startX + x, hoverCut.startY + y, hoverCut.endX + x, hoverCut.endY + y]}
                      stroke="red"
                      strokeWidth={2}
                    />
                  ) : null}
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: colorPickerX,
            width: window.innerWidth,
            height: window.innerHeight,
          }}
          // onMouseMove={(e) => {
          //   if (!draggingColorPicker) return;
          //   colorPickerPos.y = e.clientX;
          //   colorPickerPos.x = e.clientY;
          //   setColorPickerPos({ ...colorPickerPos });
          // }}
          // onMouseDown={(e) => {
          //   setDraggingColorPicker(true);
          // }}
          // onMouseUp={(e) => {
          //   setDraggingColorPicker(false);
          // }}
        >
          <div>
            <SketchPicker
              color={currentColor}
              onChangeComplete={(color) => {
                setCurrentColor(color);
              }}
            />
          </div>
        </div>
        {loadingFile ? (
          <div style={{ position: 'absolute', top: '0', left: '0' }}>
            <form onSubmit={submitLoad}>
              <textarea cols={200} rows={50} ref={l}></textarea>
              <button>Load</button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setLoadingFile(false);
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        ) : null}
      </header>
    </div>
  );
}

export default App;
