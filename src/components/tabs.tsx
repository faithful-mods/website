import { usePathname, useRouter } from 'next/navigation';

import { Tabs } from '@mantine/core';

import { useDeviceSize } from '~/hooks/use-device-size';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';
import { gradient } from '~/lib/utils';

interface TabsLayoutProps<T extends string[]> {
	children: React.ReactNode;
	defaultValue?: T[number];
	tabs: { value: T[number]; label: T[number] }[];
};

export const TabsLayout = <T extends string[]>({ children, tabs, defaultValue }: TabsLayoutProps<T>) => {
	const [windowWidth] = useDeviceSize();
	const router = useRouter();
	const pathname = usePathname();
	const currentTab = pathname.split('/').pop() ?? '';

	return (
		<Tabs
			color={gradient.to}
			value={currentTab}
			onChange={(value) => router.push(`${pathname.replace(currentTab, '')}${value}`)}

			orientation={windowWidth > BREAKPOINT_MOBILE_LARGE ? 'vertical' : 'horizontal'}
			ml={windowWidth > BREAKPOINT_MOBILE_LARGE ? -125 : 0}

			defaultValue={defaultValue}
		>
			<Tabs.List
				w={windowWidth > BREAKPOINT_MOBILE_LARGE ? 200 : undefined}
				mah={34 * tabs.length}
				content="right"
			>
				{tabs.map((tab) => (
					<Tabs.Tab key={tab.value} value={tab.value} style={{ justifyContent: 'right' }}>
						{tab.label}
					</Tabs.Tab>
				))}
			</Tabs.List>

			<Tabs.Panel
				maw="1429px"
				value={currentTab}
				pl={windowWidth > BREAKPOINT_MOBILE_LARGE ? 'sm' : '0'}
				pt={windowWidth > BREAKPOINT_MOBILE_LARGE ? '0' : 'sm'}
			>
				{children}
			</Tabs.Panel>
		</Tabs>
	);

};
