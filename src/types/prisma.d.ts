import type { TextureMCMETA, Downloads } from '.';

declare global {
	namespace PrismaJson {
		type TextureMCMETAType = TextureMCMETA;
		type ContributionMCMETAType = TextureMCMETA;

		type ModVersionDownloadsType = Downloads;
	}
}
