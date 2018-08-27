module.exports = {
  category: 'Default',
  getStreamURL: function getStreamURL(inputURL) {
      const regex = /(https?)?:\/\/w\.soundcloud\.com\/player\/\?url=(.+)"/;
      return regex.test(inputURL) ? regex.exec(inputURL)[0] : undefined;
  },
  darkMode: true
};
