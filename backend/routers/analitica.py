from fastapi import APIRouter, HTTPException
from database import db_conexion
from datetime import datetime
router = APIRouter(prefix="/analitica", tags=["Analitica y Proyecciones"])

#Filtra por Mes/Año según la fecha elegida)
@router.get("/tendencias")
def get_tendencias(filtro: str = 'mes', fecha: str = None):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    try:
        cursor = conexion.cursor(dictionary=True)
        
        # Descomponer la fecha que manda el HTML en formato YYYY-MM
        if fecha:
            anio_consulta = int(fecha.split("-")[0])
            mes_consulta = int(fecha.split("-")[1])
        else:
            hoy = datetime.now()
            anio_consulta = hoy.year
            mes_consulta = hoy.month
            
        datos_formateados = {"etiquetas": [], "ingresos": [], "volumen": []}

        if filtro == 'mes':
            # Filtra por el mes y año seleccionados
            sql = """
                SELECT 
                    DAY(fecha_hora_creacion) as dia,
                    SUM(monto_total) as ingresos_totales,
                    SUM(cantidad_garrafones) as volumen_garrafones
                FROM pedidos
                WHERE MONTH(fecha_hora_creacion) = %s 
                AND YEAR(fecha_hora_creacion) = %s
                AND estatus_entrega = 'Entregado'
                GROUP BY DAY(fecha_hora_creacion)
                ORDER BY dia ASC;
            """
            cursor.execute(sql, (mes_consulta, anio_consulta))
            
            for fila in cursor.fetchall():
                datos_formateados["etiquetas"].append(f"Día {fila['dia']}")
                datos_formateados["ingresos"].append(float(fila['ingresos_totales']) if fila['ingresos_totales'] else 0.0)
                datos_formateados["volumen"].append(int(fila['volumen_garrafones']) if fila['volumen_garrafones'] else 0)
                
        else:
            # Filtra por el año seleccionado
            sql = """
                SELECT 
                    MONTH(fecha_hora_creacion) as mes_db,
                    SUM(monto_total) as ingresos_totales,
                    SUM(cantidad_garrafones) as volumen_garrafones
                FROM pedidos
                WHERE YEAR(fecha_hora_creacion) = %s 
                AND estatus_entrega = 'Entregado'
                GROUP BY MONTH(fecha_hora_creacion)
                ORDER BY mes_db ASC;
            """
            cursor.execute(sql, (anio_consulta,))
            meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
            
            for fila in cursor.fetchall():
                indice = int(fila['mes_db']) - 1
                datos_formateados["etiquetas"].append(meses_nombres[indice])
                datos_formateados["ingresos"].append(float(fila['ingresos_totales']) if fila['ingresos_totales'] else 0.0)
                datos_formateados["volumen"].append(int(fila['volumen_garrafones']) if fila['volumen_garrafones'] else 0)

        return datos_formateados
    except Exception as e:
        print(f"Error en tendencias: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if conexion and conexion.is_connected(): conexion.close()

#Calculo para compra de inventario y meses de alta y baja demanda
@router.get("/insights")
def get_insights():
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    try:
        cursor = conexion.cursor(dictionary=True)
        
        # Sacamos el historial total agrupado por meses
        sql = """
            SELECT 
                MONTH(fecha_hora_creacion) as mes,
                SUM(cantidad_garrafones) as volumen
            FROM pedidos
            WHERE estatus_entrega = 'Entregado'
            GROUP BY MONTH(fecha_hora_creacion)
            ORDER BY volumen DESC;
        """
        cursor.execute(sql)
        resultados = cursor.fetchall()
        
        # Si la base de datos está vacía, evitamos errores
        if not resultados:
            return {
                "mayor": {"mes": "N/D", "detalle": "Sin datos suficientes"},
                "menor": {"mes": "N/D", "detalle": "Sin datos suficientes"},
                "prediccion": "El sistema necesita registrar más ventas para generar sugerencias operativas y de inventario."
            }
            
        meses_nombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        
        # El mes con más ventas (protegido con int() por si acaso)
        mes_mayor = resultados[0]
        nombre_mayor = meses_nombres[int(mes_mayor['mes']) - 1]
        vol_mayor = int(mes_mayor['volumen']) if mes_mayor['volumen'] else 0
        
        # El mes con menos ventas
        mes_menor = resultados[-1]
        nombre_menor = meses_nombres[int(mes_menor['mes']) - 1]
        vol_menor = int(mes_menor['volumen']) if mes_menor['volumen'] else 0

        # Lógica de Inteligencia de Negocios
        if len(resultados) == 1:
            prediccion = f"Tus operaciones se concentran actualmente en {nombre_mayor}. Mantén tu stock base de tapas y sellos hasta reunir al menos 2 meses de datos históricos para proyectar tendencias estacionales."
        else:
            mes_previo_pico = meses_nombres[int(mes_mayor['mes']) - 2] if int(mes_mayor['mes']) > 1 else "Diciembre"
            prediccion = f"{nombre_mayor} es tu pico de demanda. Se sugiere realizar compras de tapas y liner con anticipación durante {mes_previo_pico}. Por el contrario, la baja operativa de {nombre_menor} es el momento ideal para programar el lavado profundo de tanques y cambio de filtros sin afectar la producción."

        return {
            "mayor": {
                "mes": nombre_mayor,
                "detalle": f"Récord: {vol_mayor} garrafones desplazados."
            },
            "menor": {
                "mes": nombre_menor,
                "detalle": f"Baja: {vol_menor} garrafones desplazados."
            },
            "prediccion": prediccion
        }

    except Exception as e:
        print(f"Error en insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if conexion and conexion.is_connected(): conexion.close()