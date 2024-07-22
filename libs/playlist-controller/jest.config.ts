/* eslint-disable */
export default {
  displayName: 'playlist-controller',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/playlist-controller',
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
