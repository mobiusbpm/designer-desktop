import {Inject, Injectable} from '@angular/core';
import ContextPad from "diagram-js/lib/features/context-pad/ContextPad";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";
import ElementFactory from "diagram-js/lib/core/ElementFactory";
import Create from "diagram-js/lib/features/create/Create";
import {Translate} from "bpmn-js/lib/features/context-pad/ContextPadProvider";
import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

const colorPickerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor">
  <path d="m12.5 5.5.3-.4 3.6-3.6c.5-.5 1.3-.5 1.7 0l1 1c.5.4.5 1.2 0 1.7l-3.6 3.6-.4.2v.2c0 1.4.6 2 1 2.7v.6l-1.7 1.6c-.2.2-.4.2-.6 0L7.3 6.6a.4.4 0 0 1 0-.6l.3-.3.5-.5.8-.8c.2-.2.4-.1.6 0 .9.5 1.5 1.1 3 1.1zm-9.9 6 4.2-4.2 6.3 6.3-4.2 4.2c-.3.3-.9.3-1.2 0l-.8-.8-.9-.8-2.3-2.9" />
</svg>`;

@Injectable({
  providedIn: 'root'
})
export class CustomContextPadProvider {
  contextPad: ContextPad;
  modeling: Modeling;
  elementFactory: ElementFactory;
  create: Create;
  translate: Translate;

  static $inject = ['contextPad', 'modeling', 'elementFactory',
    'create'];

  constructor(@Inject('contextPad') contextPad: any,
              @Inject('modeling') modeling: any,
              @Inject('elementFactory') elementFactory: any,
              @Inject('create') create: any,
              @Inject('translate') translate: any) {
    this.contextPad = contextPad;
    this.modeling = modeling;
    this.elementFactory = elementFactory;
    this.create = create;
    this.translate = translate;
    contextPad.registerProvider(this);
  }

  applyColorToElement(element: any, color: string) {
    try {
      // Check if this is a text annotation
      if (element.type === 'bpmn:TextAnnotation') {
        // Text annotations don't support fill color, only stroke and text styling
        this.modeling.setColor(element, {
          stroke: color,
          fill: 'transparent'
        });
        return;
      }
      
      // Check if this is a group element
      if (element.type === 'bpmn:Group') {
        // Groups typically only support stroke color, not fill
        this.modeling.setColor(element, {
          stroke: color,
          fill: 'transparent'
        });
        return;
      }
      
      // For other elements, apply both fill and stroke
      this.modeling.setColor(element, {
        fill: color,
        stroke: 'black'
      });
    } catch (error) {
      console.warn('Unable to apply color to element:', element.type, error);
      // Fallback: try just setting stroke color for problematic elements
      try {
        this.modeling.setColor(element, {
          stroke: color
        });
      } catch (fallbackError) {
        console.error('Failed to apply color to element:', element.type, fallbackError);
      }
    }
  }

  getContextPadEntries(element: any) {
    // Only show color picker for elements that support coloring
    const colorableElements = [
      'bpmn:Task',
      'bpmn:UserTask',
      'bpmn:ServiceTask',
      'bpmn:ScriptTask',
      'bpmn:BusinessRuleTask',
      'bpmn:SendTask',
      'bpmn:ReceiveTask',
      'bpmn:ManualTask',
      'bpmn:CallActivity',
      'bpmn:SubProcess',
      'bpmn:StartEvent',
      'bpmn:EndEvent',
      'bpmn:IntermediateThrowEvent',
      'bpmn:IntermediateCatchEvent',
      'bpmn:BoundaryEvent',
      'bpmn:Gateway',
      'bpmn:ExclusiveGateway',
      'bpmn:InclusiveGateway',
      'bpmn:ParallelGateway',
      'bpmn:EventBasedGateway',
      'bpmn:ComplexGateway',
      'bpmn:DataObjectReference',
      'bpmn:DataStoreReference',
      'bpmn:Participant',
      'bpmn:Lane',
      'bpmn:TextAnnotation',
      'bpmn:Group'
    ];

    // Check if the current element supports coloring
    if (!colorableElements.includes(element.type)) {
      return {};
    }

    return {
      'color-picker': {
        group: 'edit', // which group (edit, model, etc.)
        className: 'bpmn-icon-color', // icon class name
        title: 'Fill Color', //this.translate('Fill Color'),
        html: `<div class="entry">${colorPickerSvg}</div>`,
        action: {
          click: (event: any, element: any) => {
            this.openColorPanel(element, event.currentTarget);
          }
        }
      }
    };
  }

  openColorPanel(element: any, anchorEl: HTMLElement) {
    // Remove existing color panels if any
    const existingPanel = document.querySelector('.custom-color-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    // Define your 8 specific colors
    const colors = [
      '#f15b71ff', '#FFFFC5', '#DAF7A6', '#f4a677',
      '#b1d4e0', '#f0e3fe', '#b8f3d4', '#FFFFFF'
    ];

    const panel = document.createElement('div');
    panel.className = 'custom-color-panel';

    panel.style.position = 'absolute';
    const rect = anchorEl.getBoundingClientRect();
    panel.style.top = rect.bottom + 5 + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.background = '#fff';
    panel.style.border = '1px solid #ccc';
    panel.style.padding = '5px';
    panel.style.display = 'flex';
    panel.style.flexWrap = 'wrap';
    panel.style.zIndex = '1000';

    // Create color options
    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.style.width = '20px';
      colorOption.style.height = '20px';
      colorOption.style.margin = '5px';
      colorOption.style.background = color;
      colorOption.style.cursor = 'pointer';
      colorOption.style.borderRadius = '3px';
      colorOption.style.border = '1px solid #666';

      colorOption.addEventListener('click', () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        panel.remove();
        this.applyColorToElement(element, color);

      });

      panel.appendChild(colorOption);
    });

    document.body.appendChild(panel);

    // Add event listener to close the panel when clicking outside
    const handleOutsideClick = (event: MouseEvent) => {
      if (!panel.contains(event.target as Node)) {
        panel.remove();
        document.removeEventListener('mousedown', handleOutsideClick);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

  }

}
