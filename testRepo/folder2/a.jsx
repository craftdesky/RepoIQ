import { probe } from "../hotspot.js";

export default function A() {
	return <div>A-{probe()}</div>;
}
