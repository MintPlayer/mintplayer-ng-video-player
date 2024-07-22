/* eslint-disable */
export default {
  displayName: 'mintplayer-soundcloud-player',
  preset: '../../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/platforms/soundcloud-player',
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
