/* eslint-disable */
export default {
  displayName: 'mintplayer-player-progress',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/mintplayer-player-progress',
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

