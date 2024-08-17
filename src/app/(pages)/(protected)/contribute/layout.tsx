'use client';

import { TabsLayout } from '~/components/tabs';

interface Props {
	children: React.ReactNode;
}

export default function ContributeLayout({ children }: Props) {
	return (
		<TabsLayout
			tabs={[
				{ value: 'about', label: 'About' },
				{ value: 'submissions', label: 'Submissions' },
				{ value: 'settings', label: 'Settings' },
			]}
		>
			{children}
		</TabsLayout>
	);

}
