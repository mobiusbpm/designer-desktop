import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor() { }

  selectFile(): Promise<any> {
    return (window as any).electronAPI.selectFile();
  }

  downloadProcess(xml: string, defaultFileName?: string): Promise<any> {
    return (window as any).electronAPI.downloadProcess(xml, defaultFileName);
  }

  downloadSvg(svg: any): Promise<any> {
    return (window as any).electronAPI.downloadSvg(svg);
  }

  exportAs(data: any): Promise<any> {
    return (window as any).electronAPI.exportAs(data);
  }

  exportAsPdf(data: any): Promise<any> {
    return (window as any).electronAPI.exportAsPdf(data);
  }

  saveChanges(path: string, xml: string): Promise<any> {
    return (window as any).electronAPI.saveChanges(path, xml);
  }

  copyFile(xml: string): Promise<any> {
    return (window as any).electronAPI.copyFile(xml);
  }

  updateWindowTitle(fileName: string | null, isModified: boolean = false): Promise<any> {
    return (window as any).electronAPI.updateWindowTitle(fileName, isModified);
  }

  getWindowTitle(): Promise<any> {
    return (window as any).electronAPI.getWindowTitle();
  }

  // Recent files management
  getRecentFiles(): Promise<any> {
    return (window as any).electronAPI.getRecentFiles();
  }

  addRecentFile(filePath: string): Promise<any> {
    return (window as any).electronAPI.addRecentFile(filePath);
  }

  removeRecentFile(filePath: string): Promise<any> {
    return (window as any).electronAPI.removeRecentFile(filePath);
  }

  openRecentFile(filePath: string): Promise<any> {
    return (window as any).electronAPI.openRecentFile(filePath);
  }

  showAboutDialog(): Promise<any> {
    return (window as any).electronAPI.showAboutDialog();
  }
}
