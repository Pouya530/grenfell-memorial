import { AboutMemorial } from "@/components/AboutMemorial";

export default function HomePage() {
  return (
    <>
      <iframe
        src="/scene.html"
        title="Grenfell Tower — educational 3D reconstruction"
        className="scene-frame"
      />
      <AboutMemorial />
    </>
  );
}
