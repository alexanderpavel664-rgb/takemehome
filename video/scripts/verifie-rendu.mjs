/**
 * Vérifie un rendu final : 1080 × 1920, 30 i/s, H.264, au moins 10 Mb/s
 * pour l'image, mixage autour de −14 LUFS, crête vraie sous −1 dBTP.
 *
 *   node scripts/verifie-rendu.mjs out/takemehome-adoptii.mp4 [...]
 *
 * Sort en erreur si une exigence n'est pas tenue.
 */
import { execFileSync, spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

let ok = true;
for (const file of process.argv.slice(2)) {
  const probe = JSON.parse(
    execFileSync("npx", ["remotion", "ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", file], { encoding: "utf8" }),
  );
  const v = probe.streams.find((s) => s.codec_type === "video");
  const a = probe.streams.find((s) => s.codec_type === "audio");
  const duration = Number(probe.format.duration);
  const audioBits = a ? Number(a.bit_rate ?? 0) : 0;
  const videoMbps = (Number(probe.format.bit_rate) - audioBits) / 1e6;
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const l = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf("{")));
  const checks = [
    ["1080 × 1920", v.width === 1080 && v.height === 1920],
    ["30 i/s", v.r_frame_rate === "30/1"],
    ["H.264", v.codec_name === "h264"],
    [`image ${videoMbps.toFixed(1)} Mb/s ≥ 10`, videoMbps >= 10],
    [`sonie ${Number(l.input_i).toFixed(1)} LUFS ≈ −14`, Math.abs(Number(l.input_i) + 14) <= 1],
    [`crête vraie ${Number(l.input_tp).toFixed(1)} dBTP < −1`, Number(l.input_tp) < -1],
  ];
  console.log(`${file} (${duration.toFixed(2)} s)`);
  for (const [label, pass] of checks) {
    console.log(`  ${pass ? "ok " : "NON"} ${label}`);
    ok &&= pass;
  }
}
if (!ok) process.exit(1);
