import { VideoEventMap } from "./event-map";

export interface EventHandler<K extends keyof VideoEventMap> {
    event: K;
    handler: (args: VideoEventMap[K]) => void;
}