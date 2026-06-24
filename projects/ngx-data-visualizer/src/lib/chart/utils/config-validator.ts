/**
 * Utilidad de validación de configuración que detecta claves obsoletas,
 * deprecadas o propiedades que no existen en la configuración esperada.
 */
export class ConfigValidator {
  /**
   * Valida un objeto de configuración contra un objeto de referencia y un mapa de propiedades obsoletas.
   * @param config Objeto de configuración a validar.
   * @param validReference Objeto de referencia con la estructura válida esperada.
   * @param deprecatedPaths Mapa de rutas de propiedades obsoletas (ej: 'legends.show') a mensajes de advertencia.
   * @param prefix Prefijo para los mensajes de log.
   */
  public static validate(
    config: Record<string, any>,
    validReference: Record<string, any>,
    deprecatedPaths: Record<string, string>,
    prefix = "[ngx-data-visualizer]"
  ): void {
    if (!config) return;

    // 1. Detectar propiedades deprecadas/obsoletas
    this.checkDeprecatedPaths(config, deprecatedPaths, prefix);

    // 2. Detectar propiedades que nunca existieron (desconocidas)
    this.checkUnknownProperties(config, validReference, "", prefix);
  }

  /**
   * Verifica si las rutas deprecadas se encuentran presentes en el objeto de configuración.
   */
  private static checkDeprecatedPaths(
    config: Record<string, any>,
    deprecatedPaths: Record<string, string>,
    prefix: string
  ): void {
    for (const path of Object.keys(deprecatedPaths)) {
      if (this.hasNestedProperty(config, path)) {
        console.warn(`${prefix} ${deprecatedPaths[path]}`);
      }
    }
  }

  /**
   * Verifica recursivamente si existen propiedades que no pertenecen al objeto de referencia.
   */
  private static checkUnknownProperties(
    config: Record<string, any>,
    reference: Record<string, any>,
    currentPath: string,
    prefix: string
  ): void {
    if (typeof config !== "object" || config === null || !reference) return;

    for (const key of Object.keys(config)) {
      const path = currentPath ? `${currentPath}.${key}` : key;

      // Si no existe en la referencia
      if (!(key in reference)) {
        console.warn(`${prefix} La propiedad "${path}" no es una propiedad válida de configuración.`);
        continue;
      }

      // Si es un objeto, validar recursivamente
      if (
        config[key] !== null &&
        typeof config[key] === "object" &&
        !Array.isArray(config[key]) &&
        reference[key] !== null &&
        typeof reference[key] === "object" &&
        !Array.isArray(reference[key])
      ) {
        this.checkUnknownProperties(config[key], reference[key], path, prefix);
      }
    }
  }

  /**
   * Determina de forma segura si un objeto tiene una propiedad anidada.
   */
  private static hasNestedProperty(obj: any, path: string): boolean {
    if (!obj) return false;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || typeof current !== "object" || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    return true;
  }
}
