import { Poppins } from 'next/font/google';

import { cn } from '~/lib/utils';

const font = Poppins({
	subsets: ['latin'],
	weight: ['600'],
});

export default async function Modpacks() {
	return (
		<main className="flex flex-col items-center justify-center">
			<h1 className={cn(font)}>Modpacks page</h1>
		</main>
	);
}
