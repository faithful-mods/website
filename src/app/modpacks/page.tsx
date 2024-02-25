import { Poppins } from "next/font/google";

import { cn } from "@/src/lib/utils";

const font = Poppins({
	subsets: ["latin"],
	weight: ["600"]
})

export default async function Home() {
	return (
		<main className="flex flex-col items-center justify-center">
			<h1 className={cn(font)}>Faithful Mods modpacks page</h1>
		</main>
	)
}
