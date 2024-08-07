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

export const MODS_LOADERS = ['Forge'] as const;
export type ModLoaders = typeof MODS_LOADERS[number];

export const RESOLUTIONS_COLORS: Record<Resolution, MantineColor> = {
	[Resolution.x32]: 'cyan',
	[Resolution.x64]: 'yellow',
};

