import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Don't pad silent renders with an empty audio track — on the landing-page
// clips that dead track was ~70% of the file size. Renders that actually have
// audio (the voiceover cut) still get their track.
Config.setEnforceAudioTrack(false);

// Use the system Chrome instead of Remotion's downloaded Chrome Headless Shell
// (the download is blocked in this environment). Override via env if needed.
Config.setBrowserExecutable(
  process.env.REMOTION_CHROME ??
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
);
