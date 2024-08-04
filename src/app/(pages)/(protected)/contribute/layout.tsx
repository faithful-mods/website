'use client';

import { TabsLayout } from '~/components/tabs';

interface ProtectedLayoutProps {
	children: React.ReactNode;
};

const ContributeLayout = ({ children }: ProtectedLayoutProps) => {
	const tabs = [
		{ value: 'about', label: 'About' },
		{ value: 'submit', label: 'Submit' },
	];

	return (
		<TabsLayout
			tabs={tabs}
			defaultValue="about"
		>
			{children}
		</TabsLayout>
	);
};

export default ContributeLayout;
