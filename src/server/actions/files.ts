'use server';

import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import { ModVersion } from '@prisma/client';
import unzipper from 'unzipper';

import type { MCModInfoData } from '~/types';

export async function upload(file: File, path: `${string}/` = '/'): Promise<string> {
	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const uuid = randomUUID();

	const publicPath = join('files', path);
	const fileDir    = join(process.cwd(), 'public', publicPath);
	const filePath   = join(fileDir, `${uuid}_${file.name}`);

	if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });
	writeFileSync(filePath, buffer);

	return encodeURI(join(publicPath, `${uuid}_${file.name}`));
}

export async function remove(publicPath: `files/${string}`): Promise<void> {
	const filePath = join(process.cwd(), 'public', decodeURI(publicPath));
	if (existsSync(filePath)) unlinkSync(filePath);
}

/**
 * Extracts mcmod.info from a jar file
 * 
 * TODO: find behavior for Fabric mods
 * 
 * @param jar the jar file to extract the mcmod.info from
 * @returns The mcmod.info data
 */
export async function fetchMCModInfoFromJar(jar: File): Promise<MCModInfoData> {
	const bytes = await jar.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const mcmodInfo = await unzipper.Open.buffer(buffer)
		.then((archive) => {
			const entry = archive.files.find((file) => file.path === 'mcmod.info');
			if (entry) {
				return entry.buffer();
			} else {
				throw new Error('mcmod.info not found in the jar file');
			}
		})
		.then((buffer) => buffer.toString('utf-8'))
		.then((jsonString) => JSON.parse(jsonString));

	return mcmodInfo;
}

// TODO: implement
export async function extractDefaultResourcePack(jar: File, modVersion: ModVersion): Promise<void> {}
