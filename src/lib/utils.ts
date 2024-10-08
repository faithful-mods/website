
import { showNotification } from '@mantine/notifications';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { NOTIFICATIONS_DURATION_MS, PACK_FORMAT_VERSIONS } from './constants';

import type { MantineColor } from '@mantine/core';
import type { Resolution } from '@prisma/client';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
	if (str.length === 0) return str;

	const words = str.split(' ');
	return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase()).join(' ');
}

export function notify(title: string, message: React.ReactNode, color: MantineColor) {
	showNotification({
		title,
		message,
		autoClose: NOTIFICATIONS_DURATION_MS,
		withBorder: true,
		color,
	});
}

export function sortByName<T extends { name: string, id?: string | number }>(a: T, b: T) {
	// If same name, sort by id to keep consistent order between reloads (since id is unique)
	return a.name.localeCompare(b.name) || `${a.id}`.localeCompare(`${b.id}` ?? '') || 0;
}

export function searchFilter<T extends { id: string | number; name: string, aliases?: string[] }>(search: string) {
	return (item: T) => {
		const searchLower = search.toLowerCase();
		const name = item.name.toLowerCase();
		const id = `${item.id}`.toLowerCase();
		const aliases = item.aliases?.map((alias) => alias.toLowerCase()) ?? [];

		return id === searchLower || name.includes(searchLower) || aliases.some((alias) => alias.includes(searchLower));
	};
}

export function bufferToFile(
	buffer: Buffer,
	filename: string,
	mimeType: string
): File {
	const blob = new Blob([buffer], { type: mimeType });
	return new File([blob], filename);
}

export function extractSemver(version: string) {
	const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

	const match = version.match(regex);
	if (!match) return null;

	return match[0];
}

/**
 * Sort Semver Version, lowest version first
 * @author [TheRolfFR](https://github.com/TheRolfFR)
 */
export function sortBySemver(a: string, b: string) {
	const aSplit = a.split('.').map((s) => parseInt(s));
	const bSplit = b.split('.').map((s) => parseInt(s));

	if (aSplit.includes(NaN) || bSplit.includes(NaN)) {
		return String(a).localeCompare(String(b)); // compare as strings
	}

	const upper = Math.min(aSplit.length, bSplit.length);

	let i = 0;
	let result = 0;
	while (i < upper && result == 0) {
		result = aSplit[i] == bSplit[i] ? 0 : aSplit[i]! < bSplit[i]! ? -1 : 1; // each number
		++i;
	}

	if (result != 0) return result;

	result = aSplit.length == bSplit.length ? 0 : aSplit.length < bSplit.length ? -1 : 1; // longer length wins

	return result;
}

/**
 * Get the pack format version for a given minecraft version
 *
 * @param minecraftVersion the minecraft version to get the pack format version for (e.g. '1.17.1')
 * @returns the pack format version or null if not found
 */
export function getPackFormatVersion(minecraftVersion: string): number | null {
	const compareVersions = (a: string, b: string) => {
		const [majorA, minorA, patchA] = a.split('.').map((s) => parseInt(s, 10)) as [number, number, number?];
		const [majorB, minorB, patchB] = b.split('.').map((s) => parseInt(s, 10)) as [number, number, number?];

		if (majorA !== majorB) return majorA - majorB;
		if (minorA !== minorB) return minorA - minorB;
		return (patchA ?? 0) - (patchB ?? 0);
	};

	for (const [packFormat, { min, max }] of Object.entries(PACK_FORMAT_VERSIONS)) {
		if (compareVersions(min, minecraftVersion) <= 0 && compareVersions(max, minecraftVersion) >= 0) {
			return parseInt(packFormat);
		}
	}

	return null;
}

export function getVanillaResolution(resolution: Resolution) {
	return `faithful_${resolution.replace('x', '') as `${number}`}x` as const;
}

export function getVanillaTextureSrc(vanillaId: string, resolution: Resolution) {
	return `https://api.faithfulpack.net/v2/textures/${vanillaId}/url/${getVanillaResolution(resolution)}/latest`;
}
