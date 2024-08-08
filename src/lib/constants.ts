import { join } from 'path';

import { Resolution } from '@prisma/client';

import type { MantineColor } from '@mantine/core';

export const MAX_NAME_LENGTH = 32;
export const MIN_NAME_LENGTH = 3;

export const NOTIFICATIONS_DURATION_MS = 3000;

export const ITEMS_PER_PAGE = ['32', '64', '128', '256'] as const;

export const BREAKPOINT_MOBILE_SMALL = 320;
export const BREAKPOINT_MOBILE_MEDIUM = 375;
export const BREAKPOINT_MOBILE_LARGE = 425;

export const BREAKPOINT_TABLET = 768;

export const BREAKPOINT_DESKTOP_MEDIUM = 1024;
export const BREAKPOINT_DESKTOP_LARGE = 1440 + 100;
export const BREAKPOINT_DESKTOP_HUGE = 2560;

export const MINIMUM_CARD_WIDTH = `calc(${BREAKPOINT_MOBILE_SMALL}px - (2 * var(--mantine-spacing-sm)))`;

export const MODS_LOADERS = ['Fabric', 'Forge'] as const;
export type ModLoaders = typeof MODS_LOADERS[number];

export const RESOLUTIONS_COLORS: Record<Resolution, MantineColor> = {
	[Resolution.x32]: 'cyan',
	[Resolution.x64]: 'yellow',
};

export const FILE_DIR = process.env.NODE_ENV === 'production'
	? 'https://data.faithfulmods.net'
	: '/files';

export const FILE_PATH = process.env.NODE_ENV === 'production'
	? '/var/www/html/data.faithfulmods.net'
	: join(process.cwd(), './public/files');

/**
 * @see https://minecraft.wiki/w/Pack_format
 */
export const PACK_FORMAT_VERSIONS = {
	1: { min: '1.6.1', max: '1.8.9' },
	2: { min: '1.9.0', max: '1.10.2' },
	3: { min: '1.11.0', max: '1.12.2' },
	4: { min: '1.13.0', max: '1.14.4' },
	5: { min: '1.15.0', max: '1.16.1' },
	6: { min: '1.16.2', max: '1.16.5' },
	7: { min: '1.17.0', max: '1.17.1' },
	8: { min: '1.18.0', max: '1.18.2' },
	9: { min: '1.19.0', max: '1.19.2' },
	12: { min: '1.19.3', max: '1.19.3' },
	13: { min: '1.19.4', max: '1.19.4' },
	15: { min: '1.20.0', max: '1.20.1' },
	18: { min: '1.20.2', max: '1.20.2' },
	22: { min: '1.20.3', max: '1.20.4' },
	32: { min: '1.20.5', max: '1.20.6' },
	34: { min: '1.21.0', max: '2.0.0' },
} as const;
