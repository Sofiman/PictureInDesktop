module.exports = {
  category: 'Default',
  getStreamURL: function getStreamURL(inputURL) {
      const regex = /((?:https?:)?\/\/)?vimeo.com\/([0-9]+)/;
      let result = undefined;
      if (regex.test(inputURL)) {
          let groups = regex.exec(inputURL);
          if (groups && groups[2]) {
              result = `https://player.vimeo.com/video/${groups[2]}`;
          }
      }

      return result;
  }
};
