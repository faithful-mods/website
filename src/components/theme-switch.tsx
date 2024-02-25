'use client';

import { ActionIcon, MantineColorScheme, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import { TbSun, TbMoon, TbSunMoon, TbCloud } from 'react-icons/tb';

export const ThemeSwitch = () => {
	const colorSchemes: MantineColorScheme[] = ['light', 'dark', 'auto'];

	const [icon, setIcon] = useState<React.ReactNode>(<TbCloud className="w-4 h-4"/>);
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	const setIconFromStr = (scheme: MantineColorScheme) => {
		switch (scheme) {
		case 'light':
			setIcon(<TbSun className="w-4 h-4"/>);
			break;
		case 'dark':
			setIcon(<TbMoon className="w-4 h-4"/>);
			break;
		default:
			setIcon(<TbSunMoon className="w-4 h-4"/>);
			break;
		}
	}

	const toggleColorScheme = () => {
		const newColorScheme = colorSchemes[(colorSchemes.indexOf(colorScheme) + 1) % colorSchemes.length];
		setColorScheme(newColorScheme);
		setIconFromStr(newColorScheme);
	}

	useEffect(() => {
		setIconFromStr(colorScheme);
	}, [colorScheme])

	return (
		<ActionIcon 
			size="lg" 
			onClick={() => toggleColorScheme()}
			radius={100}
			variant="outline"
			className="navbar-icon-fix"
		>
			{icon}
		</ActionIcon>
	);
}