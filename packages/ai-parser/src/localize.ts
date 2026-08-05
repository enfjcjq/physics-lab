// ============================================================
// S77 方案 a：教学文本本地化（规则解析器，治本）
// 中文题目 → 生成的场景教学文本（phase 描述 / event 描述）
// 使用中文，保证学生看到的教学提示跟随题目语言。
// force label 均为物理符号（G/N/T/f/F_e/F_s），无需翻译。
// ============================================================

import type { PhysicsScene } from "@physics-lab/shared";

export function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

const PHASE_ZH: Record<string, string> = {
  "Ball falling, vy increasing downward": "小球下落，速度增大",
  "Ball launched with initial velocity": "小球以初速度发射",
  "Ball reaches ground, experiment ends": "小球落地，实验结束",
  "Ball rising, vy decreasing due to gravity": "小球上升，重力使速度减小",
  "Balls approaching each other": "两球相向靠近",
  "Balls moving apart with new velocities": "两球以新速度分离",
  "Block accelerates down incline": "滑块沿斜面加速下滑",
  "Block at rest at top of incline": "滑块在斜面顶端静止",
  "Block reaches bottom of incline": "滑块到达斜面底部",
  "Block slides on horizontal ground": "滑块在水平地面滑动",
  "Charges at initial separation": "电荷处于初始间距",
  "Charges repel each other": "电荷相互排斥",
  "Continuous cycles of alternating current": "持续交变电流循环",
  "Current applied, torque begins": "通电，开始产生力矩",
  "EMF negative, current direction flips": "电动势为负，电流方向翻转",
  "EMF positive, current flows one way": "电动势为正，电流单向流动",
  "Force weakens with distance": "力随距离增大而减弱",
  "Impact with ground, bouncing": "落地并反弹",
  "Initial displacement": "初始位移",
  "Initial release from angle": "从初始角度释放",
  "Initial state: ball at rest": "初始状态：小球静止",
  "Light hits boundary": "光线到达界面",
  "Light in medium 1 (n1)": "光线在介质 1（n1）中",
  "Light in medium 2 (n2)": "光线在介质 2（n2）中",
  "Magnet approaches coil": "磁铁靠近线圈",
  "Magnet leaves coil": "磁铁远离线圈",
  "Magnet passes through coil": "磁铁穿过线圈",
  "Maximum height. vy = 0, vx unchanged": "到达最高点：vy=0，vx 不变",
  "Minimum volume, maximum pressure": "体积最小，压强最大",
  "Moment of impact. Momentum is conserved.": "碰撞瞬间：动量守恒",
  "Piston compresses gas": "活塞压缩气体",
  "Piston expands, pressure drops": "活塞膨胀，压强降低",
  "Post-impact motion": "碰撞后的运动",
  "Rays converge to image": "光线汇聚成像",
  "Rays from object to lens": "光线从物体射向透镜",
  "Rays refract through lens": "光线经透镜折射",
  "Rotor accelerates to steady speed": "转子加速至匀速",
  "Simple harmonic oscillation": "简谐振动",
  "Source moves away from observer": "声源远离观察者",
  "Source moves toward observer": "声源靠近观察者",
  "Source passes observer": "声源经过观察者",
  "Steady rotation": "匀速转动",
  "Uniformly accelerated motion under gravity": "重力作用下的匀加速运动",
};

const EVENT_ZH: Record<string, string> = {
  "Ball launched at angle from origin": "小球从原点以角度发射",
  "Ball released from rest": "小球从静止释放",
  "Balls moving apart": "两球分离",
  "Balls moving toward each other": "两球相向运动",
  "Block reaches bottom of incline": "滑块到达斜面底部",
  "Block released from top of incline": "滑块从斜面顶端释放",
  "Block slides onto ground": "滑块滑到水平地面",
  "Bob at lowest point, max velocity": "摆球到最低点，速度最大",
  "Bob at opposite maximum angle": "摆球到另一侧最大角度",
  "Collision occurs": "发生碰撞",
  "Impact with ground": "与地面接触",
  "Mass passes through equilibrium": "振子经过平衡位置",
  "Mass released from displaced position": "振子从偏移位置释放",
  "Maximum displacement (amplitude)": "达到最大位移（振幅）",
  "Maximum height reached. vy = 0": "到达最高点：vy=0",
  "Pendulum released from angle": "单摆从角度释放",
};

/** Translate student-visible teaching text in-place for Chinese problems. */
export function localizeScene(scene: PhysicsScene): PhysicsScene {
  for (const p of scene.timeline?.phases ?? []) {
    if (p.description && PHASE_ZH[p.description]) p.description = PHASE_ZH[p.description];
  }
  for (const e of scene.timeline?.events ?? []) {
    if (e.description && EVENT_ZH[e.description]) e.description = EVENT_ZH[e.description];
  }
  return scene;
}
