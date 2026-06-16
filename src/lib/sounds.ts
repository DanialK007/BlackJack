export function playSound(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;

  void audio.play().catch(() => {
    // Browsers can block audio until the first user gesture.
  });
}
