import { ConsoleLog, TwaGenerator, TwaManifest } from "@bubblewrap/core";

const manifestUrl = new URL("https://nodex-three.vercel.app/manifest.webmanifest");
const webManifest = await (await fetch(manifestUrl)).json();

const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, webManifest);
twaManifest.packageId = "io.github.jcasadomolina.nodex";
twaManifest.launcherName = "Nodex";
twaManifest.enableNotifications = true;
twaManifest.signingKey = { path: "nodex.keystore", alias: "nodex" };

await new TwaGenerator().createTwaProject(new URL("twa", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), twaManifest, new ConsoleLog("android"));
await twaManifest.saveToFile(new URL("twa/twa-manifest.json", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
