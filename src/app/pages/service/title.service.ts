import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private currentFileName = new BehaviorSubject<string | null>(null);
  private isModified = new BehaviorSubject<boolean>(false);

  public currentFileName$ = this.currentFileName.asObservable();
  public isModified$ = this.isModified.asObservable();

  constructor(private electronService: ElectronService) { }

  /**
   * Set the current file name
   * @param fileName - The full path or name of the file
   */
  setCurrentFile(fileName: string | null): void {
    this.currentFileName.next(fileName);
    this.isModified.next(false); // Reset modified state when opening a new file
    this.updateWindowTitle();
  }

  /**
   * Mark the current file as modified or saved
   * @param modified - Whether the file has been modified
   */
  setModified(modified: boolean): void {
    this.isModified.next(modified);
    this.updateWindowTitle();
  }

  /**
   * Get the current file name
   */
  getCurrentFileName(): string | null {
    return this.currentFileName.value;
  }

  /**
   * Get the modified state
   */
  getModifiedState(): boolean {
    return this.isModified.value;
  }

  /**
   * Update the window title through Electron IPC
   */
  private updateWindowTitle(): void {
    const fileName = this.currentFileName.value;
    const modified = this.isModified.value;
    
    this.electronService.updateWindowTitle(fileName, modified)
      .catch((error) => {
        console.error('Failed to update window title:', error);
      });
  }

  /**
   * Clear the current file (when closing or creating new)
   */
  clearCurrentFile(): void {
    this.currentFileName.next(null);
    this.isModified.next(false);
    this.updateWindowTitle();
  }
}
