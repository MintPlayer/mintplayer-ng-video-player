import { useEffect } from 'react';
import styles from './r-video-player.module.scss';

export function RVideoPlayer({ title, counter, likes }: { title: string, counter: number, likes: number }) {
  useEffect(() => {
    console.log('Counter changed', counter);
  }, [counter]);

  return (
    <div className={styles['container']}>
      <h1>Welcome to {title}!</h1>
      <h2>Counter {counter}</h2>
    </div>
  );
}

export default RVideoPlayer;
