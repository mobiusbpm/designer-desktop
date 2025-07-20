import {Component, EventEmitter, Output} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";

@Component({
  selector: 'app-edit-tools',
  templateUrl: './edit-tools.component.html',
  standalone: true,
  imports: [
    NzIconDirective
  ],
  styleUrls: ['./edit-tools.component.less']
})
export class EditToolsComponent {
  @Output() onNew = new EventEmitter();
  @Output() onOpen = new EventEmitter();
  @Output() onUndo = new EventEmitter();
  @Output() onRedo = new EventEmitter();
  @Output() onZoomReset = new EventEmitter();
  @Output() onZoomIn = new EventEmitter();
  @Output() onZoomOut = new EventEmitter();
  @Output() onSave = new EventEmitter();
  @Output() onDownloadXml = new EventEmitter();
  @Output() onDownloadSvg = new EventEmitter();
  @Output() onPublish = new EventEmitter();
  @Output() onImport = new EventEmitter();
  @Output() onDuplicate = new EventEmitter();

  _onUndo() {
    this.onUndo.emit();
  }
  _onRedo() {
    this.onRedo.emit();
  }
  _onZoomReset() {
    this.onZoomReset.emit();
  }
  _onZoomIn() {
    this.onZoomIn.emit();
  }
  _onZoomOut() {
    this.onZoomOut.emit();
  }
  _onSave() {
    this.onSave.emit();
  }
  _onDownloadXml() {
    this.onDownloadXml.emit();
  }
  _onDownloadSvg() {
    this.onDownloadSvg.emit();
  }

  _onNew() {
    this.onNew.emit();
  }

  _onOpen() {
    this.onOpen.emit();
  }

  _onPublish() {
    this.onPublish.emit();
  }

  _onImport() {
    this.onImport.emit();
  }

  _onDuplicate() {
    this.onDuplicate.emit();
  }
}
