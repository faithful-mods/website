import type { ModpackVersion } from '@prisma/client';

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type UpdateObject<T extends { id: string }> = Prettify<
	Partial<T> & Required<Pick<T, 'id'>>
>;

export type CreateObject<T extends { id: string }, K extends keyof T = 'id'> = 
	Prettify<Omit<T, 'id' | 'createdAt' | 'updatedAt' | K>>;

export type ModpackVersionWithMods = ModpackVersion & { mods: ModVersion[] };

export type MCModInfoData = MCModInfo[] | {
	modListVersion: number;
	modList: MCModInfo[];
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
	version?: string;
	/**
	 * The Minecraft version.
	 */
	mcversion?: string;
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
