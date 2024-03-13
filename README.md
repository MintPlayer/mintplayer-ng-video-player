# @mintplayer/ng-video-player
## ⚠️ IMPORTANT UPDATE ⚠️
In a [recent post](https://github.com/dailymotion/dailymotion-sdk-js), DailyMotion has announced that they are about to deprecate the Javascript SDK.
You will need to register and generate an API key in order to use the SDK.
Because of this change in development, we will be

⚠️ **DROPPING SUPPORT FOR THE DAILYMOTION PLAYER** ⚠️

in the near future. So as soon as the `DM.player` api is taken down, this functionality will be removed from the library.

As of why we do this, the explaination is very simple. We absolutely want to support an open development ecosystem. Obviously, registration for services does not mix well. Just to test the new SDK, I've tried going through the steps of embedding a player somewhere. Following steps are needed to accomplish this:

- Create an account on their partnership website
- Add your domain to your account profile
- Perform some kind of domain ownership proof
- Wait 24 hours until someone of the company manually performs the verification
- Get a key for your domain
- Finally you can use this key to embed a player on your website
- Highly likely you'll be bumping quota and getting bills in your mailbox

## Demo

A working demo application can [be found here](https://video-player.mintplayer.com).
The code is included in the git repository.

## Version info

| License      | Build status | Code coverage |
|--------------|--------------|---------------|
| [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0) | [![master](https://github.com/MintPlayer/mintplayer-ng-video-player/actions/workflows/publish-master.yml/badge.svg)](https://github.com/MintPlayer/mintplayer-ng-video-player/actions/workflows/publish-master.yml) | [![codecov](https://codecov.io/gh/MintPlayer/mintplayer-ng-video-player/branch/master/graph/badge.svg?token=X0G8OV053U)](https://codecov.io/gh/MintPlayer/mintplayer-ng-video-player) |

| Package                             | Version                                                                                                                                                |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| @mintplayer/player-progress      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-player-progress.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-player-progress)         |
| @mintplayer/youtube-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-youtube-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-youtube-player)           |
| @mintplayer/ng-dailymotion-player   | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-dailymotion-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-dailymotion-player)   |
| @mintplayer/ng-vimeo-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-vimeo-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-vimeo-player)               |
| @mintplayer/ng-soundcloud-player    | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-soundcloud-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-soundcloud-player)     |
| @mintplayer/ng-spotify-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-spotify-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-spotify-player)           |
| @mintplayer/ng-twitch-player        | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-twitch-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-twitch-player)             |
| @mintplayer/ng-facebook-player      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-facebook-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-facebook-player)         |
| @mintplayer/ng-mixcloud-player      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-mixcloud-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-mixcloud-player)         |
| @mintplayer/ng-streamable-player    | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-streamable-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-streamable-player)     |
| @mintplayer/ng-vidyard-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-vidyard-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-vidyard-player)           |
| @mintplayer/ng-wistia-player        | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-wistia-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-wistia-player)             |
| @mintplayer/ng-file-player          | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-file-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-file-player)                 |
| @mintplayer/ng-playlist-controller  | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-playlist-controller.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-playlist-controller) |
| @mintplayer/ng-video-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-video-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-video-player)               |

## Important note

Since version 16.1, the dependency graph between the project has changed.
The `ng-video-player` package no longer depends on `ng-youtube-player`, `ng-dailymotion-player`, `ng-vimeo-player` and `ng-soundcloud-player`. But now it's the other way around. See the installation instructions below for the updated packages.

## Installation

Run the corresponding commands, depending on what players you want to support in your application:

    npm i @mintplayer/youtube-player
    npm i @mintplayer/ng-dailymotion-player
    npm i @mintplayer/ng-vimeo-player
    npm i @mintplayer/ng-soundcloud-player
    npm i @mintplayer/ng-spotify-player
    npm i @mintplayer/ng-twitch-player
    npm i @mintplayer/ng-facebook-player
    npm i @mintplayer/ng-mixcloud-player
    npm i @mintplayer/ng-streamable-player
    npm i @mintplayer/ng-vidyard-player
    npm i @mintplayer/ng-wistia-player
    npm i @mintplayer/ng-file-player

This should also install the peerDependencies (like `@mintplayer/ng-video-player`) in your project.

## Usage
Import the modules for which you want to support a player:

```ts
@NgModule({
    ...,
    imports: [
        ...,
        YoutubePlayerModule,
        DailymotionPlayerModule,
        VimeoPlayerModule,
        SoundcloudPlayerModule,
        SpotifyPlayerModule,
        TwitchPlayerModule,
        FacebookPlayerModule,
        MixcloudPlayerModule,
        StreamablePlayerModule,
        VidyardPlayerModule,
        WistiaPlayerModule,
        FilePlayerModule,
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
