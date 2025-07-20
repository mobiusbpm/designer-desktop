import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  { path: 'home', loadChildren: () => import('./pages/home/home.routes').then(m => m.HOME_ROUTES) },
  { path: 'designer', loadChildren: () => import('./pages/designer/designer.routes').then(m => m.DESIGNER_ROUTES) },
];
