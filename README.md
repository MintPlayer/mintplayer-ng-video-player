# @mintplayer/ng-video-player
## Demo

A working demo application can [be found here](https://video-player.mintplayer.com).
The code is included in the git repository.

## Version info

| License      | Build status | Code coverage |
|--------------|--------------|---------------|
| [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0) | [![master](https://github.com/MintPlayer/mintplayer-ng-video-player/actions/workflows/publish-master.yml/badge.svg)](https://github.com/MintPlayer/mintplayer-ng-video-player/actions/workflows/publish-master.yml) | [![codecov](https://codecov.io/gh/MintPlayer/mintplayer-ng-video-player/branch/master/graph/badge.svg?token=X0G8OV053U)](https://codecov.io/gh/MintPlayer/mintplayer-ng-video-player) |

| Package                             | Version                                                                                                                                                |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| @mintplayer/player-progress      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fplayer-progress.svg)](https://badge.fury.io/js/%40mintplayer%2Fplayer-progress)         |
| @mintplayer/youtube-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fyoutube-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fyoutube-player)           |
| @mintplayer/vimeo-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fvimeo-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fvimeo-player)               |
| @mintplayer/soundcloud-player    | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fsoundcloud-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fsoundcloud-player)     |
| @mintplayer/spotify-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fspotify-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fspotify-player)           |
| @mintplayer/twitch-player        | [![npm version](https://badge.fury.io/js/%40mintplayer%2Ftwitch-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-twitch-player)             |
| @mintplayer/facebook-player      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Ffacebook-player.svg)](https://badge.fury.io/js/%40mintplayer%2Ffacebook-player)         |
| @mintplayer/mixcloud-player      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fmixcloud-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fmixcloud-player)         |
| @mintplayer/streamable-player    | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fstreamable-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fstreamable-player)     |
| @mintplayer/vidyard-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fvidyard-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fvidyard-player)           |
| @mintplayer/wistia-player        | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fwistia-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fwistia-player)             |
| @mintplayer/file-player          | [![npm version](https://badge.fury.io/js/%40mintplayer%2Ffile-player.svg)](https://badge.fury.io/js/%40mintplayer%2Ffile-player)                 |
| @mintplayer/playlist-controller  | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fplaylist-controller.svg)](https://badge.fury.io/js/%40mintplayer%2Fplaylist-controller) |
| @mintplayer/video-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fvideo-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fvideo-player)               |
| @mintplayer/ng-video-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-video-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-video-player)               |

## Important note

Since version 16.1, the dependency graph between the project has changed.
The `ng-video-player` package no longer depends on `ng-youtube-player`, `ng-vimeo-player` and `ng-soundcloud-player`. But now it's the other way around. See the installation instructions below for the updated packages.

## Installation

Run the corresponding commands, depending on what players you want to support in your application:

    npm i @mintplayer/ng-video-player

    npm i @mintplayer/youtube-player
    npm i @mintplayer/vimeo-player
    npm i @mintplayer/soundcloud-player
    npm i @mintplayer/spotify-player
    npm i @mintplayer/twitch-player
    npm i @mintplayer/facebook-player
    npm i @mintplayer/mixcloud-player
    npm i @mintplayer/streamable-player
    npm i @mintplayer/vidyard-player
    npm i @mintplayer/wistia-player
    npm i @mintplayer/file-player

## Usage
Import the modules for which you want to support a player:

```ts
@NgModule({
    ...,
    imports: [
        ...,
        VideoPlayerComponent,
    ]
    providers: [
        provideVideoApis(
            youtubePlugin,
            vimeoPlugin,
            soundCloudPlugin,
            mixCloudPlugin,
            twitchPlugin,
            spotifyPlugin,
            streamablePlugin,
            facebookPlugin,
            filePlugin,
            vidyardPlugin,
            wistiaPlugin
        )
    ]
})
```

Use the component in the template:

```html
<video-player [width]="width" [height]="height" [autoplay]="true"
    [(volume)]="volume" [(mute)]="isMuted" [(playerState)]="playerState"
    (progressChange)="onProgressChange($event)" (isPipChange)="isPip = $event" #player1></video-player>

```

```ts
@ViewChild('player1') player1!: VideoPlayerComponent;
playVideo(video: string) {
    // This will replay the video when the url is the same.
    this.player1.setUrl(video);

    return false;
}
```

Or use the `url` input binding:

```html
<video-player [width]="width" [height]="height" [autoplay]="true" [url]="url"
    [(volume)]="volume" [(mute)]="isMuted" [(playerState)]="playerState"
    (progressChange)="onProgressChange($event)" (isPipChange)="isPip = $event"></video-player>

```

```ts
url: string | null = null;
playVideo(video: string) {
    // This will not replay the video when the url is the same.
    this.url = video;
    return false;
}
```

## Components
All components are showcased in the angular app included in the project. You can simply run

    npm start -- --open

to discover them.

## Discover yourself
Make sure you have [NodeJS](https://nodejs.org/en/download/) installed.
Then run following commands

    git clone https://github.com/MintPlayer/mintplayer-ng-video-player
    npm i
    npm start -- --open

## Docker image
You can run the docker image which is published to the GitHub Container Registry

    docker run -p 4200:80 ghcr.io/mintplayer/mintplayer-ng-video-player:master

and visit [http://localhost:4200](http://localhost:4200).