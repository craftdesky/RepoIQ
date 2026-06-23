import { probe } from "./hotspot.js";
import {hola} from "./two.js"

function sayhi(){
    // use probe to create a reference
    console.log('hello', probe());
}