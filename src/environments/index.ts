import { environment as devEnvironment } from './environment.dev'
import { environment as prodEnvironment } from './environment.prod'

// Seleccionar el entorno apropiado
export const environment = import.meta.env.PROD ? prodEnvironment : devEnvironment
