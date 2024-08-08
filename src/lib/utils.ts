
import { showNotification } from '@mantine/notifications';
import { Resolution } from '@prisma/client';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { NOTIFICATIONS_DURATION_MS } from './constants';

import type { MantineColor, MantineGradient } from '@mantine/core';
import type { ClassValue } from 'clsx';
import type { Progression } from '~/types';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const gradient: MantineGradient = {
	from: 'cyan',
	to: 'blue',
	deg: 69,
};

export const gradientDanger: MantineGradient = {
	from: 'red',
	to: 'pink',
	deg: 69,
};

export const gradientWarning: MantineGradient = {
	from: 'orange',
	to: 'red',
	deg: 69,
};

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

export function sortByName<T extends { name: string, id?: string }>(a: T, b: T) {
	// If same name, sort by id to keep consistent order between reloads (since id is unique)
	return a.name.localeCompare(b.name) || a.id?.localeCompare(b?.id ?? '') || 0;
}

export function searchFilter<T extends { name: string, aliases?: string[] }>(search: string) {
	return (item: T) => {
		const searchLower = search.toLowerCase();
		const name = item.name.toLowerCase();
		const aliases = item.aliases?.map((alias) => alias.toLowerCase()) ?? [];

		return name.includes(searchLower) || aliases.some((alias) => alias.includes(searchLower));
	};
}

export const EMPTY_PROGRESSION_RES = Object.keys(Resolution).reduce((acc, res) => ({ ...acc, [res]: 0 }), {}) as Progression['textures']['done'];
export const EMPTY_PROGRESSION: Progression = {
	linkedTextures: 0,
	textures: { done: EMPTY_PROGRESSION_RES, todo: 0 },
} as const;

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
