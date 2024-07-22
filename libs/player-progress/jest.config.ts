/* eslint-disable */
export default {
  displayName: 'mintplayer-player-progress',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/player-progress',
  globals: {},
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
};

