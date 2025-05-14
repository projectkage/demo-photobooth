import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-slate-200">
      <h1 className="text-3xl font-bold">Selamat Datang!</h1>
      <div className="flex gap-6">
        <Button size="lg" onClick={() => navigate("/camera")}>
          Mulai Photo Session
        </Button>
        <Button size="lg" onClick={() => navigate("/adjust")}>
          Sesuaikan Photo & Frame
        </Button>
      </div>
    </div>
  );
}
