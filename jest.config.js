module.exports = {
  preset: 'jest-expo',
  // jest.setup.js đã có sẵn nhưng chưa được nối vào config nên mock AsyncStorage
  // không bao giờ chạy — mọi test import store đều nổ "NativeModule: AsyncStorage is null"
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
