import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Moveable from "react-moveable";

const dummyPhotos = Array(4).fill(null); // 4 kotak dummy tanpa gambar

export default function AdjustFrame() {
  const navigate = useNavigate();

  const [photoPositions, setPhotoPositions] = useState(
    dummyPhotos.map(() => ({
      x: 50,
      y: 50,
      width: 150,
      height: 150,
      rotate: 0,
      color: "#cccccc", // warna default
    }))
  );

  const [selected, setSelected] = useState<number | null>(null);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameUrl = "/public/frame/frame-1.png";
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  const handleSave = () => {
    localStorage.setItem("photoLayout", JSON.stringify(photoPositions));
    localStorage.setItem("frameBackground", frameUrl);
    localStorage.setItem("frameOrientation", orientation);
    alert("Layout berhasil disimpan!");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Sesuaikan Foto di Frame</h1>

      <div
        className="relative flex items-center justify-center"
        style={{ width: 800, height: 800 }}
      >
        <div
          style={{
            width: 600,
            height: 800,
            transform: orientation === "landscape" ? "rotate(-90deg)" : "none",
            transformOrigin: "center",
            backgroundImage: `url(${frameUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "2px solid #ccc",
            borderRadius: "8px",
            position: "relative",
          }}
        >
          {photoPositions.map((photo, index) => (
            <div
              key={index}
              ref={(el) => void (photoRefs.current[index] = el)}
              style={{
                position: "absolute",
                top: photo.y,
                left: photo.x,
                width: photo.width,
                height: photo.height,
                transform: `rotate(${photo.rotate}deg)`,
                border:
                  selected === index
                    ? "2px solid blue"
                    : "2px solid transparent",
                overflow: "hidden",
                borderRadius: "8px",
                cursor: "move",
                backgroundColor: photo.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#333",
              }}
              onClick={() => setSelected(index)}
            >
              {index + 1}
            </div>
          ))}

          {selected !== null && (
            <Moveable
              target={selected != null ? photoRefs.current[selected] : null}
              draggable
              resizable
              rotatable
              onDrag={(e) => {
                if (selected == null) return;
                const newPositions = [...photoPositions];
                newPositions[selected] = {
                  ...newPositions[selected],
                  x: e.left,
                  y: e.top,
                };
                setPhotoPositions(newPositions);
              }}
              onResize={(e) => {
                if (selected == null) return;
                setPhotoPositions((prev) => {
                  const newPositions = [...prev];
                  newPositions[selected] = {
                    ...newPositions[selected],
                    width: e.width,
                    height: e.height,
                    x: e.drag.left,
                    y: e.drag.top,
                  };
                  return newPositions;
                });
              }}
              onRotate={(e) => {
                if (selected == null) return;
                const newPositions = [...photoPositions];
                newPositions[selected] = {
                  ...newPositions[selected],
                  rotate: e.beforeRotate,
                };
                setPhotoPositions(newPositions);
              }}
              throttleResize={0}
              throttleRotate={0}
              keepRatio={false}
              bounds={{
                left: 0,
                top: 0,
                right: 600,
                bottom: 800,
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Button onClick={() => navigate("/")}>Kembali</Button>
        <Button onClick={handleSave}>Simpan Layout</Button>
        <Button onClick={toggleOrientation}>
          Ubah Orientasi:{" "}
          {orientation === "portrait" ? "Portrait" : "Landscape"}
        </Button>
      </div>
      <div className="mt-6 w-full max-w-xl bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">
          Info Posisi Setiap Photo:
        </h2>
        <ul className="space-y-1 text-sm">
          {photoPositions.map((photo, i) => (
            <li key={i}>
              <strong>Photo {i + 1}:</strong> X: {Math.round(photo.x)}, Y:{" "}
              {Math.round(photo.y)}, W: {Math.round(photo.width)}, H:{" "}
              {Math.round(photo.height)}, R: {Math.round(photo.rotate)}°
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
