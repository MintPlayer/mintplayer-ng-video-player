import styles from './r-video-player.module.scss';

export function RVideoPlayer({ title }: { title: string }) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to {title}!</h1>
    </div>
  );
}

export default RVideoPlayer;
