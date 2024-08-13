import { createReadStream } from 'fs';

import { Resolution, Status } from '@prisma/client';
import JSZip from 'jszip';

import { FILE_DIR, FILE_PATH, PUBLIC_PATH } from '~/lib/constants';
import { db } from '~/lib/db';
import { getPackFormatVersion, getVanillaTextureSrc, sortBySemver } from '~/lib/utils';
import { getModVersionProgression } from '~/server/data/mods-version';

interface Params {
	params: {
		modVerId: string;
		res: Resolution;
	};
};

export async function GET(req: Request, { params: { modVerId, res } }: Params) {
	const modVersion = await db.modVersion.findUnique({
		where: {
			id: modVerId,
		},
		include: {
			resources: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!modVersion) {
		return new Response('Not found', { status: 404 });
	}

	const downloads = modVersion.downloads[res] ?? 0;
	await db.modVersion.update({
		where: { id: modVerId },
		data: {
			downloads: {
				...modVersion.downloads,
				[res]: downloads + 1,
			},
		},
	});

	const resources = modVersion?.resources || [];
	const linkedTextures = await db.linkedTexture.findMany({
		where: {
			resourceId: { in: resources.map((r) => r.id) },
		},
		include: {
			texture: {
				include: {
					contributions: {
						orderBy: {
							updatedAt: 'desc',
						},
						where: {
							status: Status.ACCEPTED,
							resolution: res,
						},
						take: 1,
						select: {
							id: true,
							filepath: true,
							mcmeta: true,
						},
					},
				},
			},
		},
	});

	const zip = new JSZip();

	for (const linkedTexture of linkedTextures) {
		if (linkedTexture.texture.contributions.length === 0 && linkedTexture.texture.vanillaTextureId === null) continue;

		const contribution = linkedTexture.texture.contributions[0]!;
		if (contribution) {
			zip.file<'stream'>(
				`${linkedTexture.assetPath}`,
				createReadStream(`${FILE_PATH}/${contribution.filepath.replace('/files', '/').replace(FILE_DIR, '')}`)
			);

			if (contribution.mcmeta) {
				zip.file<'text'>(
					`${linkedTexture.assetPath}.mcmeta`,
					JSON.stringify(contribution.mcmeta, null, 2)
				);
			}
			else if (linkedTexture.texture.mcmeta) {
				zip.file<'text'>(
					`${linkedTexture.assetPath}.mcmeta`,
					JSON.stringify(linkedTexture.texture.mcmeta, null, 2)
				);
			}
		}

		const vanillaTextureId = linkedTexture.texture.vanillaTextureId;
		if (vanillaTextureId) {
			const vanillaTexture = (await fetch(getVanillaTextureSrc(vanillaTextureId, res))).arrayBuffer();
			zip.file<'arraybuffer'>(`${linkedTexture.assetPath}`, vanillaTexture);

			if (linkedTexture.texture.mcmeta) {
				zip.file<'text'>(
					`${linkedTexture.assetPath}.mcmeta`,
					JSON.stringify(linkedTexture.texture.mcmeta, null, 2)
				);
			}
		}
	}

	const progression = await getModVersionProgression(modVerId);
	const packMcmeta = {
		pack: {
			pack_format: getPackFormatVersion(modVersion.mcVersion.sort(sortBySemver).reverse()[0] ?? ''),
			description: `Faithful Mods ${res} - ${!progression
				? 'No info on % of completion'
				: `${progression.textures.done[res]}/${progression.textures.todo} textures done (${((progression.textures.done[res] * 100) / progression.textures.todo).toFixed(2)} %)`}`,
		},
	};

	zip.file<'stream'>('pack.png', createReadStream(`${PUBLIC_PATH}/pack.png`));
	zip.file<'text'>('pack.mcmeta', JSON.stringify(packMcmeta, null, 2));

	const zipFile = await zip.generateAsync({ type: 'nodebuffer' });
	return new Response(zipFile, {
		status: 200,
		headers: {
			'Content-Type': 'application/zip',
		},
	});
}
