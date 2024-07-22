/* eslint-disable */
export default {
  displayName: 'mintplayer-facebook-player',
  preset: '../../../jest.preset.js',
  coverageDirectory: '../../coverage/libs/platforms/facebook-player',
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
