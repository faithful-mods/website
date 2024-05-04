'use server';
import 'server-only';

import { randomUUID, createHash } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import { ModVersion } from '@prisma/client';
import unzipper from 'unzipper';

import { db } from '~/lib/db';
import { bufferToFile, extractSemver } from '~/lib/utils';
import type { MCModInfo, MCModInfoData } from '~/types';

import { createMod } from '../data/mods';
import { createModVersion } from '../data/mods-version';
import { linkTextureToResource, createResource, getResource } from '../data/resource';
import { createTexture, findTexture } from '../data/texture';

const FILE_DIR = process.env.NODE_ENV === 'production'
	? 'https://data.faithfulmods.net'
	: '/files';

const FILE_PATH = process.env.NODE_ENV === 'production'
	? '/var/www/html/data.faithfulmods.net'
	: join(process.cwd(), './public/files');

/**
 * Uploads a file to the server
 * @param file File to upload
 * @param path The path to upload the file to, defaults to the root
 * @returns The "public" path to the uploaded file
 */
export async function upload(file: File, path: `${string}/` = '/'): Promise<string> {
	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const uuid = randomUUID();
	const fileDirPub = join(FILE_DIR, path);
	const fileDirPrv = join(FILE_PATH, path);
	const filePath   = join(fileDirPrv, `${uuid}_${file.name}`);

	if (!existsSync(fileDirPrv)) mkdirSync(fileDirPrv, { recursive: true });
	writeFileSync(filePath, buffer);

	return encodeURI(join(fileDirPub, `${uuid}_${file.name}`).replace('https:/', 'https://'));
}

export async function remove(publicPath: `${typeof FILE_DIR}/${string}`): Promise<void> {
	const filePath = join(FILE_PATH, decodeURI(publicPath).replace(FILE_DIR, ''));
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
export async function fetchMCModInfoFromJAR(jar: File): Promise<MCModInfo[]> {
	const bytes = await jar.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const mcmodInfo: MCModInfoData = await unzipper.Open.buffer(buffer)
		.then((archive) => {
			const entry = archive.files.find((file) => file.path === 'mcmod.info');
			if (entry) {
				return entry.buffer();
			} else {
				const textures = archive.files.filter((file) => file.path.endsWith('.png'));
				if (textures.length === 0) return Buffer.from('[]', 'utf-8');

				const modid = jar.name.split('.').shift();
				const name = jar.name.split('.').slice(0, -1).join('.');

				// We can't determine if the mc version is written first or last in the jar name
				// Or if the mc version is even in the jar name
				const res = jar.name
					.split(' ')
					.map(extractSemver)
					.filter((r) => r !== null)[0]
					?.replace('.jar', '');

				const version = res;
				const mcversion = res;

				const json = JSON.stringify([{ modid, name, version, mcversion }]);
				return Buffer.from(json, 'utf-8');
			}
		})
		.then((buffer) => buffer.toString('utf-8'))
		.then((jsonString) => {
			try {
				return JSON.parse(jsonString.replaceAll('\n', '')) satisfies MCModInfoData;
			} catch (err) {
				console.log(jsonString);
				console.error(err);
				return [];
			}
		});

	return sanitizeMCModInfo(mcmodInfo);
}

/**
 * Sanitize the mcmod.info data
 * @param mcmodInfo The mcmod.info data to sanitize
 * @returns The sanitized mcmod.info data
 */
function sanitizeMCModInfo(mcmodInfo: MCModInfoData): MCModInfo[] {
	return (Array.isArray(mcmodInfo) ? mcmodInfo : mcmodInfo.modList).map((modInfo) => {
		if (modInfo.mcversion === 'extension "minecraft" property "mcVersion"') modInfo.mcversion = 'unknown';

		if (modInfo.url && modInfo.url.startsWith('http://')) modInfo.url = modInfo.url.replace('http://', 'https://');
		if (modInfo.url && modInfo.url.startsWith('!https://')) modInfo.url = undefined;

		if (!modInfo.mcversion) modInfo.mcversion = 'unknown';
		if (!modInfo.version) modInfo.name = 'unknown';

		return modInfo;
	});
}

/**
 * Extract mod(s) versions from given JAR file
 * - If mod(s) does not exist, create it
 * - If mod(s) version(s) does not exist, create it and extract the default resource pack
 *
 * @param jar the jar file to extract the mod versions from
 * @returns The extracted mod versions
 */
export async function extractModVersionsFromJAR(jar: File): Promise<ModVersion[]> {
	const res: ModVersion[] = [];
	const modInfos = await fetchMCModInfoFromJAR(jar);

	// Check if all mods exists, if not create them
	for (const modInfo of modInfos) {
		let mod = await db.mod.findFirst({ where: { forgeId: modInfo.modid } });
		if (!mod) {
			mod = await createMod({
				name: modInfo.name,
				forgeId: modInfo.modid,
				description: modInfo.description,
				authors: modInfo.authorList,
				url: modInfo.url,
			});
		}

		let modVersion = await db.modVersion.findFirst({ where: { modId: mod.id, version: modInfo.version } });
		if (!modVersion) {
			modVersion = await createModVersion({
				mod,
				version: modInfo.version,
				mcVersion: modInfo.mcversion,
			});
			await extractDefaultResourcePack(jar, modVersion);
		}

		res.push(modVersion);
	}

	return res;
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
			file.type === 'File' &&
			file.path.startsWith('assets') &&
			file.path.includes('textures') &&
			file.path.endsWith('.png') // TODO: Add support for mcmeta files
	);

	// TODO: Get models assets

	const fileDirPrv = join(FILE_PATH, 'textures', 'default');
	if (!existsSync(fileDirPrv)) mkdirSync(fileDirPrv, { recursive: true });

	// Check if the extracted file already exists in the public dir
	for (const textureAsset of texturesAssets) {
		const textureName = textureAsset.path.split('/').pop()!.split('.')[0];
		const asset = textureAsset.path.split('/')[1];

		const buffer = await textureAsset.buffer();
		const hash = calculateHash(buffer);

		let texture = await findTexture({ hash });

		if (!texture) {
			const filepath = await upload(bufferToFile(buffer, `${textureName}.png`, 'image/png'), 'textures/default/');
			texture = await createTexture({
				filepath,
				hash,
				name: textureName,
			});
		}
		else {
			if (texture.name !== textureName && !texture.aliases.includes(textureName)) {
				await db.texture.update({
					where: { id: texture.id },
					data: { aliases: { set: [...texture.aliases, textureName] } },
				});
			}
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
