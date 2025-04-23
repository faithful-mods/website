import type { Downloads, FPStoredContributions } from '.';
import type { Pack, Resolution } from '@prisma/client';
import type { TextureMCMeta } from 'react-minecraft';

declare global {
	namespace PrismaJson {
		type TextureMCMETAType = TextureMCMeta;
		type ContributionMCMETAType = TextureMCMeta;
		type ModVersionDownloadsType = Downloads;
		type FaithfulCachedContributionsType = FPStoredContributions;

		type ContributionDeactivationSettingsType = {
			all: boolean;
			packs: {
				[key: Pack]: Resolution[];
			}
		}
	}
}
