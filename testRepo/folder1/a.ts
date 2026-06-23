import { probe } from "../hotspot.js";

export const a = () => {
	return `a-${probe()}`;
};
