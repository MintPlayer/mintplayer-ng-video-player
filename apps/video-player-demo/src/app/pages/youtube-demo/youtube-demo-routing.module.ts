import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { YoutubeDemoComponent } from './youtube-demo.component';

const routes: Routes = [{ path: '', component: YoutubeDemoComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class YoutubeDemoRoutingModule { }
