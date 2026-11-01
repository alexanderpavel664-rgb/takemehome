import { Composition, Folder } from "remotion";
import { Adoptions, calculateMetadata } from "./Adoptions";

// Soul Damage, 114 BPM : onze mesures et un temps, 711 images (calculateMetadata, tracks.ts).
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Video">
        <Composition
          id="Adoptions"
          component={Adoptions}
          calculateMetadata={calculateMetadata}
          durationInFrames={711}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ track: "soul-damage", mockup: false, safeZones: false }}
        />
      </Folder>
      <Folder name="Maquette">
        <Composition
          id="Maquette"
          component={Adoptions}
          calculateMetadata={calculateMetadata}
          durationInFrames={711}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ track: "soul-damage", mockup: true, safeZones: false }}
        />
      </Folder>
    </>
  );
};
