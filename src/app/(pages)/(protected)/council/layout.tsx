'use client';

import { Card, Tabs } from '@mantine/core';
import { UserRole } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';

import { RoleGate } from '~/components/auth/role-gate';
import { gradient } from '~/lib/utils';

interface ProtectedLayoutProps {
  children: React.ReactNode;
};

const CouncilPage = ({ children }: ProtectedLayoutProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const tab = pathname.split('/').pop() || 'modpacks';

	return (
		<RoleGate allowedRoles={[UserRole.COUNCIL]}>
			<Tabs
				defaultValue="1"
				variant="pills"
				color={gradient.to}
				value={tab}
				onChange={(value) => router.push(`${pathname.replace(tab, '')}${value}`)}
			>
				<Card
					shadow="sm"
					padding="md"
					radius="md"
					mb="sm"
					withBorder
				>
					<Tabs.List>
						<Tabs.Tab value="contributions">Contributions</Tabs.Tab>
						<Tabs.Tab value="modpacks">Modpacks</Tabs.Tab>
						<Tabs.Tab value="mods">Mods</Tabs.Tab>
						<Tabs.Tab value="textures">Textures</Tabs.Tab>
					</Tabs.List>
				</Card>
			</Tabs>

			{children}
		</RoleGate>
	);
};

export default CouncilPage;
