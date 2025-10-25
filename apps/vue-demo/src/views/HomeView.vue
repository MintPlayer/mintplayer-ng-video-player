<script setup lang="ts">
import { ref } from 'vue';
import { VVideoPlayer } from '@mintplayer/v-video-player';
import { EPlayerState } from '@mintplayer/player-provider';

const videos = [
  'https://www.youtube.com/watch?v=tt2k8PGm-TI',
  'https://www.youtube.com/watch?v=YykjpeuMNEk',
  'https://www.youtube.com/watch?v=yFKhgF_vkgs',
  'https://www.youtube.com/live/gCNeDWCI0vo?app=desktop&feature=share',
  'https://www.dailymotion.com/video/x2yhuhb',
  'https://www.dailymotion.com/video/x20zq3f',
  'https://vimeo.com/14190306',
  'https://vimeo.com/82932655',
  'https://soundcloud.com/dario-g/sunchyme-radio-edit',
  'https://soundcloud.com/oasisofficial/whatever',
  'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5',
  'spotify:track:0FDzzruyVECATHXKHFs9eJ',
  'https://www.twitch.tv/jankos',
  'https://www.twitch.tv/dearlola1',
  'https://www.twitch.tv/videos/1920198035',
  'https://www.mixcloud.com/TheChilloutTent/the-chill-out-tent-warriors-of-the-dystotheque',
  'https://www.mixcloud.com/gaby-songs/chillout-your-mind-vol32',
  'https://www.mixcloud.com/radiomonaco/good-vibes-djm4t-29092023',
  'https://www.facebook.com/MetaCanada/videos/801193189918934',
  'https://www.facebook.com/iShareitHD/videos/1269681903839169',
  'https://www.facebook.com/watch/?v=379257177188135',
  'https://video.vidyard.com/watch/6eK8VUFScWLqX2PqgF5S44?',
  'https://video.vidyard.com/watch/TKMKV6sdGhz3Fz5vgAAAw9?',
  'https://home.wistia.com/medias/e4a27b971d',
  'https://home.wistia.com/medias/29b0fbf547',
  'https://streamable.com/moo',
  'https://streamable.com/ifjh',
];

const url = ref<string>();
const volume = ref(50);
const mute = ref(false);
const playerState = ref<EPlayerState>(EPlayerState.unstarted);

const togglePlayback = () => {
  playerState.value =
    playerState.value === EPlayerState.playing
      ? EPlayerState.paused
      : EPlayerState.playing;
};

const onVolumeInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  volume.value = Number(target.value);
};

const onMuteChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  mute.value = target.checked;
};

const onSelectVideo = (video: string) => {
  url.value = video;
};
</script>

<template>
  <main class="home-view">
    <h1 class="title">@mintplayer/v-video-player</h1>
    <div class="layout">
      <aside class="video-list" aria-label="Available videos">
        <h2 class="list-title">Pick a video</h2>
        <ul>
          <li v-for="video in videos" :key="video">
            <button
              type="button"
              class="video-button"
              :class="{ active: video === url }"
              @click="onSelectVideo(video)"
            >
              {{ video }}
            </button>
          </li>
        </ul>
      </aside>
      <section class="player-panel">
        <VVideoPlayer
          class="player"
          :url="url"
          v-model:volume="volume"
          v-model:mute="mute"
          v-model:playerState="playerState"
        />
        <div class="controls">
          <button type="button" class="playback" @click="togglePlayback">
            {{ playerState === EPlayerState.playing ? 'Pause' : 'Play' }}
          </button>
          <label class="volume">
            <span>Volume: {{ volume }}</span>
            <input type="range" min="0" max="100" :value="volume" @input="onVolumeInput" />
          </label>
          <label class="mute">
            <input type="checkbox" :checked="mute" @change="onMuteChange" />
            <span>Mute</span>
          </label>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
.home-view {
  padding: 2rem 1rem;

  .title {
    text-align: center;
    margin-bottom: 2rem;
  }

  .layout {
    display: flex;
    flex-direction: column;
    gap: 2rem;

    @media (min-width: 992px) {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  .video-list {
    flex: 1;
    max-width: 32rem;

    .list-title {
      margin-bottom: 1rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }

    .video-button {
      width: 100%;
      text-align: left;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #d0d5dd;
      background: #f8fafc;
      color: #0f172a;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
      font-size: 0.875rem;

      &.active {
        background: #0f172a;
        color: #f8fafc;
      }

      &:hover {
        background: #e2e8f0;
      }
    }
  }

  .player-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    .player {
      width: 100%;
      min-height: 340px;
      border: 1px solid #d0d5dd;
      border-radius: 0.75rem;
      overflow: hidden;
      background: #000;
      padding: 0.5rem;
    }

    .controls {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      align-items: center;

      .playback {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        border: none;
        background: #2563eb;
        color: #fff;
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: #1d4ed8;
        }
      }

      .volume {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        input[type='range'] {
          width: 100%;
        }
      }

      .mute {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }
  }
}
</style>
