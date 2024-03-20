/* eslint-disable */
export default {
  displayName: 'mintplayer-playlist-controller',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/mintplayer-playlist-controller',
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
