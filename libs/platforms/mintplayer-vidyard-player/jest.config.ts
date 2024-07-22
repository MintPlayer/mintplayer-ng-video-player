/* eslint-disable */
export default {
  displayName: 'mintplayer-vidyard-player',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/mintplayer-vidyard-player',
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
