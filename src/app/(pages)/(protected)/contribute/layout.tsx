'use client';

import { GoAlert } from 'react-icons/go';

import { CloseButton, Group, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';

import { TabsLayout } from '~/components/tabs';
import { Tile } from '~/components/tile';

interface ProtectedLayoutProps {
	children: React.ReactNode;
};

const ContributeLayout = ({ children }: ProtectedLayoutProps) => {
	const [isTOSShown, setShown] = useLocalStorage({
		key: 'faithful-mods-contribute-tos',
		defaultValue: true,
	});

	const tabs = [
		{ value: 'about', label: 'About' },
		{ value: 'submit', label: 'Submit' },
	];

	return (
		<>
			{isTOSShown && (
				<Tile color="yellow" mb="md" p="xs" pl="md">
					<Group justify="space-between">
						<Group gap="xs" wrap="nowrap">
							<GoAlert color="black" />
							<Text size="sm" c="black" >
								By contributing to the platform, you agree to the <Text component="a" href="/docs/tos" c="brown" target="_blank">Terms of Service</Text>.<br />
							</Text>
						</Group>
						<CloseButton
							variant="transparent"
							style={{ color: 'black' }}
							onClick={() => setShown(false)}
						/>
					</Group>
				</Tile>
			)}

			<TabsLayout
				tabs={tabs}
				defaultValue="about"
				variant="filled"
				noMargin
			>
				{children}
			</TabsLayout>
		</>
	);
};

export default ContributeLayout;
