import { usePathname, useRouter } from 'next/navigation';

import { useMemo } from 'react';

import { Tabs } from '@mantine/core';

import { useViewportSize } from '@mantine/hooks';
import { BREAKPOINT_MOBILE_LARGE } from '~/lib/constants';

interface TabsLayoutProps<T extends string[]> {
	noMargin?: boolean;
	children: React.ReactNode;
	defaultValue?: T[number];
	isLayout?: boolean;
	variant?: 'default' | 'filled';
	tabs: {
		value: T[number];
		label: T[number];
		layoutTab?: boolean;
	}[];
};

export const TabsLayout = <T extends string[]>({ children, tabs, defaultValue, isLayout, variant, noMargin }: TabsLayoutProps<T>) => {
	const { width } = useViewportSize();
	const router = useRouter();
	const pathname = usePathname();

	const tabsStyle = useMemo(() => variant ?? 'default', [variant]);
	const currentTab = useMemo(() => {
		if (!isLayout) return pathname.split('/').pop() as T[number];

		// check if the current page shown is the base layout page
		const maybeBaseLayoutPage = pathname.split('/').pop();
		const found = tabs.find((tab) => tab.value === maybeBaseLayoutPage);
		if (found) return found.value;
		return tabs.find((tab) => tab.layoutTab)?.value ?? '';

	}, [isLayout, pathname, tabs]);

	return (
		<Tabs
			color="blue"
			value={currentTab}
			onChange={(value) => {
				const tab = tabs.find((tab) => tab.value === value);
				if (tab?.layoutTab) return router.push(`${pathname.replace(currentTab, '')}`);
				return router.push(`${(pathname.endsWith('/') ? pathname : `${pathname}/`).replace(currentTab, '')}${value}`);
			}}

			orientation={width > BREAKPOINT_MOBILE_LARGE ? 'vertical' : 'horizontal'}
			ml={width > BREAKPOINT_MOBILE_LARGE && tabsStyle === 'default' ? -125 : 0}

			variant={tabsStyle === 'filled'
				? width > BREAKPOINT_MOBILE_LARGE ? 'pills' : 'default'
				: 'default'
			}

			defaultValue={defaultValue}
		>
			<Tabs.List
				mt={tabsStyle === 'filled' && width > BREAKPOINT_MOBILE_LARGE && !noMargin ? 26 : 0}
				mah={tabsStyle === 'default' ? tabs.length * 34 : undefined}
				w={width > BREAKPOINT_MOBILE_LARGE ? (tabsStyle === 'default' ? 200 : 120) : undefined}
			>
				{tabs.map((tab) => (
					<Tabs.Tab
						key={tab.value}
						value={tab.value}
						style={{
							justifyContent: tabsStyle === 'default' ? 'right' : 'center',
						}}
					>
						{tab.label}
					</Tabs.Tab>
				))}
			</Tabs.List>

			<Tabs.Panel
				maw={tabsStyle === 'default' ? '1429px' : undefined}
				value={currentTab}
				pl={width > BREAKPOINT_MOBILE_LARGE ? 'sm' : '0'}
				pt={width > BREAKPOINT_MOBILE_LARGE ? '0' : 'sm'}
			>
				{children}
			</Tabs.Panel>
		</Tabs>
	);

};
