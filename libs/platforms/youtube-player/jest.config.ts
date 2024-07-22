/* eslint-disable */
export default {
  displayName: 'mintplayer-youtube-player',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/platforms/youtube-player',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};
