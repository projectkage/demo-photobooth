import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const currentChunksRef = useRef<Blob[]>([]);

  const navigate = useNavigate();

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(0);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string>("");
  const [capturedVideo, setCapturedVideo] = useState<string>("");
  const [loadingVideo, setLoadingVideo] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  // Tambahan state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const initializeCamera = async (deviceId?: string) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });

        if (videoRef.current) videoRef.current.srcObject = stream;

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) currentChunksRef.current.push(event.data);
        };
        recorder.onstop = () => handleRecordingStop();
        setMediaRecorder(recorder);
      } catch (error) {
        console.error("Gagal akses kamera:", error);
      }
    };

    initializeCamera(selectedDeviceId);
    return () => stopCamera();
  }, [selectedDeviceId]);

  useEffect(() => {
    if (countdown > 0) {
      if (countdown === 3) startRecording();
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && sessionActive) {
      capturePhoto();
      setLoadingVideo(true);
      stopRecording();
    }
  }, [countdown, sessionActive]);

  useEffect(() => {
    if (capturedVideo && !loadingVideo) {
      playbackVideoRef.current
        ?.play()
        .catch((error) => console.error("Gagal autoplay video:", error));

      setTimeout(() => {
        if (currentSession + 1 >= 4) {
          stopCamera();
          navigate("/result", {
            state: {
              photos: [...photos, capturedPhoto],
              videos: [...videos, capturedVideo],
            },
          });
        } else {
          setPhotos((prev) => [...prev, capturedPhoto]);
          setVideos((prev) => [...prev, capturedVideo]);
          setCapturedPhoto("");
          setCapturedVideo("");
          setCurrentSession((prev) => prev + 1);
          setTimeout(handleStartSession, 500); // jeda antar sesi
        }
      }, 1000); // preview sebentar 1 detik
    }
  }, [capturedVideo, loadingVideo]);

  const startRecording = () =>
    mediaRecorder?.state === "inactive" && mediaRecorder.start();
  const stopRecording = () =>
    mediaRecorder?.state === "recording" && mediaRecorder.stop();

  const handleRecordingStop = () => {
    const blob = new Blob(currentChunksRef.current, { type: "video/webm" });
    const videoURL = URL.createObjectURL(blob);
    setCapturedVideo(videoURL);
    setLoadingVideo(false);
    currentChunksRef.current = [];
  };

  const stopCamera = () => {
    const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
    tracks?.forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    context.scale(-1, 1);
    context.drawImage(
      videoRef.current,
      -canvas.width,
      0,
      canvas.width,
      canvas.height
    );
    context.setTransform(1, 0, 0, 1, 0, 0);

    setCapturedPhoto(canvas.toDataURL("image/png"));
  };

  const handleStartSession = () => {
    setSessionActive(true);
    setCountdown(3);
  };

  useEffect(() => {
    const getCameras = async () => {
      try {
        // 1. Minta izin akses kamera (wajib untuk mendapatkan label)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 2. Setelah izin diberikan, panggil enumerateDevices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(videoInputs);
        console.log("Kamera yang tersedia:", videoInputs);

        // 3. Siapkan MediaRecorder
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) currentChunksRef.current.push(event.data);
        };
        recorder.onstop = () => handleRecordingStop();
        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Gagal akses kamera atau enumerasi:", err);
      }
    };

    getCameras();
    return () => stopCamera();
  }, []);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(e.target.value);
  };

  console.log(videoDevices);

  return (
    <div className="min-h-screen p-6 bg-slate-300 flex justify-center items-center">
      <div className="bg-white py-4 px-10 rounded-md flex flex-col gap-4 items-center">
        <div className="text-lg font-medium">
          Sesi {currentSession + 1} dari 4
        </div>

        {videoDevices.length > 1 && (
          <div className="mb-4">
            <label htmlFor="cameraSelect" className="block mb-1 font-medium">
              Pilih Kamera:
            </label>
            <select
              id="cameraSelect"
              onChange={handleDeviceChange}
              value={selectedDeviceId}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Kamera ${device.deviceId}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {!sessionActive && !capturedPhoto && (
          <Button onClick={handleStartSession}>Mulai Sesi Pertama</Button>
        )}

        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="rounded-lg shadow-md w-full max-w-xl transform scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold text-white bg-black bg-opacity-50">
              {countdown}
            </div>
          )}
        </div>

        {capturedPhoto && (
          <div className="flex flex-col gap-4 items-center">
            <img
              src={capturedPhoto}
              alt="Captured"
              className="rounded shadow-md w-80"
            />
            {loadingVideo ? (
              <div className="text-center text-lg font-semibold text-gray-700">
                Memproses video...
              </div>
            ) : (
              capturedVideo && (
                <video
                  ref={playbackVideoRef}
                  src={capturedVideo}
                  controls
                  className="w-80 rounded shadow-md"
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
