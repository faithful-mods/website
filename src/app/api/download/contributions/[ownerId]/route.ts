
import { createReadStream } from 'fs';

import { UserRole } from '@prisma/client';
import JSZip from 'jszip';

import { canAccess } from '~/lib/auth';
import { FILE_PATH } from '~/lib/constants';
import { db } from '~/lib/db';

interface Params {
	params: {
		ownerId: string;
	};
}

export async function GET(req: Request, { params: { ownerId } }: Params) {
	await canAccess(UserRole.ADMIN, ownerId);

	const contributions = await db.contribution.findMany({
		where: { ownerId },
		select: { file: true, filename: true, status: true, hash: true },
	});

	const zip = new JSZip();

	for (const contribution of contributions) {
		zip.file<'stream'>(
			`${contribution.status}/${contribution.hash}_${contribution.filename}`,
			createReadStream(`${FILE_PATH}/${contribution.file.replace('/files', '/')}`)
		);
	}

	const zipFile = await zip.generateAsync({ type: 'nodebuffer' });

	return new Response(zipFile, {
		status: 200,
		headers: {
			'Content-Type': 'application/zip',
		},
	});

}
