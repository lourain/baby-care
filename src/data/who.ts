// ===== WHO 0-3 岁生长标准（近似值，用于生长曲线百分位对照） =====
// 锚点取自 WHO 2006 生长标准（月龄 → 数值），中间月份线性插值。
// 百分位为近似值，仅供居家参考；确切评估以儿保医生使用 WHO LMS 数据为准。

type Anchor = [number, number][] // [月龄, 中位数]

// 身长/身高（cm）中位数锚点
const LEN_BOYS: Anchor = [
  [0, 49.9], [3, 61.4], [6, 67.6], [9, 72.0], [12, 75.7], [18, 82.3], [24, 87.1], [30, 91.1], [36, 95.0],
]
const LEN_GIRLS: Anchor = [
  [0, 49.1], [3, 59.8], [6, 65.7], [9, 70.1], [12, 74.0], [18, 80.7], [24, 85.7], [30, 89.9], [36, 93.9],
]

// 体重（kg）中位数锚点
const WT_BOYS: Anchor = [
  [0, 3.3], [1, 4.5], [2, 5.6], [3, 6.4], [4, 7.0], [5, 7.5], [6, 7.9], [7, 8.3], [8, 8.6], [9, 8.9],
  [10, 9.2], [11, 9.4], [12, 9.6], [18, 11.3], [24, 12.7], [30, 13.9], [36, 14.9],
]
const WT_GIRLS: Anchor = [
  [0, 3.2], [1, 4.2], [2, 5.1], [3, 5.8], [4, 6.4], [5, 6.9], [6, 7.3], [7, 7.6], [8, 7.9], [9, 8.2],
  [10, 8.5], [11, 8.7], [12, 8.9], [18, 10.7], [24, 12.0], [30, 13.2], [36, 14.1],
]

// 身长百分位系数（P3/P97 相对中位数的比例）
const LEN_P3 = 0.945
const LEN_P97 = 1.058
// 体重百分位系数
const WT_P3 = 0.78
const WT_P97 = 1.25

function interp(anchors: Anchor, m: number): number {
  if (m <= anchors[0][0]) return anchors[0][1]
  for (let i = 1; i < anchors.length; i++) {
    const [m1, v1] = anchors[i]
    if (m <= m1) {
      const [m0, v0] = anchors[i - 1]
      return v0 + ((v1 - v0) * (m - m0)) / (m1 - m0)
    }
  }
  return anchors[anchors.length - 1][1]
}

export interface WhoCurve {
  months: number[]
  p3: number[]
  p50: number[]
  p97: number[]
}

const ALL_MONTHS = Array.from({ length: 37 }, (_, i) => i)

function buildCurve(anchors: Anchor, p3k: number, p97k: number): WhoCurve {
  return {
    months: ALL_MONTHS,
    p3: ALL_MONTHS.map((m) => +(interp(anchors, m) * p3k).toFixed(1)),
    p50: ALL_MONTHS.map((m) => +interp(anchors, m).toFixed(1)),
    p97: ALL_MONTHS.map((m) => +(interp(anchors, m) * p97k).toFixed(1)),
  }
}

export const WHO_LENGTH = {
  male: buildCurve(LEN_BOYS, LEN_P3, LEN_P97),
  female: buildCurve(LEN_GIRLS, LEN_P3, LEN_P97),
}

export const WHO_WEIGHT = {
  male: buildCurve(WT_BOYS, WT_P3, WT_P97),
  female: buildCurve(WT_GIRLS, WT_P3, WT_P97),
}

export const WHO_NOTE =
  '百分位曲线为 WHO 2006 生长标准的近似插值，仅供居家参考；确切评估请以儿保门诊为准。'
