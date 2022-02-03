import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DailymotionDemoComponent } from './dailymotion-demo.component';

const routes: Routes = [{ path: '', component: DailymotionDemoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DailymotionDemoRoutingModule { }
