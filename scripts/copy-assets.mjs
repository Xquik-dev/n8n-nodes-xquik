import { copyFile, mkdir } from 'node:fs/promises';

const assets = [
	['package.json', 'dist/package.json'],
	['icons/xquik-dark.svg', 'dist/icons/xquik-dark.svg'],
	['icons/xquik-light.svg', 'dist/icons/xquik-light.svg'],
	['icons/xquik.svg', 'dist/icons/xquik.svg'],
	['nodes/Xquik/Xquik.node.json', 'dist/nodes/Xquik/Xquik.node.json'],
	['nodes/Xquik/xquik-dark.svg', 'dist/nodes/Xquik/xquik-dark.svg'],
	['nodes/Xquik/xquik-light.svg', 'dist/nodes/Xquik/xquik-light.svg'],
	['nodes/Xquik/xquik.svg', 'dist/nodes/Xquik/xquik.svg'],
];

await mkdir(new URL('../dist/icons', import.meta.url), { recursive: true });
await mkdir(new URL('../dist/nodes/Xquik', import.meta.url), { recursive: true });

await Promise.all(
	assets.map(([source, destination]) =>
		copyFile(new URL(`../${source}`, import.meta.url), new URL(`../${destination}`, import.meta.url)),
	),
);
