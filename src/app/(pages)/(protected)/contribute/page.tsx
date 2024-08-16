'use client';

import { redirect } from 'next/navigation';

import { useLocalStorage } from '@mantine/hooks';

const CouncilPage = () => {
	const [isAboutShown] = useLocalStorage({
		key: 'faithful-modded-show-contribute-about-page',
		defaultValue: true,
		getInitialValueInEffect: false,
	});

	if (isAboutShown) redirect('/contribute/about');
	redirect('/contribute/submit');
};

export default CouncilPage;
