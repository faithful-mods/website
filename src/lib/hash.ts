import { createHash } from 'crypto';

export function calculateHash(buffer: Buffer) {
	const hash = createHash('sha256');
	hash.update(buffer);
	return hash.digest('hex');
}
