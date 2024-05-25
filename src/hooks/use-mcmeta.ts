import { useEffect, useRef, useState } from 'react';

import type { MCMETA, TextureMCMETA } from '~/types';

interface Frame {
	index: number;
	duration: number;
}

interface useAnimationReturn {
	/**
	 * A ref to the canvas element used for the animation
	 */
	canvasRef: React.RefObject<HTMLCanvasElement>;
	/**
	 * True if the MCMETA data is valid and the animation is running
	 */
	isMCMETAValid: boolean;
}

/**
 * A hook to animate a texture using the given MCMETA data
 * @param mcmeta The MCMETA data to use for the animation
 * @param imageURL The image URL to animate
 *
 * @returns A ref to the canvas element and a boolean indicating if the MCMETA data is valid
 *
 * @author [Even Torset](https://github.com/EvenTorset) for the original MCMETA to canvas code
 */
export function useMCMETA(mcmeta: TextureMCMETA, imageURL: string): useAnimationReturn {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationInterval = useRef<NodeJS.Timeout>();

	const [isValid, setValid] = useState(true);

	useEffect(() => {
		// Clear the previous interval if it exists
		// >> avoid cumulative intervals when the component re-renders
		if (animationInterval.current) {
			clearInterval(animationInterval.current);
			animationInterval.current = undefined;
		}

		let __mcmeta: MCMETA;

		// Short return if the mcmeta is not valid or not present
		if (!mcmeta) return setValid(false);
		if (typeof mcmeta === 'string') {
			try {
				__mcmeta = JSON.parse(mcmeta);
				setValid(true);
			} catch {
				return setValid(false);
			}
		} else {
			__mcmeta = mcmeta;
			setValid(true);
		}

		const image = new Image();
		image.src = imageURL;

		const tick = Math.max(__mcmeta.animation.frametime || 1, 1);
		const frames: Frame[] = [];

		let interval: number;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const context = canvas.getContext('2d');
		if (!context) return;

		canvas.style.width = '100%';
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetWidth;

		const draw = (frame = 0, ticks = 0) => {
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.globalAlpha = 1;
			context.imageSmoothingEnabled = false;
			context.drawImage(
				image,
				0,            image.width * frames[frame].index,
				image.width,  image.width,
				0,            0,
				canvas.width, canvas.height
			);

			if (__mcmeta.animation.interpolate) {
				context.globalAlpha = ticks / frames[frame].duration;
				context.drawImage(
					image,
					0,            image.width * frames[(frame + 1) % frames.length].index,
					image.width,  image.width,
					0,            0,
					canvas.width,	canvas.height
				);
			}
		};

		image.onload = () => {
			if (__mcmeta.animation.frames && __mcmeta.animation.frames.length > 0) {
				interval =
					__mcmeta.animation.interpolate ||
					__mcmeta.animation.frames.find((e) => typeof e === 'object' && e.time % tick !== 0)
						? 1
						: tick;

				for (let e = 0; e < __mcmeta.animation.frames.length; e++) {
					const a = __mcmeta.animation.frames[e];
					if (typeof a === 'object')
						frames.push({
							index: a.index,
							duration: Math.max(a.time, 1) / interval,
						});
					else
						frames.push({
							index: a,
							duration: tick / interval,
						});
				}
			} else {
				interval = __mcmeta.animation.interpolate ? 1 : tick;
				const e = image.height / image.width;
				for (let a = 0; a < e; a++) frames.push({ index: a, duration: tick / interval });
			}

			let ticks = 0;
			let currentFrame = 0;

			const update = () => {
				ticks++;

				if (frames[currentFrame].duration <= ticks) {
					ticks = 0;
					currentFrame++;
					if (currentFrame >= frames.length) currentFrame = 0;
					draw(currentFrame);
				} else if (__mcmeta.animation.interpolate) draw(currentFrame, ticks);
			};

			if (!animationInterval.current) {
				update(); // initial draw before starting interval
				animationInterval.current = setInterval(update, interval * 60);
			}
		};

		image.onerror = () => {
			canvas.remove();
		};
	}, [
		imageURL,
		mcmeta,
		isValid, // re-run if the mcmeta validity changes
	]);

	return { canvasRef, isMCMETAValid: isValid };
}
