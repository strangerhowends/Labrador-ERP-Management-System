export interface CajaInput {
  fecha: string;
  total_contado: number;
  fondo_siguiente_dia: number;
  egresos_retiros: number;
  otros_ingresos: number;
}

export interface CajaRecord extends CajaInput {
  id: string;
  ingreso_neto_caja_fuerte: number;
  saldo_acumulado_final: number;
}
