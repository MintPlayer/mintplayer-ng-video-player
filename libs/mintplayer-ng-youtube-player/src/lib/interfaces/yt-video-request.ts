export interface YtVideoRequest {
    action: 'playVideoById' | 'cueVideoById';
    parameter: string;
}