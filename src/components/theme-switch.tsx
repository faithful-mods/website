'use client';

import { ActionIcon, MantineColorScheme, useMantineColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import { TbSun, TbMoon, TbSunMoon, TbCloud } from 'react-icons/tb';

export const ThemeSwitch = () => {
	const colorSchemes: MantineColorScheme[] = ['light', 'dark', 'auto'];

	const [icon, setIcon] = useState<React.ReactNode>(<TbCloud className="w-5 h-5"/>);
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	const setIconFromStr = (scheme: MantineColorScheme) => {
		switch (scheme) {
			case 'light':
				setIcon(<TbSun className="w-5 h-5"/>);
				break;
			case 'dark':
				setIcon(<TbMoon className="w-5 h-5"/>);
				break;
			default:
				setIcon(<TbSunMoon className="w-5 h-5"/>);
				break;
		}
	};

	const toggleColorScheme = () => {
		const newColorScheme = colorSchemes[(colorSchemes.indexOf(colorScheme) + 1) % colorSchemes.length];
		setColorScheme(newColorScheme);
		setIconFromStr(newColorScheme);
	};

	useEffect(() => {
		setIconFromStr(colorScheme);
	}, [colorScheme]);

	return (
		<ActionIcon
			size="sm"
			onClick={() => toggleColorScheme()}
			variant="transparent"
			className="navbar-icon-fix"
		>
			{icon}
		</ActionIcon>
	);
};
