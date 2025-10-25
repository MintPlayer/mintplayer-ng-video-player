<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <nav aria-label="Main navigation">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 45%, #f8fafc 100%);
  color: #f8fafc;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    padding: 1rem 2rem;

    nav {
      display: flex;
      gap: 1.5rem;
      justify-content: center;

      a {
        color: #e2e8f0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.875rem;
        text-decoration: none;
        transition: color 0.2s ease;

        &.router-link-active,
        &:hover {
          color: #38bdf8;
        }
      }
    }
  }
}
</style>
