'use server';

import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

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
