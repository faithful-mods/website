'use client';

import { Card, Tabs } from '@mantine/core';
import { UserRole } from '@prisma/client';

import { RoleGate } from '~/components/auth/role-gate';
import { CouncilContributionsPanel } from '~/components/council/contributions/contributions-panel';
import { gradient } from '~/lib/utils';

const CouncilPage = () => {
	return (
		<RoleGate allowedRoles={[UserRole.COUNCIL]}>
			<Tabs defaultValue="1" variant="pills" color={gradient.to}>
				<Card
					shadow="sm" 
					padding="md" 
					radius="md"
					mb="sm"
					withBorder
				>
					<Tabs.List>
						<Tabs.Tab value="1">Contributions</Tabs.Tab>
					</Tabs.List>
				</Card>

				<Tabs.Panel value="1"><CouncilContributionsPanel /></Tabs.Panel>
			</Tabs>
		</RoleGate>
	);
};

export default CouncilPage;	
