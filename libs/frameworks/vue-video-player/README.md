# @mintplayer/vue-video-player

A Vue 3 wrapper for the framework agnostic `@mintplayer/video-player`. It wires up
all supported provider plugins and exposes a declarative component that mirrors the
APIs used by the Angular and React packages.

Formerly published as `@mintplayer/v-video-player` (18.x). To migrate, install this package and
replace `VVideoPlayer` with `VueVideoPlayer` (and `VVideoPlayerProps`/`VVideoPlayerEmits` likewise).
Its major version follows Vue's.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VueVideoPlayer } from '@mintplayer/vue-video-player';
import { EPlayerState } from '@mintplayer/player-provider';

const url = ref('https://www.youtube.com/watch?v=tt2k8PGm-TI');
const volume = ref(50);
const mute = ref(false);
const playerState = ref(EPlayerState.unstarted);
</script>

<template>
  <VueVideoPlayer
    :url="url"
    v-model:volume="volume"
    v-model:mute="mute"
    v-model:playerState="playerState"
  />
</template>
```

## Building

Run `nx build vue-video-player` to bundle the library with Vite.

## Running unit tests

Run `nx test vue-video-player` to execute the unit tests via [Vitest](https://vitest.dev/).
