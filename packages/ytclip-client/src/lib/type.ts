export type MouseElementEventHandler<T extends HTMLElement> = (
	e: MouseEvent & {
		currentTarget: T & EventTarget;
	}
) => void;
