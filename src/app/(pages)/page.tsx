import { Poppins } from 'next/font/google';

import { cn } from '~/lib/utils';

const font = Poppins({
	subsets: ['latin'],
	weight: ['600'],
});

export default async function Home() {
	return (
		<main className="flex flex-col items-center justify-center">
			<h1 className={cn(font)}>Faithful Mods homepage</h1>
			{ process.env.NODE_ENV === 'production' ? <p>Production mode</p> : <p>Development mode</p>}
		</main>
	);
}
