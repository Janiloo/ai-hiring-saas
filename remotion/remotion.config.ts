import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Use the system Chrome instead of Remotion's downloaded Chrome Headless Shell
// (the download is blocked in this environment). Override via env if needed.
Config.setBrowserExecutable(
  process.env.REMOTION_CHROME ??
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
);
