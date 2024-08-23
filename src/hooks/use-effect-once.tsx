import { useEffect } from 'react';
import type { EffectCallback } from 'react';

/**
 * Calls the effect function only once after the component is mounted.
 * @warning the effect is called twice on Development mode due to React StrictMode.
 */
export function useEffectOnce(effect: EffectCallback) {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(effect, []);
}
