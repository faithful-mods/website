'use client';

import { TabsLayout } from '~/components/base/tabs-layout';

interface Props {
	children: React.ReactNode;
}

export default function UserLayout({ children }: Props) {
	const tabs = [
		{ value: 'profile', label: 'Profile', layoutTab: true },
		{ value: 'settings', label: 'Settings' },
	];

	return (
		<TabsLayout
			tabs={tabs}
			defaultValue="profile"
			noMargin
			variant="filled"
			isLayout
		>
			{children}
		</TabsLayout>
	);
}
