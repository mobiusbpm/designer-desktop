// src/app/pages/project/project.routes.ts
import { Routes } from '@angular/router';
import {DesignerUiComponent} from "./designer-ui/designer-ui.component";

export const DESIGNER_ROUTES: Routes = [
  { path: '', component: DesignerUiComponent },
  { path: 'import', component: DesignerUiComponent }
];
