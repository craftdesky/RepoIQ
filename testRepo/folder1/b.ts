import { probe } from "../hotspot.js";

export function b() {
	return `b-${probe()}`;
}
