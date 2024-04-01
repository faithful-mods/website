'use server';

import { randomUUID, createHash } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import { ModVersion } from '@prisma/client';
import unzipper from 'unzipper';

import type { MCModInfoData } from '~/types';

import { linkTextureToResource, createResource, getResource } from '../data/resource';
import { createTexture, findTexture } from '../data/texture';

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

/**
 * Extract blocks and items models, textures to the /public dir
 * 
 * TODO add support for models
 * 
 * @param jar The jar file to extract the resources from
 * @param modVersion The mod version to extract the resources from and to be linked to the extracted resources
 */
export async function extractDefaultResourcePack(jar: File, modVersion: ModVersion): Promise<void> {
	const bytes = await jar.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const archive = await unzipper.Open.buffer(buffer);

	// Get textures assets
	const texturesAssets = archive.files.filter(
		(file) =>
			file.path.startsWith('assets') &&
			file.path.includes('textures') &&
			!file.path.endsWith('/')
	)

	// TODO: Get models assets

	const fileDir = join(process.cwd(), 'public', 'files', 'textures', 'default');
	if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });

	// Check if the extracted file already exists in the public dir
	for (const textureAsset of texturesAssets) {
		const asset = textureAsset.path.split('/')[1];
		const uuid = randomUUID();
		const buffer = await textureAsset.buffer();
		const hash = calculateHash(buffer);

		let texture = await findTexture({ hash });
		if (!texture) {
			const filename = `${uuid}_${textureAsset.path.split('/').pop()}`;
			const filepath = join(fileDir, filename);

			writeFileSync(filepath, buffer);

			texture = await createTexture({
				filepath: join('files', 'textures', 'default', filename),
				hash,
				name: filename,
			});
		}

		let resource = await getResource({ asset, modVersion });
		if (!resource) resource = await createResource({ asset, modVersion });

		await linkTextureToResource({ resource, texture, assetPath: textureAsset.path });
	}
}

function calculateHash(buffer: Buffer) {
	const hash = createHash('sha256');
	hash.update(buffer);
	return hash.digest('hex');
}