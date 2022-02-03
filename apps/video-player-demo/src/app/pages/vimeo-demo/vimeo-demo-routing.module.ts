import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VimeoDemoComponent } from './vimeo-demo.component';

const routes: Routes = [{ path: '', component: VimeoDemoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VimeoDemoRoutingModule { }
