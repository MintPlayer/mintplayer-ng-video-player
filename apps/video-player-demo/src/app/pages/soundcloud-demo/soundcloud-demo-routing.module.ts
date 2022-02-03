import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SoundcloudDemoComponent } from './soundcloud-demo.component';

const routes: Routes = [{ path: '', component: SoundcloudDemoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SoundcloudDemoRoutingModule { }
