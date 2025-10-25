<template>
  <section class="about-view">
    <h1>About this demo</h1>
    <p>
      This Vue showcase renders the framework agnostic video player from the
      <code>@mintplayer</code> suite. Use the navigation to return to the demo
      and experiment with the controls or pick a different video provider.
    </p>
  </section>
</template>

<style scoped lang="scss">
.about-view {
  padding: 4rem 1.5rem;
  max-width: 48rem;
  margin: 0 auto;
  color: #0f172a;
  background: #f8fafc;
  border-radius: 1rem;
  box-shadow: 0 20px 35px rgba(15, 23, 42, 0.2);

  h1 {
    margin-bottom: 1.5rem;
    color: #1e293b;
  }

  p {
    line-height: 1.7;
    font-size: 1.05rem;
  }

  code {
    background: rgba(148, 163, 184, 0.35);
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
  }
}
</style>
