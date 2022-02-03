import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VideoDemoComponent } from './video-demo.component';

const routes: Routes = [{ path: '', component: VideoDemoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VideoDemoRoutingModule { }
