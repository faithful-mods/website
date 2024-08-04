'use client';

import { redirect } from 'next/navigation';

const CouncilPage = () => {
	let value: boolean = false;

	try {
		value = JSON.parse(localStorage.getItem('faithful-mods-contribute-about') ?? 'false');
	} catch (e) {
		console.error(e);
	}

	if (value) redirect('/contribute/submit');
	redirect('/contribute/about');
};

export default CouncilPage;
