import {AfterViewInit, Component, OnInit} from '@angular/core';
import {NzModalRef, NzModalService} from "ng-zorro-antd/modal";
import {NzMessageService} from "ng-zorro-antd/message";
import BpmnModeler from 'bpmn-js/lib/Modeler';
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule
} from 'bpmn-js-properties-panel/dist/index.js';
import {EditToolsComponent} from "../edit-tools/edit-tools.component";
import {ActivatedRoute, Router} from "@angular/router";
import {ElectronService} from "../../service/electron.service";
import {TitleService} from "../../service/title.service";
import {NzSpinComponent, NzSpinModule} from "ng-zorro-antd/spin";
import { CustomContextPadProvider } from './custom-context-pad-provider.service';
import { NgIf } from '@angular/common';


@Component({
  selector: 'app-designer-ui',
  standalone: true,
  imports: [
    EditToolsComponent,
    NgIf,
    NzSpinComponent,
    NzSpinModule
  ],
  providers: [Router, NzMessageService, NzModalService, ElectronService],
  templateUrl: './designer-ui.component.html',
  styleUrl: './designer-ui.component.less'
})
export class DesignerUiComponent implements OnInit, AfterViewInit {
  static readonly defaultXML = `<?xml version="1.0" encoding="UTF-8"?>
  <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:mobius="http://mobius.org/schema/1.0/bpmn" targetNamespace="http://bpmn.io/schema/bpmn" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:Process id="MBP_1" name="Process_1" isExecutable="true">
    <bpmn2:startEvent id="Event_1" />
  </bpmn2:Process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="MBP_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="Event_1">
        <dc:Bounds x="412" y="240" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

  bpmn_input: string = DesignerUiComponent.defaultXML;
  public modeler: any;
  public state = {
    scale: 1 // diagram zoom rate
  };
  // the nearest saved XML
  previousXml: string = DesignerUiComponent.defaultXML;
  filePath: any = null;
  confirmNewModal?: NzModalRef;
  isFileChanged = false;
  isPublishing = false; // if the process is being published
  private changeTrackingSetup = false; // Flag to track if change tracking is already set up

  constructor(private readonly messageService: NzMessageService,
              private readonly modalService: NzModalService,
              private readonly electronService: ElectronService,
              private readonly titleService: TitleService,
              private readonly router: Router,
              private readonly route: ActivatedRoute,
  ) {
    // Check if there is a state with file data
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['file']) {
      const file = navigation.extras.state['file'];
      this.filePath = file.path;
      this.bpmn_input = file.content;
      
      // Update window title with the file from navigation state
      this.titleService.setCurrentFile(file.path);
    }
  }

  ngOnInit() {
    this.modeler = new BpmnModeler({
      container: '#el',
      width: '100%',
      height: '100%',
      propertiesPanel: {
        parent: '#js-properties-panel'
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        {
          __init__: ['customContextPadProvider'],
          customContextPadProvider: ['type', CustomContextPadProvider]
        }
      ]
    });
    this.modeler.importXML(this.bpmn_input).then(() => {
      // Get the current XML after import to set as baseline
      this.modeler.saveXML({ format: true }).then((result: any) => {
        this.previousXml = result.xml;
        this.isFileChanged = false;
        
        // Set up change tracking only once after initial import
        if (!this.changeTrackingSetup) {
          setTimeout(() => {
            this.setupChangeTracking();
            this.changeTrackingSetup = true;
          }, 500); // Give some time for the modeler to fully initialize
        }
      });
    }).catch((err: any) => {
      console.error("Error importing XML", err);
    });

    (window as any).electronAPI.onFileOpened((_event: any, munu: string,
                                              data: { path: string; content: string }) => {
      this.filePath = data.path;
      this.bpmn_input = data.content;
      this.modeler.importXML(this.bpmn_input).then(() => {
        // Get the current XML after import to set as baseline
        this.modeler.saveXML({ format: true }).then((result: any) => {
          this.previousXml = result.xml;
          this.isFileChanged = false;
          
          // Update window title with the opened file
          this.titleService.setCurrentFile(data.path);
        });
      });
    });

    (window as any).electronAPI.onMenuAction((event: any, action: string, data: string) => {
      if (action === 'newBpmn') {
        this.handleNew();
      } else if (action === 'save') {
        this.handleSave();
      } else if (action === 'saveAs') {
        this.handleSaveAs();
      } else if (action === 'exportAs') {
        this.handleExportAs();
      } else if (action === 'undo') {
        this.handleUndo();
      } else if (action === 'redo') {
        this.handleRedo();
      } else if (action === 'copy') {
        this.copyFile();
      } else if (action === 'paste') {
        this.pasteFile(data);
      } else if (action === 'zoomIn') {
        this.handleZoom(0.1);
      } else if (action === 'zoomOut') {
        this.handleZoom(-0.1);
      } else if (action === 'zoomActual') {
        this.handleZoom(0);
      } else if (action === 'zoomFit') {
        this.handleZoom(0);
      } else if (action === 'fullscreen') {
        this.handleZoom(1);
      } else if (action === 'documentation') {
        this.router.navigate(['/']);
      } else if (action === 'reportIssue') {
        this.router.navigate(['/reportIssue']);
      } else if (action === 'about') {
        this.showAbout();
      }
    });
  }

  ngAfterViewInit() {
    // Change detection is now handled in setupChangeTracking()
  }

  isExpanded = false; // Initial state of the drawer

  togglePanel() {
    // update css of properties-panel per the state of the isExpanded
    let propertiesPanel = document.getElementById('js-properties-panel');
    if (propertiesPanel) {
      if (this.isExpanded) {
        propertiesPanel.style.width = '300px';
      } else {
        propertiesPanel.style.width = '0px';
      }
    }
    this.isExpanded = !this.isExpanded;
  }

  handleImport() {
    if (this.isFileChanged) {
      this.openSaveConfirmModal().then((action) => {
        if (action === 'save') {
          this.handleSave(true);
        } else if (action === 'dontSave') {
          //this.importDefault();
          this.electronImport();
        } else {
          // Cancel action
        }
      }).catch((err) => {
        console.error('Error saving XML', err);
      });
    } else {
      this.electronImport();
    }
  }

  handleDuplicate() {
    this.modeler.saveXML({format: true}).then((result: any) => {
      const {xml} = result;
      this.duplicateProcess(xml);
    }).catch((err: any) => {
      console.error('Error saving XML', err);
    });
  }

  private duplicateProcess(xml: string) {
    if (this.isFileChanged) { // if the current process is changed
      this.confirmNewModal = this.modalService.confirm({
        nzClosable: false,
        nzTitle: 'Do you want to save it before duplicate?',
        nzOnOk: () => {
          // Determine default filename for duplicate
          let defaultFileName = 'bpmn';
          if (this.filePath) {
            // Extract filename from file path using JavaScript string methods
            const fullFileName = this.filePath.split(/[\\/]/).pop() || 'bpmn.xml';
            const nameWithoutExtension = fullFileName.replace(/\.[^.]+$/, '');
            defaultFileName = nameWithoutExtension || 'bpmn';
          }
          
          this.electronService.downloadProcess(xml, defaultFileName).then((res) => {
            if (res.success) {
              this.messageService.success('File is saved');
              this.modeler.importXML(xml);
              this.previousXml = xml;
              this.isFileChanged = false;
            } else {
              this.messageService.error('The file is not saved');
            }
          });
          this.confirmNewModal?.destroy();
        },
        nzOnCancel: () => { // if cancelled, duplicate the current process and change the isModified to false
          this.confirmNewModal?.destroy();
          this.isFileChanged = false;
        }
      });
    } else {
      this.messageService.success('The file is copied');

    }
  }

  importDefault() {
    this.modeler.importXML(DesignerUiComponent.defaultXML).then(() => {
      // Get the current XML after import to set as baseline
      this.modeler.saveXML({ format: true }).then((result: any) => {
        this.previousXml = result.xml;
        this.isFileChanged = false;
        this.filePath = null;
        this.titleService.clearCurrentFile(); // Clear the title when creating new file
      });
    });
  }

  handleNew() {
    if (this.isFileChanged) { // if the current process is changed
      this.openSaveConfirmModal().then((action) => {
        if (action === 'save') {
          this.handleSave(true);
        } else if (action === 'dontSave') {
          this.importDefault();
        } else {
          // Cancel action
        }
      }).catch((err) => {
        console.error('Error saving XML', err);
      });
    } else {
      this.importDefault();
    }
  }

  handleSave(openDefault: boolean = false) {
    if (this.filePath) {
      this.modeler.saveXML({format: true}).then((result: any) => {
        const {xml} = result;
        this.electronService.saveChanges(this.filePath, xml).then((res) => {
          if (res.success) {
            this.isFileChanged = false;
            this.previousXml = xml; // Update the previous XML
            this.titleService.setModified(false); // Update title to remove asterisk
            this.messageService.success(res.message);
            if(openDefault) {
              this.importDefault();
            }
          } else {
            this.messageService.error(res.error);
          }
        });
      });
    } else {
      this.handleSaveAs();
    }
  }

  handleSaveAs() {
    this.modeler.saveXML({format: true}).then((result: any) => {
      const {xml} = result;
      
      // Determine default filename
      let defaultFileName = 'bpmn';
      if (this.filePath) {
        // Extract filename from file path using JavaScript string methods
        const fullFileName = this.filePath.split(/[\\/]/).pop() || 'bpmn.xml';
        const nameWithoutExtension = fullFileName.replace(/\.[^.]+$/, '');
        defaultFileName = nameWithoutExtension || 'bpmn';
      }
      
      this.electronService.downloadProcess(xml, defaultFileName).then((res) => {
        if (res.success) {
          if (!res.canceled) {
            this.isFileChanged = false;
            this.filePath = res.path;
            this.previousXml = xml; // Update the previous XML
            this.titleService.setCurrentFile(res.path); // Update title with new file
            this.messageService.success(res.message);
          } else {
            this.messageService.warning(res.message);
          }
        } else {
          this.messageService.error(res.error);
        }
      });
    });
  }

  handleRedo = () => {
    this.modeler.get('commandStack').redo();
  };

  handleUndo = () => {
    this.modeler.get('commandStack').undo();
  };

  handleZoom = (radio: number) => {
    const newScale = !radio
      ? 1.0 // no radio no change
      : this.state.scale + radio <= 0.2
        ? 0.2 // the minimum zoom rate is 0.2
        : this.state.scale + radio;
    this.modeler.get('canvas').zoom('fit-viewport', 'auto');
    this.modeler.get('canvas').zoom(newScale);
    this.state.scale = newScale;
  };

  handlePublish() {
    this.isPublishing = true; // Show the spinner
    setTimeout(() => {
      this.isPublishing = false; // Hide the spinner after the process is completed
      this.messageService.info("The process is published");
    }, 2000); // Simulate a delay for the publishing process
  }

  getFileName(): string | null {
    if (!this.filePath) return null;
    const parts = this.filePath.split('/');
    return parts[parts.length - 1];
  }

  handleExportAs() {
    this.modeler.saveSVG({format: true}).then((result: any) => {
      const {svg} = result;
      let fileName = this.getFileName();
      if (fileName) {
        fileName = fileName.substring(0, fileName!.indexOf('.'));
      }
      let data = {"svg": svg, "fileName": fileName};
      this.electronService.exportAs(data).then((res) => {
        if (res.success) {
          if (!res.canceled) {
            this.messageService.success(res.message);
          }
        } else {
          this.messageService.error(res.error);
        }
      });
    }).catch(function (err: any) {
      console.error('Error happens when downloading SVG', err);
    });
  }

  handleDownloadPdf() {
    this.modeler.saveSVG({format: true}).then((result: any) => {
      const {svg} = result;
      let fileName = this.getFileName();
      if (fileName) {
        fileName = fileName.substring(0, fileName!.indexOf('.'));
      }
      let data = {"svg": svg, "fileName": fileName};
      this.electronService.exportAsPdf(data).then((res) => {
        if (res.success) {
          if (!res.canceled) {
            this.messageService.success(res.message);
          }
        } else {
          this.messageService.error(res.error);
        }
      });
    }).catch(function (err: any) {
      console.error('Error happens when downloading PDF', err);
    });
  }

  copyFile() {
    // get the element the current pointer selected
    const selection = this.modeler.get('selection');
    const selected = selection.get()[0];
    if (selected !== undefined) {
      const bo = selected.businessObject;
      // add x and y to the business object from selected element
      bo.x = selected.x;
      bo.y = selected.y;
      const json = JSON.stringify(bo);

      this.electronService.copyFile(json).then((res) => {
        if (!res.success) {
          this.messageService.error(res.error);
        }
      });
    }
  }

  private pasteFile(raw: string) {
    try {
      const bo = JSON.parse(raw); // one single element's businessObject
      const moddle = this.modeler.get('moddle');
      const elementFactory = this.modeler.get('elementFactory');
      const modeling = this.modeler.get('modeling');
      const canvas = this.modeler.get('canvas');
      const rootElement = canvas.getRootElement();
      const ts = new Date().getTime();
      const newId = 'Copied_' + bo['id'] + '_' + ts;

      // Create a new businessObject based on the stored one
      const newBo = moddle.create(bo.$type, {
        ...bo,
        id: newId
      });

      // Create a shape from the businessObject
      const newShape = elementFactory.createShape({
        type: newBo.$type,
        businessObject: newBo
      });

      // Add to the canvas
      modeling.createShape(newShape, {x: bo.x + 80, y: bo.y + 80}, rootElement);

    } catch (err) {
      console.error('Paste failed:', err);
    }
  }

  private electronImport() {
    this.electronService.selectFile().then(result => {
      if (result && !result.canceled) {
        // this.ngZone.run(() => {
        this.filePath = result.path;
        this.bpmn_input = result.content;
        this.modeler.importXML(this.bpmn_input).then(() => {
          // Get the current XML after import to set as baseline
          this.modeler.saveXML({ format: true }).then((xmlResult: any) => {
            this.previousXml = xmlResult.xml;
            this.isFileChanged = false;
            
            // Update window title with the imported file
            this.titleService.setCurrentFile(result.path);
            
            // Add to recent files when file is opened
            this.electronService.addRecentFile(result.path).then(() => {
            }).catch(error => {
              console.error('Error adding file to recent files:', error);
            });
          });
        });
        // });
      }
    });
  }

  showAbout() {
    this.electronService.showAboutDialog().then(() => {
    }).catch(error => {
      console.error('Error showing about dialog:', error);
    });
  }

  /**
   * Set up change tracking for the BPMN modeler
   */
  setupChangeTracking() {
    // Track changes to the BPMN modeler
    this.modeler.on('commandStack.changed', () => {
      this.modeler.saveXML({ format: true }).then((result: any) => {
        const currentXml = result.xml;
        const hasChanged = currentXml !== this.previousXml;
        
        if (hasChanged !== this.isFileChanged) {
          this.isFileChanged = hasChanged;
          this.titleService.setModified(hasChanged);
        }
      });
    });
  }

  /**
   * Open a confirmation modal for save actions
   */
  openSaveConfirmModal(): Promise<'save' | 'dontSave' | 'cancel'> {
    return new Promise((resolve) => {
      this.confirmNewModal = this.modalService.create({
        nzTitle: 'Do you want to save changes?',
        nzContent: 'Please choose an action.',
        nzClosable: false,
        nzFooter: [
          {
            label: 'Save',
            type: 'primary',
            onClick: () => {
              this.confirmNewModal?.destroy();
              resolve('save');
            }
          },
          {
            label: "Don't Save",
            danger: true,
            onClick: () => {
              this.confirmNewModal?.destroy();
              resolve('dontSave');
            }
          },
          {
            label: 'Cancel',
            onClick: () => {
              this.confirmNewModal?.destroy();
              resolve('cancel');
            }
          }
        ]
      });
    });
  }
}
