// S82 self-verify: export 3 scene types as HTML and check quality
import { FREE_FALL_SCENE, OHMS_LAW_SCENE, MOTOR_SCENE } from "@physics-lab/shared";
import { generateHTMLReport, generateMarkdownReport } from "../apps/desktop/src/renderer/lib/report";

const scenes: any[] = [FREE_FALL_SCENE, OHMS_LAW_SCENE, MOTOR_SCENE];
const names = ["free_fall", "ohms_law", "electric_motor"];

function check(label: string, cond: boolean, detail?: string) {
  console.log((cond ? "PASS " : "FAIL ") + label + (detail ? " :: " + detail : ""));
  if (!cond) process.exitCode = 1;
}

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const data = { scene, params: {}, currentTime: 1.0, ballY: 5, ballVelocity: -9.8 };
  const md = generateMarkdownReport(data, "zh-CN");
  const html = generateHTMLReport(data, "zh-CN");
  const body = html.slice(html.indexOf("<body>"), html.indexOf("</body>"));
  console.log("===== " + names[i] + " =====");
  check("no raw heading", !/#{1,3}\s/.test(body));
  check("no raw bold", !body.includes("**"));
  check("no raw table", !body.includes("|---"));
  check("no raw i18n key", !/teacher\.\w+\.step\d/.test(md));
  check("params from sim", /<table>/.test(body));
  const sim = (scene as any).simulation?.params ?? {};
  check("params include scene keys", Object.keys(sim).some((k) => md.includes(k)), "sim keys: " + Object.keys(sim).join(","));
  if (names[i] === "electric_motor") {
    check("motor state torque", md.includes("力矩"));
    check("motor state angular speed", md.includes("角速度"));
  }
  if (names[i] === "free_fall") { check("free-fall state y", md.includes("位置 y")); }
  if (names[i] === "ohms_law") { check("ohms state current", md.includes("电流")); }
}
console.log("done");