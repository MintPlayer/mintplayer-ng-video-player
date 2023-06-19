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
| @mintplayer/ng-player-progress      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-player-progress.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-player-progress)         |
| @mintplayer/ng-youtube-api          | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-youtube-api.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-youtube-api)                 |
| @mintplayer/ng-youtube-player       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-youtube-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-youtube-player)           |
| @mintplayer/ng-dailymotion-api      | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-dailymotion-api.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-dailymotion-api)         |
| @mintplayer/ng-dailymotion-player   | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-dailymotion-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-dailymotion-player)   |
| @mintplayer/ng-vimeo-api            | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-vimeo-api.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-vimeo-api)                     |
| @mintplayer/ng-vimeo-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-vimeo-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-vimeo-player)               |
| @mintplayer/ng-soundcloud-api       | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-soundcloud-api.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-soundcloud-api)           |
| @mintplayer/ng-soundcloud-player    | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-soundcloud-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-soundcloud-player)     |
| @mintplayer/ng-playlist-controller  | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-playlist-controller.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-playlist-controller) |
| @mintplayer/ng-video-player         | [![npm version](https://badge.fury.io/js/%40mintplayer%2Fng-video-player.svg)](https://badge.fury.io/js/%40mintplayer%2Fng-video-player)               |

## Important note

Since version 16.1, the dependency graph between the project has changed.
The `ng-video-player` package no longer depends on `ng-youtube-player`, `ng-dailymotion-player`, `ng-vimeo-player` and `ng-soundcloud-player`. But now it's the other way around. See the installation instructions below for the updated packages.

## Installation

Run the corresponding commands, depending on what players you want to support in your application:

    npm i @mintplayer/ng-youtube-player
    npm i @mintplayer/ng-dailymotion-player
    npm i @mintplayer/ng-vimeo-player
    npm i @mintplayer/ng-soundcloud-player

This should also install the peerDependencies (like `@mintplayer/ng-video-player`) in your project.

## Usage
Import the modules for which you want to support a player:

```
@NgModule({
    ...,
    imports: [
        ...,
        YoutubePlayerModule,
        DailymotionPlayerModule,
        VimeoPlayerModule,
        SoundcloudPlayerModule,
    ]
})
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
