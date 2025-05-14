import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import gifshot from "gifshot";
import { useNavigate } from "react-router-dom";

// Types
interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  src: string;
}

// Utilities
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(new Image());
  });

const loadVideo = (src: string): Promise<HTMLVideoElement> =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.onloadeddata = () => resolve(video);
  });

export default function Result() {
  const location = useLocation();
  const [photoPositions, setPhotoPositions] = useState<PhotoPosition[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [frameBackground, setFrameBackground] = useState<string>("");
  const [frameRecording, setFrameRecording] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const navigate = useNavigate();

  const DEFAULT_CANVAS_WIDTH = 600;
  const DEFAULT_CANVAS_HEIGHT = 800;

  useEffect(() => {
    setPhotoPositions(JSON.parse(localStorage.getItem("photoLayout") || "[]"));
    setFrameBackground(localStorage.getItem("frameBackground") || "");
    setOrientation(
      (localStorage.getItem("frameOrientation") as "portrait" | "landscape") ||
        "portrait"
    );

    if (location.state) {
      location.state.photos && setPhotos(location.state.photos);
      location.state.videos && setVideos(location.state.videos);
    }
  }, [location.state]);

  const generateFinalImage = async (): Promise<string | null> => {
    const images = await Promise.all(photos.map(loadImage));
    const frame = frameBackground ? await loadImage(frameBackground) : null;

    let width = DEFAULT_CANVAS_WIDTH;
    let height = DEFAULT_CANVAS_HEIGHT;

    const baseRatio = DEFAULT_CANVAS_WIDTH / DEFAULT_CANVAS_HEIGHT;
    height = 1080;
    width = Math.round(1080 * baseRatio);

    const isLandscape = orientation === "landscape";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Ukuran canvas berdasarkan orientasi
    canvas.width = isLandscape ? height : width;
    canvas.height = isLandscape ? width : height;

    // Rotasi canvas jika landscape
    if (isLandscape) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-canvas.height / 2, -canvas.width / 2);
    }

    const scaleX = width / DEFAULT_CANVAS_WIDTH;
    const scaleY = height / DEFAULT_CANVAS_HEIGHT;

    // Gambar foto di posisi masing-masing dengan rotasi yang benar
    photoPositions.forEach((pos, i) => {
      const img = images[i];
      if (!img) return;

      ctx.save();
      ctx.translate(
        (pos.x + pos.width / 2) * scaleX,
        (pos.y + pos.height / 2) * scaleY
      );
      // Rotasi gambar berdasarkan orientasi
      ctx.rotate((pos.rotate * Math.PI) / 180);
      ctx.drawImage(
        img,
        (-pos.width / 2) * scaleX,
        (-pos.height / 2) * scaleY,
        pos.width * scaleX,
        pos.height * scaleY
      );
      ctx.restore();
    });

    // Gambar frame di atasnya
    if (frame) {
      ctx.drawImage(frame, 0, 0, width, height);
    }

    return canvas.toDataURL("image/jpeg");
  };

  const handleDownloadImage = async () => {
    const url = await generateFinalImage();
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = "result-image.jpg";
    link.click();
  };

  const handleDownloadVideoWithFrame = async () => {
    if (!videos.length) return alert("Tidak ada video tersedia");

    setFrameRecording(true);

    const videoElements = await Promise.all(videos.map(loadVideo));
    const baseRatio = DEFAULT_CANVAS_WIDTH / DEFAULT_CANVAS_HEIGHT;

    // Tentukan dimensi dasar
    let width = 1080;
    let height = Math.round(1080 / baseRatio);

    const isLandscape = orientation === "landscape";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ukuran canvas setelah rotasi
    canvas.width = isLandscape ? height : width;
    canvas.height = isLandscape ? width : height;

    // Setup transformasi awal jika landscape
    if (isLandscape) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.translate(-canvas.height / 2, -canvas.width / 2);
    }

    const scaleX = width / DEFAULT_CANVAS_WIDTH;
    const scaleY = height / DEFAULT_CANVAS_HEIGHT;

    const frameImage = await loadImage(frameBackground);

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "result-video.webm";
      a.click();
      URL.revokeObjectURL(url);
      setFrameRecording(false);
    };

    recorder.start();
    videoElements.forEach((v) => v.play());

    const startTime = performance.now();
    const duration = 5000;

    const drawFrame = (time: number) => {
      if (time - startTime > duration) {
        recorder.stop();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Gambar video di posisi masing-masing dengan rotasi yang benar
      photoPositions.forEach((pos, i) => {
        const video = videoElements[i];
        if (!video) return;

        ctx.save();
        ctx.translate(
          (pos.x + pos.width / 2) * scaleX,
          (pos.y + pos.height / 2) * scaleY
        );
        ctx.rotate((pos.rotate * Math.PI) / 180); // Rotasi video
        ctx.drawImage(
          video,
          (-pos.width / 2) * scaleX,
          (-pos.height / 2) * scaleY,
          pos.width * scaleX,
          pos.height * scaleY
        );
        ctx.restore();
      });

      if (frameImage) {
        ctx.drawImage(frameImage, 0, 0, width, height);
      }

      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);
  };

  const handleSilentPrint = async () => {
    if (!window.electronAPI)
      return console.error("Electron API tidak tersedia.");
    const imageUrl = await generateFinalImage();
    await window.electronAPI.silentPrint(imageUrl);
  };

  const handleDownloadRawPhotos = () => {
    photos.forEach((src, i) => {
      const link = document.createElement("a");
      link.href = src;
      link.download = `photo-${i + 1}.jpg`;
      link.click();
    });
  };

  const handleGenerateGif = async () => {
    try {
      const gifBase64 = await new Promise<string>((resolve, reject) => {
        gifshot.createGIF(
          {
            images: photos,
            interval: 1,
            gifWidth: 512,
            gifHeight: 512,
          },
          (obj: any) => (obj.error ? reject(obj.errorMsg) : resolve(obj.image))
        );
      });

      const blob = await fetch(gifBase64).then((res) => res.blob());
      const url = URL.createObjectURL(blob);
      setGifUrl(url);

      const link = document.createElement("a");
      link.href = url;
      link.download = "generated.gif";
      link.click();
    } catch (err) {
      console.error("Error generating GIF:", err);
    }
  };

  const renderPreview = (type: "photo" | "video") => (
    <div
      className="relative"
      style={{
        width: DEFAULT_CANVAS_WIDTH,
        height: DEFAULT_CANVAS_HEIGHT,
        backgroundImage: `url(${frameBackground})`,
        transform: orientation === "landscape" ? "rotate(-90deg)" : "none",
        transformOrigin: "center",
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "2px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {photoPositions.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${pos.width}px`,
            height: `${pos.height}px`,
            transform: `rotate(${pos.rotate}deg)`,
            overflow: "hidden",
            borderRadius: "8px",
            zIndex: 1,
          }}
        >
          {type === "photo" ? (
            <img
              src={photos[i] ?? ""}
              alt={`Photo ${i}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={videos[i] ?? ""}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
      {frameBackground && (
        <img
          src={frameBackground}
          alt="Frame"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 10 }}
        />
      )}
    </div>
  );

  console.log(orientation);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">Result Page</h1>

      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold">Frame + Photo Preview</h2>
        {renderPreview("photo")}
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        <h2 className="text-xl font-semibold">Frame + Video Preview</h2>
        {renderPreview("video")}
      </div>

      <div className="flex gap-4 mt-8 flex-wrap">
        <Button
          onClick={handleDownloadImage}
          className="bg-blue-500 text-white"
        >
          Download Final Image
        </Button>
        <Button
          onClick={handleDownloadVideoWithFrame}
          className="bg-green-500 text-white"
          disabled={frameRecording}
        >
          {frameRecording ? "Processing Video..." : "Download Final Video"}
        </Button>
        <Button onClick={handleSilentPrint}>Test Print</Button>
        <Button
          onClick={handleDownloadRawPhotos}
          className="bg-green-500 text-white"
        >
          Download Photo Mentah
        </Button>
        <Button
          onClick={handleGenerateGif}
          className="bg-purple-600 text-white"
        >
          Buat & Download GIF
        </Button>
        <Button onClick={() => navigate("/camera")}>
          Ulangi Pengambilan Foto
        </Button>
      </div>
    </div>
  );
}
