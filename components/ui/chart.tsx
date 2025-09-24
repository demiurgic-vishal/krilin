"use client"

// This is a simplified chart component that wraps recharts
// Install recharts: npm install recharts

import {
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer as RechartsResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell
} from "recharts"

export const LineChart = RechartsLineChart
export const Line = RechartsLine
export const BarChart = RechartsBarChart
export const Bar = RechartsBar
export const XAxis = RechartsXAxis
export const YAxis = RechartsYAxis
export const CartesianGrid = RechartsCartesianGrid
export const Tooltip = RechartsTooltip
export const Legend = RechartsLegend
export const ResponsiveContainer = RechartsResponsiveContainer
export const PieChart = RechartsPieChart
export const Pie = RechartsPie
export const Cell = RechartsCell

// Types
export type PieProps = {
  cx?: string | number;
  cy?: string | number;
  dataKey: string;
  nameKey?: string;
  data?: Array<any>;
  label?: boolean | Function;
  labelLine?: boolean | Function;
  activeIndex?: number[];
  activeShape?: React.ReactElement | Function;
  outerRadius?: number | string;
  innerRadius?: number | string;
  paddingAngle?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}
