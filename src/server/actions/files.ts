'use server';
import 'server-only';

import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import TOML from '@ltd/j-toml';
import unzipper from 'unzipper';

import { FILE_DIR, FILE_PATH } from '~/lib/constants';
import { db } from '~/lib/db';
import { calculateHash } from '~/lib/hash';
import { socket } from '~/lib/serversocket';
import { bufferToFile, sortBySemver } from '~/lib/utils';

import { createMod, updateModPicture } from '../data/mods';
import { createModVersion } from '../data/mods-version';
import { linkTextureToResource, createResource, getResource } from '../data/resource';
import { createTexture, findTexture } from '../data/texture';

import type { ModVersion } from '@prisma/client';
import type { CentralDirectory } from 'unzipper';
import type { MCModInfoData, ModData, ModsToml, SocketModUpload } from '~/types';

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
	const filePath = join(fileDirPrv, `${uuid}_${file.name}`);

	if (!existsSync(fileDirPrv)) mkdirSync(fileDirPrv, { recursive: true });
	writeFileSync(filePath, buffer);

	return encodeURI(
		join(fileDirPub, `${uuid}_${file.name}`)
			.replaceAll('\\', '/') // Windows fix
			.replace('https:/', 'https://')
	);
}

export async function remove(publicPath: `${typeof FILE_DIR}/${string}`): Promise<void> {
	const filePath = join(FILE_PATH, decodeURI(publicPath).replace(FILE_DIR, ''));
	if (existsSync(filePath)) unlinkSync(filePath);
}

/**
 * Extracts mod(s) data from a jar file
 *
 * @param jar the jar file to extract the mod(s) data from
 * @returns The mod(s) data (name, description, etc.) extracted from the jar
 */
export async function fetchModDataFromJAR(jar: File): Promise<ModData[]> {
	const bytes = await jar.arrayBuffer();
	const buffer = Buffer.from(bytes);
	const archive = await unzipper.Open.buffer(buffer);

	// Forge mod -- mcmod.info
	const mcmodInfo = archive.files.find((file) => file.path === 'mcmod.info');
	if (mcmodInfo) {
		const buff = await mcmodInfo.buffer();
		const json = JSON.parse(buff.toString('utf-8').replaceAll('\n', '')) as MCModInfoData;
		return sanitizeMCModInfo(json, archive);
	}

	// Forge mod -- mods.toml
	const modsTom = archive.files.find((file) => file.path === 'META-INF/mods.toml');
	if (modsTom) {
		const buff = await modsTom.buffer();
		const toml = TOML.parse(buff.toString('utf-8'), '\n', false) as unknown as ModsToml;
		return sanitizeModsToml(toml, archive);
	}

	throw new Error('Unsupported mod loader for the given JAR, aborting');
}

/**
 * Add a @ to the author name if it does not already start with it
 */
function sanitizeAuthorName(name: string): string {
	if (name.startsWith('@')) return name;
	return `@${name}`;
}

/**
 * Convert the mods.toml data to a ModData array
 */
async function sanitizeModsToml(modsToml: ModsToml, archive: CentralDirectory): Promise<ModData[]> {
	if (modsToml.modLoader !== 'javafml') {
		throw new Error('Unsupported loader version: ' + modsToml.modLoader);
	}

	const manifest = archive.files.find((file) => file.path === 'META-INF/MANIFEST.MF');
	const output: ModData[] = [];

	for (const mod of modsToml.mods) {
		if (mod.version === '${file.jarVersion}' && manifest) {
			const buff = await manifest.buffer();
			const manifestContent = buff.toString('utf-8');
			const jarVersion = manifestContent.match(/Implementation-Version: (.*)/)?.[1];
			if (jarVersion) mod.version = jarVersion;
		}

		let logoBuffer: Buffer | undefined;
		if (mod.logoFile || modsToml.logoFile) {
			const logo = archive.files.find((file) => file.path === mod.logoFile || file.path === modsToml.logoFile);
			if (logo) logoBuffer = await logo.buffer();
		}

		output.push({
			name: mod.displayName ?? mod.namespace ?? mod.modId,
			description: mod.description,
			authors: mod.authors?.split(',').map(sanitizeAuthorName) ?? [],
			modId: mod.modId,
			mcVersion:
				modsToml.dependencies['minecraft']?.versionRange
					.slice(1, -1)
					.split(',')
					.sort(sortBySemver)
				?? [],
			version: mod.version ?? 'unknown',
			loaders: ['Forge'],
			url: mod.displayURL,
			picture: logoBuffer,
		} satisfies ModData);
	}

	return output;
}

/**
 * Convert the mcmod.info data to a ModData array
 *
 * @info MCModInfo might only be used for Forge mods prior to 1.13 ?
 *
 * @param mcmodInfo The mcmod.info data to sanitize
 * @returns The sanitized mcmod.info data
 */
async function sanitizeMCModInfo(mcModInfos: MCModInfoData, archive: CentralDirectory): Promise<ModData[]> {
	const modsInfosToParse = Array.isArray(mcModInfos) ? mcModInfos : mcModInfos.modList;
	const output: ModData[] = [];

	for (const modInfo of modsInfosToParse) {
		let logoBuffer: Buffer | undefined;
		if (modInfo.logoFile) {
			const logo = archive.files.find((file) => file.path === modInfo.logoFile);
			if (logo) logoBuffer = await logo.buffer();
		}

		output.push({
			name: modInfo.name ?? modInfo.modid,
			description: modInfo.description,
			authors: modInfo.authorList?.map(sanitizeAuthorName) ?? [],
			modId: modInfo.modid,
			mcVersion: modInfo.mcversion === 'extension \'minecraft\' property \'mcVersion\'' ? [] : [modInfo.mcversion],
			version: modInfo.version ?? 'unknown',
			loaders: ['Forge'],
			url: modInfo.url,
			picture: logoBuffer,
		});
	}

	return output;
}

/**
 * Extract mod(s) versions from given JAR file
 * - If mod(s) does not exist, create it
 * - If mod(s) version(s) does not exist, create it and extract the default resource pack
 *
 * @param jar the jar file to extract the mod versions from
 * @param socketId the socket id to send the progression to
 * @param status the socket status to update
 * @returns The extracted mod versions
 */
export async function extractModVersionsFromJAR(jar: File, socketId: string, status: SocketModUpload): Promise<[ModVersion[], SocketModUpload]> {
	const res: ModVersion[] = [];
	const modInfos = await fetchModDataFromJAR(jar);

	status.modInfos.total += modInfos.length;

	// Check if all mods exists, if not create them
	for (const modInfo of modInfos) {
		let mod = await db.mod.findFirst({ where: { forgeId: modInfo.modId } });
		if (!mod) {
			mod = await createMod({
				name: modInfo.name,
				forgeId: modInfo.modId,
				description: modInfo.description,
				authors: modInfo.authors,
				url: modInfo.url,
				loaders: modInfo.loaders,
			});
		}

		console.log(modInfo.picture, mod.image);
		if (modInfo.picture && !mod.image) {
			const formData = new FormData();
			formData.append('file', new Blob([modInfo.picture]), 'picture.png');
			await updateModPicture(mod.id, formData);
		}

		let modVersion = await db.modVersion.findFirst({ where: { modId: mod.id, version: modInfo.version } });
		if (!modVersion) {
			modVersion = await createModVersion({
				mod,
				version: modInfo.version,
				mcVersion: modInfo.mcVersion,
			});

			status = await extractDefaultResourcePack(jar, modVersion, socketId, status);
		}

		res.push(modVersion);
		status.modInfos.done += 1;
		socket?.emit(socketId, status);
	}

	return [res, status];
}

/**
 * Extract blocks and items models, textures to the /public dir
 *
 * TODO add support for models
 *
 * @param jar The jar file to extract the resources from
 * @param modVersion The mod version to extract the resources from and to be linked to the extracted resources
 * @param socketId The socket id to send the progression to
 * @param status The socket status to update
 */
export async function extractDefaultResourcePack(jar: File, modVersion: ModVersion, socketId: string, status: SocketModUpload): Promise<SocketModUpload> {
	const bytes = await jar.arrayBuffer();
	const buffer = Buffer.from(bytes);

	const archive = await unzipper.Open.buffer(buffer);

	// Get textures assets
	const assets = archive.files.filter(
		(file) =>
			file.type === 'File' &&
			file.path.startsWith('assets') &&
			file.path.includes('textures')
	);

	const textureAssets = assets.filter((file) => file.path.endsWith('.png'));
	const mcmetaAssets = assets.filter((file) => file.path.endsWith('.mcmeta'));

	status.textures.total += textureAssets.length;

	// TODO: Get models assets

	const fileDirPrv = join(FILE_PATH, 'textures', 'default');
	if (!existsSync(fileDirPrv)) mkdirSync(fileDirPrv, { recursive: true });

	// Check if the extracted file already exists in the public dir
	for (const textureAsset of textureAssets) {
		const textureName = textureAsset.path.split('/').pop()!.split('.')[0] ?? 'unknown';
		const asset = textureAsset.path.split('/')[1] ?? 'unknown';

		const buffer = await textureAsset.buffer();
		const hash = calculateHash(buffer);

		let texture = await findTexture({ hash });

		if (!texture) {
			const filepath = await upload(bufferToFile(buffer, `${textureName}.png`, 'image/png'), 'textures/default/');
			const mcmetaFile = mcmetaAssets.find((mcmeta) => `${textureAsset.path}.mcmeta` === mcmeta.path);

			let mcmeta = undefined;
			if (mcmetaFile) {
				mcmeta = await mcmetaFile.buffer().then((b) => {
					try {
						return JSON.parse(
							b
								.toString('utf-8')
								.replace(/(?<!")(\b\w+\b)(?=\s*:)/g, '"$1"') // Add missing quotes to keys
								.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '') // Remove trailing commas
						);
					} catch {
						console.error('Failed to parse MCMETA file:', mcmetaFile.path, ' content: ', b.toString('utf-8'));
						return b.toString('utf-8'); // Invalid JSON, keep as string for manual checking
					}
				});
			}

			texture = await createTexture({
				filepath,
				hash,
				name: textureName,
				mcmeta,
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
		status.textures.done += 1;
		socket?.emit(socketId, status);
	}

	return status;
}
