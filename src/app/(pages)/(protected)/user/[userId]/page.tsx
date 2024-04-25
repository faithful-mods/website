'use client';

import type { User } from '@prisma/client';


import { Badge, Button, Card, Group, Tabs } from '@mantine/core';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

import { UserReportsPanel } from '~/components/user/reports-panel';
import { UserSettingsPanel } from '~/components/user/settings-panel';
import { useCurrentUser } from '~/hooks/use-current-user';
import { useEffectOnce } from '~/hooks/use-effect-once';
import { gradient, gradientDanger, notify } from '~/lib/utils';
import { getReportsOfUser } from '~/server/data/reports';
import { getUserById } from '~/server/data/user';
import type { ReportWithReporter } from '~/types';

const UserPage = () => {
	const params = useParams();
	const loggedUser = useCurrentUser();
	const self = params.userId === 'me';

	const [displayedUser, setDisplayedUser] = useState<User>();
	const [reports, setReports] = useState<ReportWithReporter[]>([]);
	const router = useRouter();

	useEffectOnce(() => {
		// Avoid logged users to access their own page with their id
		if (params.userId === loggedUser?.id) router.push('/user/me');

		const userId = self ? loggedUser?.id! : params.userId as string;

		getUserById(userId)
			.then(setDisplayedUser)
			.catch((err: Error) => {
				notify('Error', err.message, 'red');
			});

		getReportsOfUser(userId)
			.then(setReports)
			.catch((err) => {
				console.error(err);
				notify('Error', 'Failed to fetch reports', 'red');
			});
	});

	return (displayedUser && (
		<Tabs defaultValue="1" variant="pills" color={gradient.to} >
			<Card
				withBorder
				shadow="sm"
				padding="md"
				radius="md"
				mb="sm"
			>
				<Group justify="space-between">
					<Tabs.List>
						<Tabs.Tab value="1">Settings</Tabs.Tab>
						<Tabs.Tab value="2" rightSection={reports.length > 0 ? <Badge color="orange">{reports.length}</Badge> : undefined}>
							Reports
						</Tabs.Tab>
					</Tabs.List>
					{self && (
						<Button
							variant="transparent"
							color={gradientDanger.from}
							onClick={() => signOut({ callbackUrl: '/' })}
						>
							Logout
						</Button>
					)}
				</Group>
			</Card>

			<Tabs.Panel value="1"><UserSettingsPanel user={displayedUser} self={self} /></Tabs.Panel>
			<Tabs.Panel value="2"><UserReportsPanel user={displayedUser} self={self} reports={reports} /></Tabs.Panel>
		</Tabs>
	));
};

export default UserPage;
