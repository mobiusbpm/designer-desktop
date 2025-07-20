import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import { ElectronService } from './pages/service/electron.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule, NzRowDirective, NzColDirective],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit{
  constructor(private router: Router, private electronService: ElectronService) {}

  ngOnInit() {
    // Listen for menu actions
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onMenuAction((_event: any, action: string) => {
        if (action === 'newBpmn') {
         // check if the url is 'designer'
        } else if (action === 'openDesigner') {
          this.openDesigner();
        } else if (action === 'about') {
          this.showAbout();
        }
      });
    }
  }

  allProjects() {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/projects']));
    (window as any).electronAPI.navigate(url);

  }

  newProject() {
    alert('New Project');
  }

  allProcesses() {
    alert('All Processes');
  }

  newProcess() {
    alert('New Process');
  }

  openDesigner() {
    alert('Open Designer');
  }

  showAbout() {
    this.electronService.showAboutDialog().then(() => {
    }).catch(error => {
      console.error('Error showing about dialog:', error);
    });
  }
}
