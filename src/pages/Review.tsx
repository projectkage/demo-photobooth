import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function Review() {
  const location = useLocation();
  const { photos } = location.state as { photos: string[] };
  const [mergedImage, setMergedImage] = useState<string | null>(null);

  const frameUrl =
    "https://pastphoto.s3.ap-southeast-1.amazonaws.com/frames%2F59d86322-4059-4bce-a0c3-e50ee620f4bd.png";

  const mergePhotosWithFrame = async () => {
    const frame = new Image();
    frame.crossOrigin = "anonymous";
    frame.src = frameUrl;

    await new Promise((resolve) => {
      frame.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = frame.width;
    canvas.height = frame.height;

    const gridRows = 2;
    const gridCols = 2;
    const cellWidth = canvas.width / gridCols;
    const cellHeight = canvas.height / gridRows;

    for (let i = 0; i < photos.length; i++) {
      const img = new Image();
      img.src = photos[i];
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const row = Math.floor(i / gridCols);
      const col = i % gridCols;

      // Resize keeping aspect ratio
      const aspectRatio = img.width / img.height;
      let drawWidth = cellWidth;
      let drawHeight = cellHeight;

      if (aspectRatio > 1) {
        drawHeight = cellHeight;
        drawWidth = aspectRatio * drawHeight;
      } else {
        drawWidth = cellWidth;
        drawHeight = drawWidth / aspectRatio;
      }

      const x = col * cellWidth + (cellWidth - drawWidth) / 2;
      const y = row * cellHeight + (cellHeight - drawHeight) / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }

    // Setelah semua foto ditaruh, baru frame di atas
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

    const finalImage = canvas.toDataURL("image/png");
    setMergedImage(finalImage);
  };

  const downloadImage = () => {
    if (!mergedImage) return;
    const a = document.createElement("a");
    a.href = mergedImage;
    a.download = "merged-framed-photo.png";
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-300 p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl flex flex-col items-center">
        <h1 className="text-xl font-bold mb-4">Review Photos</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {photos.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Photo ${idx + 1}`}
              className="rounded-md shadow-md w-40 h-40 object-cover"
            />
          ))}
        </div>

        {!mergedImage ? (
          <Button onClick={mergePhotosWithFrame}>Merge All with Frame</Button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src={mergedImage}
              alt="Framed"
              className="rounded-md shadow-md max-w-full"
            />
            <Button onClick={downloadImage}>Download Merged Photo</Button>
          </div>
        )}
      </div>
    </div>
  );
}
