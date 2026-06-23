import { probe } from "../hotspot.js";

export default function B() {
	return <div>B-{probe()}</div>;
}
