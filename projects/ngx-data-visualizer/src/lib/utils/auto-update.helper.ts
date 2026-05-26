import { effect } from "@angular/core";
import { debounceTime } from "rxjs/operators";
import { Dataset } from "../services/dataset";

/**
 * Función utilitaria que inyecta un efecto reactivo de Angular para escuchar
 * y actualizar de forma automatica cuando ocurren cambios internos de datos en el Dataset.
 * 
 * Gestiona de forma automatica y segura las suscripciones reactivas y respeta en caliente
 * la bandera `disableAutoUpdate` de las opciones del componente.
 *
 * @param datasetSignal Función lambda que devuelve el dataset a escuchar.
 * @param optionsSignal Función lambda que devuelve las opciones del componente conteniendo la bandera disableAutoUpdate.
 * @param callback Callback imperativo que se ejecuta tras la emisión de cambios.
 * @param debounceMs Tiempo de debounce opcional en milisegundos para evitar actualizaciones excesivas (ej: tabla pivot).
 */
export function injectAutoUpdate(
  datasetSignal: () => Dataset | null | undefined,
  optionsSignal: () => { disableAutoUpdate?: boolean } | null | undefined,
  callback: () => void,
  debounceMs: number = 0
): void {
  effect((onCleanup) => {
    const ds = datasetSignal();
    const opts = optionsSignal();

    if (ds && (!opts || !opts.disableAutoUpdate)) {
      let obs = ds.dataUpdated.asObservable();
      if (debounceMs > 0) {
        obs = obs.pipe(debounceTime(debounceMs));
      }
      const sub = obs.subscribe(() => {
        callback();
      });
      onCleanup(() => {
        sub.unsubscribe();
      });
    }
  }, { allowSignalWrites: true });
}
