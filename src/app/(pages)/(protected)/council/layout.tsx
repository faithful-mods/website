'use client';

import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/base/role-gate';
import { TabsLayout } from '~/components/base/tabs-layout';

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

export default function CouncilLayout({ children }: ProtectedLayoutProps) {
	const tabs = [
		{ value: 'submissions', label: 'Submissions' },
		{ value: 'modpacks', label: 'Modpacks' },
		{ value: 'mods', label: 'Mods' },
		{ value: 'textures', label: 'Textures' },
	];

	return (
		<RoleGate allowedRoles={[UserRole.COUNCIL]}>
			<TabsLayout
				tabs={tabs}
				defaultValue="contributions"
			>
				{children}
			</TabsLayout>
		</RoleGate>
	);
};
