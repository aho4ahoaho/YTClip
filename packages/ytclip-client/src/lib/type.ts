export type MouseElementEvent<T extends HTMLElement> = (
	e: MouseEvent & {
		currentTarget: T & EventTarget;
	}
) => void;
