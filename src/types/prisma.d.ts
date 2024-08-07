import type { TextureMCMETA } from '.';

declare global {
	namespace PrismaJson {
		type TextureMCMETAType = TextureMCMETA;
		type ContributionMCMETAType = TextureMCMETA;
	}
}
