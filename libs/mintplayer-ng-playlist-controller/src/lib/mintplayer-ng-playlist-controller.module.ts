import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistController } from './services';

@NgModule({
  imports: [CommonModule],
  providers: [
    PlaylistController
  ]
})
export class PlaylistControllerModule {}
