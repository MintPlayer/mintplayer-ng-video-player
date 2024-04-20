/* eslint-disable */
export default {
  displayName: 'mintplayer-player-provider',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/mintplayer-player-provider',
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
