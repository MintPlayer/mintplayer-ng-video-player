/* eslint-disable */
export default {
  displayName: 'mintplayer-wistia-player',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/mintplayer-wistia-player',
  globals: {},
  testEnvironment: 'node',
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