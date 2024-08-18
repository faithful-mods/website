import { join } from 'path';

import { Resolution, Status } from '@prisma/client';

import type { MantineColor, MantineGradient } from '@mantine/core';
import type { Progression } from '~/types';

export const MAX_NAME_LENGTH = 32;
export const MIN_NAME_LENGTH = 3;

export const NOTIFICATIONS_DURATION_MS = 3000;

export const ITEMS_PER_PAGE = ['6', '12', '18', '24', '48', '96'] as const;
export const ITEMS_PER_PAGE_DEFAULT = '24';

export const ITEMS_PER_ROW = ['1', '4', '8', '12', '18'] as const;
export const ITEMS_PER_ROW_DEFAULT = '12';

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

export const PUBLIC_PATH = process.env.NODE_ENV === 'production'
	? '/var/www/html/faithfulmods.net/public'
	: join(process.cwd(), './public');

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

export const EMPTY_PROGRESSION_RES = Object
	.keys(Resolution)
	.reduce((acc, res) => ({ ...acc, [res]: 0 }), {}) as Progression['textures']['done'];

export const EMPTY_PROGRESSION: Progression = {
	linkedTextures: 0,
	textures: { done: EMPTY_PROGRESSION_RES, todo: 0 },
} as const;

export const GRADIENT: MantineGradient = {
	from: 'cyan',
	to: 'blue',
	deg: 69,
};

export const GRADIENT_DANGER: MantineGradient = {
	from: 'red',
	to: 'pink',
	deg: 69,
};

export const GRADIENT_WARNING: MantineGradient = {
	from: 'orange',
	to: 'red',
	deg: 69,
};

export const COLORS: Record<Status, MantineColor> = {
	[Status.DRAFT]: 'gray',
	[Status.PENDING]: GRADIENT_WARNING.from,
	[Status.ACCEPTED]: GRADIENT.from,
	[Status.REJECTED]: GRADIENT_DANGER.from,
	[Status.ARCHIVED]: 'gainsboro',
};

export const GITHUB_ORG_NAME = 'faithful-mods';
export const GITHUB_DEFAULT_REPO_NAME = process.env.NODE_ENV === 'production' ? 'resources-default' : 'resources-default-dev';

export type RawUrl =
 | `https://raw.githubusercontent.com/${string}/${string}/${string}`
 | `https://raw.githubusercontent.com/${string}/${string}/${string}/${string}`

export type FileGitParams = {
	orgOrUser: string;
	repository: string;
	branchOrCommit?: string;
	path?: string;
}

export const gitRawUrl = ({ orgOrUser, repository, branchOrCommit, path }: FileGitParams): RawUrl => {
	if (branchOrCommit) return `https://raw.githubusercontent.com/${orgOrUser}/${repository}/${branchOrCommit}/${path}`;
	return `https://raw.githubusercontent.com/${orgOrUser}/${repository}/main/${path}`;
};

export type CommitUrl = `https://github.com/${string}/${string}/commit/${string}`;

export type GitCommitUrlParams = {
	orgOrUser: string;
	repository: string;
	commitSha: string;
}

export const gitCommitUrl = ({ orgOrUser, repository, commitSha }: GitCommitUrlParams): CommitUrl => {
	return `https://github.com/${orgOrUser}/${repository}/commit/${commitSha}`;
};

export type BlobUrl = `https://github.com/${string}/${string}/blob/${string}/${string}`;

export const gitBlobUrl = ({ orgOrUser, repository, branchOrCommit, path }: FileGitParams): BlobUrl => {
	return `https://github.com/${orgOrUser}/${repository}/blob/${branchOrCommit}/${path}`;
};
