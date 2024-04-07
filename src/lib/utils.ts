import { MantineColor, MantineGradient } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { Resolution } from '@prisma/client';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Progression } from '~/types';

import { NOTIFICATIONS_DURATION_MS } from './constants';

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

export function sortByName<T extends { name: string }>(a: T, b: T) {
	return a.name.localeCompare(b.name) || 0;
}

export const EMPTY_PROGRESSION_RES = Object.keys(Resolution).reduce((acc, res) => ({ ...acc, [res]: 0 }), {}) as Progression['textures']['done'];
export const EMPTY_PROGRESSION: Progression = {
	linkedTextures: 0,
	textures: { done: EMPTY_PROGRESSION_RES, todo: 0 },
} as const;
