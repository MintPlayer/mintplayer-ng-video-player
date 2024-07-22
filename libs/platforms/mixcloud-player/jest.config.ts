/* eslint-disable */
export default {
  displayName: 'mintplayer-mixcloud-player',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/platforms/mixcloud-player',
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
