import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ComponentRef, ElementRef, Injectable, inject } from '@angular/core';
import { Dataset } from '../../services/dataset';

export interface ConfigEditorOverlayOptions<TConfig> {
  elementRef: ElementRef;
  component: ComponentType<any>;
  dataset: Dataset;
  options: TConfig;
  onOptionsChange: (newOptions: TConfig) => void;
  onClose: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigEditorOverlayService {
  private readonly overlay = inject(Overlay);
  private nextZIndex = 1000; // Z-index base inicial para apilar editores

  create<TConfig>(config: ConfigEditorOverlayOptions<TConfig>): { overlayRef: OverlayRef; componentRef: ComponentRef<any> } {
    const overlayRef = this.overlay.create({
      hasBackdrop: false,
      panelClass: 'viz-config-editor-pane',
      scrollStrategy: this.overlay.scrollStrategies.reposition(), // Sigue al elemento en scroll
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(config.elementRef.nativeElement)
        .withPush(false)
        .withFlexibleDimensions(false) // Previene redimensionamiento por CDK en paneles draggables
        .withPositions([
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'top',
            offsetX: -12,
            offsetY: 12
          }
        ])
    });

    const portal = new ComponentPortal(config.component);
    const componentRef = overlayRef.attach(portal);

    // Asignar inputs comunes
    componentRef.setInput('dataset', config.dataset);
    componentRef.setInput('options', config.options);

    // Gestión del Z-Index dinámico (traer al frente al interactuar)
    const paneElement = overlayRef.overlayElement;
    paneElement.style.zIndex = `${this.nextZIndex++}`;

    const bringToFront = () => {
      // Acotar y resetear z-index si supera un límite prudencial para evitar crecimiento ilimitado
      if (this.nextZIndex > 2000) {
        this.nextZIndex = 1000;
      }
      paneElement.style.zIndex = `${this.nextZIndex++}`;
    };

    const nativeEl = componentRef.location.nativeElement;
    nativeEl.addEventListener('mousedown', bringToFront);
    nativeEl.addEventListener('touchstart', bringToFront);

    // Suscripción a los outputs del componente dinámico
    const subOptions = componentRef.instance.optionsChange.subscribe((newOptions: TConfig) => {
      config.onOptionsChange(newOptions);
    });

    const subClose = componentRef.instance.close.subscribe(() => {
      config.onClose();
    });

    // Limpieza de recursos al destruir el componente dinámico (evita fugas de memoria en listeners y closures)
    componentRef.onDestroy(() => {
      nativeEl.removeEventListener('mousedown', bringToFront);
      nativeEl.removeEventListener('touchstart', bringToFront);
      subOptions.unsubscribe();
      subClose.unsubscribe();
    });

    return { overlayRef, componentRef };
  }
}
