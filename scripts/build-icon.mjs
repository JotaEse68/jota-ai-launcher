import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svg = await readFile(new URL("../build/icon.svg", import.meta.url));
const outputPath = fileURLToPath(new URL("../build/icon.png", import.meta.url));
await sharp(svg).resize(512, 512).png().toFile(outputPath);
console.log("Icono de Jota AI Launcher generado.");
