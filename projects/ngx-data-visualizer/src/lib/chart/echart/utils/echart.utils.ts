import { EChartsOption } from 'echarts';

/**
 * Función para generar una clave única para el cache basada en el estado actual
 * @param state - Estado actual del gráfico
 * @returns Clave del cache
 */
export function generateCacheKey(state: {
  series: any[];
  maxValue: number;
  toPercent: boolean;
  totals: number[];
}): string {
  return JSON.stringify(state);
}

/**
 * Función para formatear valores numéricos
 * @param value - Valor a formatear
 * @param decimals - Número de decimales
 * @param suffix - Sufijo opcional
 * @returns Valor formateado
 */
export function formatValue(value: number, decimals: number = 0, suffix: string = ''): string {
  return `${value.toFixed(decimals)}${suffix}`;
}

/**
 * Función para calcular el espacio necesario para los nombres en el eje
 * @param maxLength - Longitud máxima del texto
 * @returns Espacio necesario en píxeles
 */
export function calculateNameGap(maxLength: number): number {
  return Math.max(30, maxLength * 8);
}

/**
 * Función para combinar opciones de configuración
 * @param defaultOptions - Opciones por defecto
 * @param customOptions - Opciones personalizadas
 * @returns Opciones combinadas
 */
export function mergeOptions(defaultOptions: EChartsOption, customOptions: Partial<EChartsOption>): EChartsOption {
  return { ...defaultOptions, ...customOptions };
} 