import React from "react";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { musicFile, type TrackId } from "../tracks";

/**
 * La musique seule, sans effet sonore. Préparée par
 * scripts/prepare-audio.mjs, niveau compris : dix mesures, respiration
 * filtrée en mesure 6, fondu jusqu'au silence sur la mesure 10 ; elle dure
 * exactement la vidéo.
 */
export const Soundtrack: React.FC<{ track: TrackId }> = ({ track }) => <Audio name="Musique" src={staticFile(musicFile(track))} />;
