import {Component, NgZone, OnInit} from '@angular/core';
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import {NzButtonGroupComponent} from "ng-zorro-antd/button";
import {NgOptimizedImage} from "@angular/common";
import {Router} from "@angular/router";
import {ElectronService} from "../service/electron.service";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NzRowDirective,
    NzColDirective,
    NzButtonGroupComponent,
    NgOptimizedImage
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.less'
})
export class HomeComponent implements OnInit {
  router: Router;
  electronService: ElectronService;
  constructor(router: Router, private ngZone: NgZone,
              electronService: ElectronService) {
    this.router = router;
    this.electronService = electronService;
  }

  ngOnInit(): void {
    (window as any).electronAPI.onMenuAction((event: any, action: string) => {
      this.ngZone.run(() => {
        if (action === 'newBpmn') {
          this.newDiagram();
        } else if (action === 'openFile') {
          this.import();
        } else if (action === 'about') {
          this.showAbout();
        }
      });
    });

    // Listen for file opened events (including recent files)
    (window as any).electronAPI.onFileOpened((_event: any, menu: string, data: { path: string; content: string }) => {
      this.ngZone.run(() => {
        // Add to recent files when file is opened
        this.electronService.addRecentFile(data.path).then(() => {
          console.log('File added to recent files:', data.path);
        }).catch(error => {
          console.error('Error adding file to recent files:', error);
        });
        
        // Navigate to designer with the file data
        this.router.navigate(['designer'], { state: { file: data } });
      });
    });
  }

  newDiagram() {
    this.router.navigate(['designer']);
  }

  import() {
    this.electronService.selectFile().then(result => {
      if (result && !result.canceled) {
        // Add to recent files when file is opened
        this.electronService.addRecentFile(result.path).then(() => {
          console.log('File added to recent files:', result.path);
        }).catch(error => {
          console.error('Error adding file to recent files:', error);
        });
        
        this.router.navigate(['designer'], { state: { file: result } });
      }
    });
  }

  showAbout() {
    this.electronService.showAboutDialog().then(() => {
      console.log('About dialog shown');
    }).catch(error => {
      console.error('Error showing about dialog:', error);
    });
  }
}
