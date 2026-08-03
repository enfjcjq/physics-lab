// ============================================================
// AI Parser End-to-End Test Cases (T310)
//
// 50 physics problems covering:
//   mechanics (20) / electromagnetism (10) / thermodynamics (5)
//   optics (5) / waves (5) / mixed phrasing (5)
//
// expectedType = scene metadata.topic (see packages/shared/constants)
// expectedParams = normalized param name -> expected value.
// The runner (run-e2e.ts) compares extracted scene values against
// these with a relative tolerance.
// ============================================================

export type TestCategory =
  | "mechanics"
  | "electromagnetism"
  | "thermodynamics"
  | "optics"
  | "waves"
  | "mixed";

export interface ParseTestCase {
  id: string;
  category: TestCategory;
  lang: "zh" | "en";
  text: string;
  expectedType: string;
  expectedParams?: Record<string, number>;
}

export const parseTestCases: ParseTestCase[] = [
  // ---------------- Mechanics (20) ----------------
  {
    id: "m01",
    category: "mechanics",
    lang: "zh",
    text: "一个小球从20米高处自由下落，取g=10m/s²，忽略空气阻力。",
    expectedType: "free_fall",
    expectedParams: { height: 20, gravity: 10 },
  },
  {
    id: "m02",
    category: "mechanics",
    lang: "en",
    text: "A ball is dropped from rest from a height of 25 meters. Use g = 9.8 m/s².",
    expectedType: "free_fall",
    expectedParams: { height: 25, gravity: 9.8 },
  },
  {
    id: "m03",
    category: "mechanics",
    lang: "zh",
    text: "质量为2千克的小球从高度15米处由静止释放，g取9.8m/s²。",
    expectedType: "free_fall",
    expectedParams: { mass: 2, height: 15, gravity: 9.8 },
  },
  {
    id: "m04",
    category: "mechanics",
    lang: "en",
    text: "An apple falls from a tree branch 5 m above the ground (g = 9.8).",
    expectedType: "free_fall",
    expectedParams: { height: 5, gravity: 9.8 },
  },
  {
    id: "m05",
    category: "mechanics",
    lang: "zh",
    text: "小球以20m/s的初速度水平抛出，g=10m/s²，求落地时间。",
    expectedType: "projectile_motion",
    expectedParams: { velocity: 20, gravity: 10 },
  },
  {
    id: "m06",
    category: "mechanics",
    lang: "en",
    text: "A projectile is launched with an initial velocity of 30 m/s at an angle of 45 degrees.",
    expectedType: "projectile_motion",
    expectedParams: { velocity: 30, angle: 45 },
  },
  {
    id: "m07",
    category: "mechanics",
    lang: "zh",
    text: "斜抛运动：物体以初速度50m/s、仰角37度抛出，g=9.8。",
    expectedType: "projectile_motion",
    expectedParams: { velocity: 50, angle: 37, gravity: 9.8 },
  },
  {
    id: "m08",
    category: "mechanics",
    lang: "zh",
    text: "质量为3kg的滑块从倾角为30度的斜面顶端滑下，摩擦系数为0.2。",
    expectedType: "inclined_plane",
    expectedParams: { mass: 3, angle: 30, friction: 0.2 },
  },
  {
    id: "m09",
    category: "mechanics",
    lang: "en",
    text: "A block slides down an inclined plane with angle 30 degrees and friction coefficient 0.3.",
    expectedType: "inclined_plane",
    expectedParams: { angle: 30, friction: 0.3 },
  },
  {
    id: "m10",
    category: "mechanics",
    lang: "zh",
    text: "质量为1kg的小球以4m/s的速度与静止小球发生弹性碰撞。",
    expectedType: "collision",
    expectedParams: { mass: 1, velocity: 4 },
  },
  {
    id: "m11",
    category: "mechanics",
    lang: "en",
    text: "Two balls collide elastically. Ball A has mass 2 kg and velocity 5 m/s.",
    expectedType: "collision",
    expectedParams: { mass: 2, velocity: 5 },
  },
  {
    id: "m12",
    category: "mechanics",
    lang: "zh",
    text: "弹簧振子做简谐振动，振子质量2kg，劲度系数k=50N/m。",
    expectedType: "simple_harmonic_motion",
    expectedParams: { mass: 2, k: 50 },
  },
  {
    id: "m13",
    category: "mechanics",
    lang: "en",
    text: "A 0.5 kg mass oscillates on a spring with spring constant k = 100 N/m.",
    expectedType: "simple_harmonic_motion",
    expectedParams: { mass: 0.5, k: 100 },
  },
  {
    id: "m14",
    category: "mechanics",
    lang: "zh",
    text: "单摆的摆长为1米，当地重力加速度g=9.8m/s²。",
    expectedType: "pendulum",
    expectedParams: { length: 1, gravity: 9.8 },
  },
  {
    id: "m15",
    category: "mechanics",
    lang: "en",
    text: "A simple pendulum has a string length of 1.5 m.",
    expectedType: "pendulum",
    expectedParams: { length: 1.5 },
  },
  {
    id: "m16",
    category: "mechanics",
    lang: "zh",
    text: "质量为1kg的小球在水平面上做匀速圆周运动，半径0.5米，线速度2m/s。",
    expectedType: "circular_motion",
    expectedParams: { mass: 1, velocity: 2 },
  },
  {
    id: "m17",
    category: "mechanics",
    lang: "en",
    text: "A ball of mass 0.2 kg moves in uniform circular motion with radius 0.8 m and speed 4 m/s.",
    expectedType: "circular_motion",
    expectedParams: { mass: 0.2, velocity: 4 },
  },
  {
    id: "m18",
    category: "mechanics",
    lang: "zh",
    text: "密度为0.6×10³kg/m³的物体漂浮在水面上，物体质量为3kg。",
    expectedType: "buoyancy",
    expectedParams: { mass: 3 },
  },
  {
    id: "m19",
    category: "mechanics",
    lang: "en",
    text: "A 2 kg block floats in water with 40 percent of its volume submerged.",
    expectedType: "buoyancy",
    expectedParams: { mass: 2 },
  },
  {
    id: "m20",
    category: "mechanics",
    lang: "zh",
    text: "小球从10米高处以5m/s的初速度竖直向下抛出，g=9.8。",
    expectedType: "free_fall",
    expectedParams: { height: 10, gravity: 9.8 },
  },

  // ---------------- Electromagnetism (10) ----------------
  {
    id: "e01",
    category: "electromagnetism",
    lang: "zh",
    text: "一个电阻的阻值为6欧姆，两端电压为12V，求通过电阻的电流。",
    expectedType: "ohms_law",
    expectedParams: { resistance: 6, voltage: 12 },
  },
  {
    id: "e02",
    category: "electromagnetism",
    lang: "en",
    text: "A resistor of 10 ohms has a voltage of 5 V across it. Calculate the current.",
    expectedType: "ohms_law",
    expectedParams: { resistance: 10, voltage: 5 },
  },
  {
    id: "e03",
    category: "electromagnetism",
    lang: "zh",
    text: "两个点电荷q1=2μC，q2=3μC，相距0.2米，求它们之间的静电力。",
    expectedType: "coulombs_law",
    expectedParams: { charge: 2 },
  },
  {
    id: "e04",
    category: "electromagnetism",
    lang: "en",
    text: "Two point charges of +3 μC and -2 μC are separated by a distance of 0.5 m. Find the electric force.",
    expectedType: "coulombs_law",
    expectedParams: { charge: 3 },
  },
  {
    id: "e05",
    category: "electromagnetism",
    lang: "zh",
    text: "一个100匝的线圈放在变化的磁场中，磁通量均匀变化，求感应电动势。",
    expectedType: "faraday_law",
    expectedParams: { turns: 100 },
  },
  {
    id: "e06",
    category: "electromagnetism",
    lang: "en",
    text: "A coil with 200 turns experiences a changing magnetic flux and induces an EMF.",
    expectedType: "faraday_law",
    expectedParams: { turns: 200 },
  },
  {
    id: "e07",
    category: "electromagnetism",
    lang: "zh",
    text: "直流电动机的线圈在磁场中受力转动，线圈电流为2A。",
    expectedType: "electric_motor",
    expectedParams: { current: 2 },
  },
  {
    id: "e08",
    category: "electromagnetism",
    lang: "en",
    text: "A DC motor converts electrical energy into rotational motion using torque on a current-carrying coil.",
    expectedType: "electric_motor",
    expectedParams: {},
  },
  {
    id: "e09",
    category: "electromagnetism",
    lang: "zh",
    text: "交流发电机中，线圈在匀强磁场中匀速转动，产生正弦交流电，线圈匝数为10。",
    expectedType: "ac_generator",
    expectedParams: { turns: 10 },
  },
  {
    id: "e10",
    category: "electromagnetism",
    lang: "en",
    text: "An AC generator produces a sinusoidal EMF as its coil rotates in a uniform magnetic field.",
    expectedType: "ac_generator",
    expectedParams: {},
  },

  // ---------------- Thermodynamics (5) ----------------
  {
    id: "t01",
    category: "thermodynamics",
    lang: "zh",
    text: "一定质量的理想气体，温度300K，压强为150000帕，体积2升，求物质的量。",
    expectedType: "ideal_gas",
    expectedParams: { temperature: 300, pressure: 150000 },
  },
  {
    id: "t02",
    category: "thermodynamics",
    lang: "en",
    text: "An ideal gas at 300 K and 2 atm occupies 1 L. Find the number of moles.",
    expectedType: "ideal_gas",
    expectedParams: { temperature: 300, pressure: 2 },
  },
  {
    id: "t03",
    category: "thermodynamics",
    lang: "zh",
    text: "气缸内理想气体做等温压缩，温度保持350K不变，初始压强为100000Pa。",
    expectedType: "ideal_gas",
    expectedParams: { temperature: 350, pressure: 100000 },
  },
  {
    id: "t04",
    category: "thermodynamics",
    lang: "en",
    text: "A piston compresses an ideal gas isothermally at 400 K.",
    expectedType: "ideal_gas",
    expectedParams: { temperature: 400 },
  },
  {
    id: "t05",
    category: "thermodynamics",
    lang: "zh",
    text: "理想气体状态方程pV=nRT中，P=100000Pa，V=2L，T=300K，R=8.31。",
    expectedType: "ideal_gas",
    expectedParams: { pressure: 100000, temperature: 300 },
  },

  // ---------------- Optics (5) ----------------
  {
    id: "o01",
    category: "optics",
    lang: "zh",
    text: "一束光线从空气射入玻璃，入射角为45度，玻璃的折射率为1.5。",
    expectedType: "refraction",
    expectedParams: { angle: 45, refractive_index: 1.5 },
  },
  {
    id: "o02",
    category: "optics",
    lang: "en",
    text: "A light ray enters glass (refractive index 1.5) from air at an angle of 45 degrees.",
    expectedType: "refraction",
    expectedParams: { angle: 45, refractive_index: 1.5 },
  },
  {
    id: "o03",
    category: "optics",
    lang: "zh",
    text: "一个凸透镜的焦距为10厘米，物体放在距透镜20厘米处。",
    expectedType: "lens_optics",
    expectedParams: { focal_length: 10 },
  },
  {
    id: "o04",
    category: "optics",
    lang: "en",
    text: "A convex lens with focal length 15 cm forms an image of an object 30 cm away.",
    expectedType: "lens_optics",
    expectedParams: { focal_length: 15 },
  },
  {
    id: "o05",
    category: "optics",
    lang: "zh",
    text: "物体放在凸透镜二倍焦距处，凸透镜焦距f=12cm。",
    expectedType: "lens_optics",
    expectedParams: { focal_length: 12 },
  },

  // ---------------- Waves (5) ----------------
  {
    id: "w01",
    category: "waves",
    lang: "zh",
    text: "一列横波沿x轴传播，波速为340m/s，频率为680Hz，求波长。",
    expectedType: "transverse_wave",
    expectedParams: { wave_speed: 340, frequency: 680 },
  },
  {
    id: "w02",
    category: "waves",
    lang: "en",
    text: "A transverse wave travels at 340 m/s with a frequency of 680 Hz.",
    expectedType: "transverse_wave",
    expectedParams: { wave_speed: 340, frequency: 680 },
  },
  {
    id: "w03",
    category: "waves",
    lang: "zh",
    text: "火车以30m/s的速度驶向静止的观察者，鸣笛频率为500Hz，声速340m/s，求观察者听到的频率。",
    expectedType: "doppler_effect",
    expectedParams: { velocity: 30, frequency: 500 },
  },
  {
    id: "w04",
    category: "waves",
    lang: "en",
    text: "A train moving at 30 m/s sounds its horn (500 Hz) as it approaches a stationary observer. Sound speed is 340 m/s.",
    expectedType: "doppler_effect",
    expectedParams: { velocity: 30, frequency: 500 },
  },
  {
    id: "w05",
    category: "waves",
    lang: "zh",
    text: "机械波的周期为0.2秒，波速为10m/s，求波长。",
    expectedType: "transverse_wave",
    expectedParams: { wave_speed: 10 },
  },

  // ---------------- Mixed phrasing (5) ----------------
  {
    id: "x01",
    category: "mixed",
    lang: "zh",
    text: "一个苹果从5米高的树上自由下落，忽略空气阻力，g=9.8m/s²，求落地速度。",
    expectedType: "free_fall",
    expectedParams: { height: 5, gravity: 9.8 },
  },
  {
    id: "x02",
    category: "mixed",
    lang: "zh",
    text: "篮球以45度仰角斜抛，初速度为8m/s，g=10m/s²。",
    expectedType: "projectile_motion",
    expectedParams: { velocity: 8, angle: 45, gravity: 10 },
  },
  {
    id: "x03",
    category: "mixed",
    lang: "en",
    text: "A grandfather clock pendulum with string length L = 1 m swings with small amplitude.",
    expectedType: "pendulum",
    expectedParams: { length: 1 },
  },
  {
    id: "x04",
    category: "mixed",
    lang: "zh",
    text: "一质量为0.2kg的物体悬挂在劲度系数为40N/m的弹簧上做简谐运动，振幅5厘米。",
    expectedType: "simple_harmonic_motion",
    expectedParams: { mass: 0.2, k: 40 },
  },
  {
    id: "x05",
    category: "mixed",
    lang: "en",
    text: "Find the electric force between two point charges of 3 μC and 4 μC separated by 30 cm.",
    expectedType: "coulombs_law",
    expectedParams: { charge: 3 },
  },
];

