// ===== 疫苗数据 =====
// 免费疫苗依据：《国家免疫规划疫苗儿童免疫程序及说明（2021年版）》（国卫疾控发〔2021〕10号）
// 仅收录 0-3 岁范围内的剂次；自费苗仅作参考，具体以社区接种门诊医生建议为准。
// 信息核对：2026-09

import type { VaccineDef } from '../types'

export const VACCINES: VaccineDef[] = [
  {
    code: 'HepB',
    name: '乙肝疫苗',
    prevent: '乙型病毒性肝炎',
    free: true,
    doses: [
      { doseNo: 1, month: 0 },
      { doseNo: 2, month: 1 },
      { doseNo: 3, month: 6 },
    ],
  },
  {
    code: 'BCG',
    name: '卡介苗',
    prevent: '结核病',
    free: true,
    note: '接种后 3-4 周局部红肿、化脓、结痂属正常反应',
    doses: [{ doseNo: 1, month: 0 }],
  },
  {
    code: 'IPV',
    name: '脊灰灭活疫苗',
    prevent: '脊髓灰质炎（小儿麻痹症）',
    free: true,
    doses: [
      { doseNo: 1, month: 2 },
      { doseNo: 2, month: 3 },
    ],
  },
  {
    code: 'bOPV',
    name: '脊灰减毒活疫苗（口服）',
    prevent: '脊髓灰质炎（小儿麻痹症）',
    free: true,
    note: '0-3 岁内接种第 1 剂（4 月龄），第 2 剂在 4 周岁',
    doses: [{ doseNo: 1, month: 4 }],
  },
  {
    code: 'DTaP',
    name: '百白破疫苗',
    prevent: '百日咳、白喉、破伤风',
    free: true,
    doses: [
      { doseNo: 1, month: 3 },
      { doseNo: 2, month: 4 },
      { doseNo: 3, month: 5 },
      { doseNo: 4, month: 18 },
    ],
  },
  {
    code: 'MPSV-A',
    name: 'A群流脑多糖疫苗',
    prevent: '流行性脑脊髓膜炎',
    free: true,
    doses: [
      { doseNo: 1, month: 6 },
      { doseNo: 2, month: 9 },
    ],
  },
  {
    code: 'MMR',
    name: '麻腮风疫苗',
    prevent: '麻疹、风疹、流行性腮腺炎',
    free: true,
    doses: [
      { doseNo: 1, month: 8 },
      { doseNo: 2, month: 18 },
    ],
  },
  {
    code: 'JE-L',
    name: '乙脑减毒活疫苗',
    prevent: '流行性乙型脑炎',
    free: true,
    doses: [
      { doseNo: 1, month: 8 },
      { doseNo: 2, month: 24 },
    ],
  },
  {
    code: 'HepA-L',
    name: '甲肝减毒活疫苗',
    prevent: '甲型病毒性肝炎',
    free: true,
    doses: [{ doseNo: 1, month: 18 }],
  },
  {
    code: 'MPSV-AC',
    name: 'A群C群流脑多糖疫苗',
    prevent: '流行性脑脊髓膜炎',
    free: true,
    note: '0-3 岁内接种第 1 剂（3 周岁），第 2 剂在 6 周岁',
    doses: [{ doseNo: 1, month: 36 }],
  },
  // ===== 自费苗（可选，仅供参考） =====
  {
    code: 'DTaP-IPV-Hib',
    name: '五联疫苗',
    prevent: '百日咳、白喉、破伤风、脊灰、b型流感嗜血杆菌',
    free: false,
    note: '可替代免费的 IPV + 百白破 + Hib，减少接种次数',
    doses: [
      { doseNo: 1, month: 2 },
      { doseNo: 2, month: 3 },
      { doseNo: 3, month: 4 },
      { doseNo: 4, month: 18 },
    ],
  },
  {
    code: 'PCV13',
    name: '13价肺炎球菌多糖结合疫苗',
    prevent: '肺炎球菌性疾病',
    free: false,
    doses: [
      { doseNo: 1, month: 2 },
      { doseNo: 2, month: 4 },
      { doseNo: 3, month: 6 },
      { doseNo: 4, month: 12 },
    ],
  },
  {
    code: 'RV5',
    name: '五价轮状病毒疫苗（口服）',
    prevent: '轮状病毒胃肠炎',
    free: false,
    note: '首剂须在 12 周龄内服用',
    doses: [
      { doseNo: 1, month: 2 },
      { doseNo: 2, month: 3 },
      { doseNo: 3, month: 4 },
    ],
  },
  {
    code: 'Hib',
    name: 'b型流感嗜血杆菌疫苗',
    prevent: 'b型流感嗜血杆菌感染（肺炎、脑膜炎等）',
    free: false,
    doses: [
      { doseNo: 1, month: 2 },
      { doseNo: 2, month: 3 },
      { doseNo: 3, month: 4 },
      { doseNo: 4, month: 18 },
    ],
  },
  {
    code: 'EV71',
    name: '肠道病毒71型灭活疫苗',
    prevent: '手足口病重症（EV71 感染）',
    free: false,
    doses: [
      { doseNo: 1, month: 6 },
      { doseNo: 2, month: 7 },
    ],
  },
  {
    code: 'VarV',
    name: '水痘减毒活疫苗',
    prevent: '水痘',
    free: false,
    note: '部分地区已纳入免费；上海需自费（2 剂）',
    doses: [
      { doseNo: 1, month: 12 },
      { doseNo: 2, month: 48 },
    ],
  },
  {
    code: 'IIV',
    name: '流感疫苗',
    prevent: '流行性感冒',
    free: false,
    note: '6 月龄起每年接种，建议每年 9-11 月接种当年流行季疫苗',
    doses: [
      { doseNo: 1, month: 6 },
      { doseNo: 2, month: 7 },
    ],
  },
]

export const VACCINE_NOTE =
  '免费疫苗依据《国家免疫规划疫苗儿童免疫程序及说明（2021年版）》；自费苗仅供参考，具体以社区接种门诊医生建议为准。'
