<template>
  <div class="v-video-player">
    <div ref="container"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { VideoPlayer } from '@mintplayer/video-player';
import { dailymotionPlugin } from '@mintplayer/dailymotion-player';
import { facebookPlugin } from '@mintplayer/facebook-player';
import { filePlugin } from '@mintplayer/file-player';
import { mixCloudPlugin } from '@mintplayer/mixcloud-player';
import { soundCloudPlugin } from '@mintplayer/soundcloud-player';
import { spotifyPlugin } from '@mintplayer/spotify-player';
import { streamablePlugin } from '@mintplayer/streamable-player';
import { twitchPlugin } from '@mintplayer/twitch-player';
import { vidyardPlugin } from '@mintplayer/vidyard-player';
import { vimeoPlugin } from '@mintplayer/vimeo-player';
import { wistiaPlugin } from '@mintplayer/wistia-player';
import { youtubePlugin } from '@mintplayer/youtube-player';
import { EPlayerState } from '@mintplayer/player-provider';
import type { VVideoPlayerEmits, VVideoPlayerProps } from './types';

const props = withDefaults(defineProps<VVideoPlayerProps>(), {
  volume: 0,
  mute: false,
  playerState: EPlayerState.unstarted,
});

const emit = defineEmits<VVideoPlayerEmits>();

const container = ref<HTMLDivElement | null>(null);
const player = ref<VideoPlayer>();

const handleVolumeChange = (volume: number) => emit('update:volume', volume);
const handleMuteChange = (mute: boolean) => emit('update:mute', mute);
const handlePlayerStateChange = (state: EPlayerState) => emit('update:playerState', state);

onMounted(async () => {
  const apis = await Promise.all([
    youtubePlugin,
    dailymotionPlugin,
    vimeoPlugin,
    soundCloudPlugin,
    mixCloudPlugin,
    twitchPlugin,
    spotifyPlugin,
    streamablePlugin,
    facebookPlugin,
    filePlugin,
    vidyardPlugin,
    wistiaPlugin,
  ].map((loader) => loader()));

  const host = container.value ?? undefined;
  player.value = new VideoPlayer(apis, host);

  player.value.on('volumeChange', handleVolumeChange);
  player.value.on('muteChange', handleMuteChange);
  player.value.on('stateChange', handlePlayerStateChange);

  if (typeof props.url !== 'undefined') {
    player.value.url = props.url;
  }
  player.value.volume = props.volume;
  player.value.mute = props.mute;
  player.value.playerState = props.playerState;
});

watch(() => props.url, (url) => {
  if (player.value) {
    player.value.url = url;
  }
});

watch(() => props.volume, (volume) => {
  if (player.value) {
    player.value.volume = volume;
  }
});

watch(() => props.mute, (mute) => {
  if (player.value) {
    player.value.mute = mute;
  }
});

watch(() => props.playerState, (state) => {
  if (player.value) {
    player.value.playerState = state;
  }
});

onBeforeUnmount(() => {
  if (player.value) {
    player.value.off('volumeChange', handleVolumeChange);
    player.value.off('muteChange', handleMuteChange);
    player.value.off('stateChange', handlePlayerStateChange);
    player.value.destroy();
    player.value = undefined;
  }
});
</script>

<style scoped lang="scss">
.v-video-player {
  display: flex;
  justify-content: center;
  align-items: center;

  > div {
    width: 100%;
  }
}
</style>
