import { useRef } from "react";

export const HeroPreview = () => {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const handleMouseEnter = () => {
    if (videoRef1.current) {
      videoRef1.current
        .play()
        .catch((err) => console.log("Video 1 blocked:", err));
    }
    if (videoRef2.current) {
      videoRef2.current
        .play()
        .catch((err) => console.log("Video 2 blocked:", err));
    }
  };

  const handleMouseLeave = () => {
    if (videoRef1.current) {
      videoRef1.current.pause();
    }
    if (videoRef2.current) {
      videoRef2.current.pause();
    }
  };
  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-muted-foreground/10 rounded border-dashed border-foreground/20 border p-3"
    >
      <div className="w-full h-full relative">
        <div className="w-full overflow-hidden flex items-center h-16 lg:h-36">
          <video ref={videoRef1} src="/banner_preview.mp4" muted loop />
        </div>
        <div className="size-18 lg:size-28 bg-yellow-50 overflow-hidden rounded-full absolute border-2 lg:border-4 border-neutral-800 top-8 lg:top-1/3 right-2 *:lg:right-4">
          <video ref={videoRef2} src="/pfp_preview.mp4" muted loop />
        </div>
        <div className="w-full mt-4 ml-1 font-heading">
          <p className="font-bold">vansh</p>
          <p className="text-foreground/50 text-sm">@madebyvansh</p>
        </div>
      </div>
    </div>
  );
};
