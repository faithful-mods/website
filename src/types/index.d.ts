import type {
	Contribution,
	Mod,
	Modpack,
	ModpackVersion,
	ModVersion,
	Poll,
	Report,
	Resolution,
	Resource,
	User,
} from '@prisma/client';
import type { ModLoaders } from '~/lib/constants';

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

/**
 * Remove readonly from all properties
 */
export type Writable<T> = {
	-readonly [P in keyof T]: T[P];
};

export interface SocketModUpload {
	mods: {
		total: number;
		done: number;
	};
	modInfos: {
		total: number;
		done: number;
	};
	textures: {
		total: number;
		done: number;
	};
}

export type ModpackVersionWithMods = ModpackVersion & { mods: ModVersion[] };
export type ModVersionExtended = ModVersion & { modpacks: Modpack[], textures: number, linked: number };

export type PublicUser = {
	id: string;
	name: string | null;
	image: string | null;
};

export type FullPoll = Poll & {
	downvotes: PublicUser[];
	upvotes: PublicUser[];
}

export type ContributionWithCoAuthors = Contribution & { coAuthors: PublicUser[], owner: PublicUser };
export type ContributionWithCoAuthorsAndPoll = ContributionWithCoAuthors & { poll: Poll };
export type ContributionWithCoAuthorsAndFullPoll = ContributionWithCoAuthors & { poll: FullPoll };

export type ContributionActivationStatus = {
	/** null means any resolution */
	resolution: Resolution | null;
	status: boolean;
}

export type Progression = {
	linkedTextures: number;
	textures: {
		done: {
			[key in Resolution]: number;
		}
		todo: number;
	};
}

export interface AnimationMCMETA {
	frametime?: number;
	interpolate?: boolean;
	frames?: (number | { index: number; time: number })[];
	height?: number;
	width?: number;
}

export interface PropertiesMCMETA {
	blur?: boolean;
	clamp?: boolean;
	mipmaps?: number[];
}

export interface GuiMCMETA {
	scaling?: {
		type?: 'stretch' | 'tile' | 'nine_slice';
		width?: number;
		height?: number;
		border?: number | {
			left?: number;
			top?: number;
			right?: number;
			bottom?: number;
		}
	}
}

export interface VillagerMCMETA {
	hat?: 'full' | 'partial';
}

export interface TextureMCMETA {
	animation?: AnimationMCMETA;
	texture?: PropertiesMCMETA;
	gui?: GuiMCMETA;
	villager?: VillagerMCMETA;
}

// TODO: Add more properties
export interface PackMCMETA {}

export type ReportWithReporter = Report & { reporter: PublicUser };
export type UserWithReports = Prettify<User & { reports: Report[] }>;

export interface PollResults {
	upvotes: number;
	downvotes: number;
}

export type ResourceWithProgression = Prettify<Resource & Progression>;
export type ModVersionWithProgression = Prettify<ModVersion & Progression & {
	mod: Mod;
	resources: ResourceWithProgression[];
}>;

export interface ModData {
	name: string;
	description?: string;
	authors: string[];
	modId: string;
	mcVersion: string[];
	version: string;
	loaders: ModLoaders[];
	url?: string;
	picture?: Buffer;
}

export type MCModInfoData = MCModInfo[] | {
	modListVersion: number;
	modList: MCModInfo[];
}

export interface ModFabricJsonContact {
	email?: string;
	irc?: string;
	homepage?: string;
	issues?: string;
	sources?: string;
	[key: string]: string | undefined;
}

export type ModFabricJsonPerson = string | {
	name: string;
	contact?: ModFabricJsonContact;
}

/**
 * @see https://fabricmc.net/wiki/documentation:fabric_mod_json
 */
export interface ModFabricJson {
	// mandatory fields
	schemaVersion: 1;
	id: string;
	version: string;

	// optional fields
	// > mod loading
	provides?: string[];
	environment?: 'client' | 'server' | '*';
	entrypoints?: {
		main?: string[];
		client?: string[];
		server?: string[];
		[key: string]: string[] | undefined;
	};
	jars?: {
		file: string;
	};
	languageAdapters?: {
		[key: string]: string;
	};
	mixins?: (string | { config: string, environment: 'client' | 'server' | '*' })[];
	// > dependency resolution
	depends?: { [key: string]: string | string[]; };
	recommends?: { [key: string]: string | string[]; };
	suggests?: { [key: string]: string | string[]; };
	breaks?: { [key: string]: string | string[]; };
	conflicts?: { [key: string]: string | string[]; };
	// > metadata
	name?: string;
	description?: string;
	contact?: ModFabricJsonContact;
	authors?: ModFabricJsonPerson[];
	contributors?: ModFabricJsonPerson[];
	license?: string | string[];
	icon?: string | { [key: string]: string };

	// custom fields
	[key: string]: unknown;
}

/**
 * @see https://forge.gemwire.uk/wiki/Mods.toml
 */
export interface ModsToml {
	modLoader: string;
	loaderVersion: string;
	license: string;
	showAsResourcePack?: boolean;
	properties?: object;
	logoFile?: string;
	issueTrackerURL?: string;
	mods: Array<{
		modId: string;
		namespace?: string;
		version?: string;
		displayName?: string;
		description?: string;
		logoFile?: string;
		logoBlur?: boolean;
		updateJSONURL?: string;
		modproperties?: object;
		credits?: string;
		authors?: string;
		displayURL?: string;
		displayTest?: string;
	}>
	dependencies: {
		[modId: string]: {
			modId: string;
			mandatory: boolean;
			versionRange: string;
			ordering: 'BEFORE' | 'AFTER' | 'NONE';
			side: 'CLIENT' | 'SERVER' | 'BOTH';
		}
	}
}

/**
 * Forge Mod Metadata
 */
export interface MCModInfo {
	/**
	 * The mod id this description is linked to.
	 */
	modid: string;
	/**
	 * The user-friendly name of this mod.
	 */
	name: string;
	/**
	 * A description of this mod in 1-2 paragraphs.
	 */
	description?: string;
	/**
	 * The version of the mod.
	 */
	version: string;
	/**
	 * The Minecraft version.
	 */
	mcversion: string;
	/**
	 * A link to the mod’s homepage.
	 */
	url?: string;
	/**
	 * Defined but unused. Superseded by updateJSON.
	 */
	updateUrl?: string;
	/**
	 * The URL to a version JSON.
	 */
	updateJSON?: string;
	/**
	 * A list of authors to this mod.
	 */
	authorList?: string[];
	/**
	 * A string that contains any acknowledgements you want to mention.
	 */
	credits?: string;
	/**
	 * The path to the mod’s logo. It is resolved on top of the classpath, so you should put it in a location where the name will not conflict, maybe under your own assets folder.
	 */
	logoFile?: string;
	/**
	 * A list of images to be shown on the info page. Currently unimplemented.
	 */
	screenshots?: string[];
	/**
	 * The mod id of a parent mod, if applicable. Using this allows modules of another mod to be listed under it in the info page, like BuildCraft.
	 */
	parent?: string;
	/**
	 * If true and Mod.useMetadata, the below 3 lists of dependencies will be used. If not, they do nothing.
	 */
	useDependencyInformation?: boolean;
	/**
	 * A list of mod ids. If one is missing, the game will crash. This does not affect the ordering of mod loading! To specify ordering as well as requirement, have a coupled entry in dependencies.
	 */
	requiredMods?: string[];
	/**
	 * A list of mod ids. All of the listed mods will load before this one. If one is not present, nothing happens.
	 */
	dependencies?: string[];
	/**
	 * A list of mod ids. All of the listed mods will load after this one. If one is not present, nothing happens.
	 */
	dependants?: string[];
}
