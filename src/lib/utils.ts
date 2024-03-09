import { MantineColor, MantineGradient } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { NOTIFICATIONS_DURATION_MS } from './constants'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const gradient: MantineGradient = {
	from: 'cyan',
	to: 'blue',
	deg: 69,
}; 

export function capitalize(str: string) {
	if (str.length === 0) return str

	const words = str.split(' ')
	return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLocaleLowerCase()).join(' ')
}

export function notify(title: string, message: React.ReactNode, color: MantineColor) {
	notifications.show({
		title,
		message,
		autoClose: NOTIFICATIONS_DURATION_MS,
		withBorder: true,
		color,
	});
}

/**
 * @deprecated FILES SHOULD NOT BE CONVERTED TO BASE64
 */
export const toBase64 = async (file: File): Promise<`data:${string}/${string};base64,${string}`> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as any);
		reader.onerror = reject;
	});