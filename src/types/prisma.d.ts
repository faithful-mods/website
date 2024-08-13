import type { TextureMCMETA, Downloads, FPStoredContributions } from '.';

declare global {
	namespace PrismaJson {
		type TextureMCMETAType = TextureMCMETA;
		type ContributionMCMETAType = TextureMCMETA;
		type ModVersionDownloadsType = Downloads;
		type FaithfulCachedContributionsType = FPStoredContributions;
	}
}
